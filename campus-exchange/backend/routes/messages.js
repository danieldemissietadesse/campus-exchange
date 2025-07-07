const express = require('express');
const admin   = require('firebase-admin');

const router = express.Router();
const db = admin.firestore();

// Store active SSE connections for real-time updates
const activeConnections = new Map();

/* ────────── GET /api/messages (all sent & received) ────────── */
router.get('/', async (req, res) => {
  const uid = req.userUid;
  try {
    const [sentSnap, recvSnap] = await Promise.all([
      db.collection('messages').where('senderId',    '==', uid).get(),
      db.collection('messages').where('recipientId', '==', uid).get()
    ]);

    const msgs = [];
    sentSnap.forEach(d  => msgs.push({ id: d.id, type: 'sent',     ...d.data() }));
    recvSnap.forEach(d => msgs.push({ id: d.id, type: 'received', ...d.data() }));

    msgs.sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    res.json(msgs);
  } catch (err) {
    console.error('Fetch messages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

/* ────────── POST /api/messages (send) ────────── */
router.post('/', async (req, res) => {
  const senderId    = req.userUid;
  const senderEmail = req.decodedToken?.email || 'dev@localhost';

  const { recipientId, message, listingId, listingTitle, recipientEmail } = req.body;
  
  if (!recipientId || !message) {
    return res.status(400).json({ error: 'recipientId and message required' });
  }

  try {
    const data = {
      senderId,
      senderEmail,
      recipientId,
      recipientEmail: recipientEmail || '',
      listingId   : listingId    || null,
      listingTitle: listingTitle || '',
      message,
      read        : false,
      createdAt   : admin.firestore.FieldValue.serverTimestamp()
    };
    
    console.log('Creating message:', data);
    const ref = await db.collection('messages').add(data);
    
    // Get the created message with server timestamp
    const createdDoc = await ref.get();
    const createdMessage = { id: ref.id, ...createdDoc.data() };
    
    // Try to notify via SSE, but don't fail if it doesn't work
    try {
      await notifyUserOfNewMessage(senderId, createdMessage);
      await notifyUserOfNewMessage(recipientId, createdMessage);
    } catch (notifyError) {
      console.warn('⚠️ SSE notification failed, but message was saved:', notifyError.message);
    }
    
    console.log(`📤 Message sent from ${senderEmail} to ${recipientEmail}`);
    
    res.status(201).json(createdMessage);
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/* ────────── PATCH /api/messages/:id/read ────────── */
router.patch('/:id/read', async (req, res) => {
  try {
    await db.collection('messages').doc(req.params.id).update({ read: true });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

/* ────────── HELPER: Notify user of new message via SSE ────────── */
async function notifyUserOfNewMessage(userId, newMessage) {
  const connection = activeConnections.get(userId);
  if (!connection) {
    console.log(`📭 No active SSE connection for user ${userId}`);
    return;
  }

  try {
    // Check if connection is still writable
    if (connection.destroyed || connection.writableEnded) {
      console.log(`🔌 Connection for user ${userId} is closed, removing from active connections`);
      activeConnections.delete(userId);
      return;
    }

    // Fetch all messages for this user to send complete update
    const [sentSnap, recvSnap] = await Promise.all([
      db.collection('messages').where('senderId', '==', userId).get(),
      db.collection('messages').where('recipientId', '==', userId).get()
    ]);

    const msgs = [];
    sentSnap.forEach(d => {
      const data = d.data();
      msgs.push({ 
        id: d.id, 
        type: 'sent',
        ...data,
        createdAt: data.createdAt ? { seconds: data.createdAt.seconds } : null
      });
    });
    
    recvSnap.forEach(d => {
      const data = d.data();
      msgs.push({ 
        id: d.id, 
        type: 'received',
        ...data,
        createdAt: data.createdAt ? { seconds: data.createdAt.seconds } : null
      });
    });

    // Sort by timestamp (newest first)
    msgs.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });
    
    const message = JSON.stringify({ 
      type: 'messages', 
      data: msgs,
      timestamp: Date.now(),
      userId: userId,
      trigger: 'new_message'
    });
    
    connection.write(`data: ${message}\n\n`);
    console.log(`🔔 Sent real-time update to user ${userId} with ${msgs.length} messages`);
    
  } catch (error) {
    console.error(`❌ Error notifying user ${userId}:`, error);
    // Remove the connection if it's broken
    activeConnections.delete(userId);
  }
}

/* ────────── GET /api/messages/stream (SSE) - ROBUST VERSION ────────── */
router.get('/stream', (req, res) => {
  const uid = req.userUid;
  console.log(`🔗 SSE connection request for user: ${uid}`);

  // Set SSE headers with more robust configuration
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control, Authorization',
    'X-Accel-Buffering': 'no' // Disable nginx buffering
  });
  res.flushHeaders();

  // Store this connection for real-time notifications
  activeConnections.set(uid, res);
  console.log(`📝 Stored SSE connection for user ${uid} (total: ${activeConnections.size})`);

  // Send initial heartbeat
  try {
    res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now(), userId: uid })}\n\n`);
    console.log(`💓 Sent heartbeat to user ${uid}`);
  } catch (error) {
    console.error(`❌ Failed to send initial heartbeat to user ${uid}:`, error);
    activeConnections.delete(uid);
    return;
  }

  // Send initial messages
  sendInitialMessages(uid, res);

  // Create Firestore listeners for real-time updates
  let sentListener = null;
  let receivedListener = null;
  
  try {
    sentListener = db.collection('messages')
      .where('senderId', '==', uid)
      .onSnapshot(snap => {
        console.log(`📤 Sent messages update for user ${uid}: ${snap.size} messages`);
        sendMessagesUpdate(uid, res);
      }, (error) => {
        console.error('❌ Sent messages listener error for user', uid, ':', error);
      });

    receivedListener = db.collection('messages')
      .where('recipientId', '==', uid)
      .onSnapshot(snap => {
        console.log(`📥 Received messages update for user ${uid}: ${snap.size} messages`);
        sendMessagesUpdate(uid, res);
      }, (error) => {
        console.error('❌ Received messages listener error for user', uid, ':', error);
      });
  } catch (error) {
    console.error(`❌ Failed to create Firestore listeners for user ${uid}:`, error);
  }

  // Function to send initial messages
  async function sendInitialMessages(userId, response) {
    try {
      const [sentSnap, recvSnap] = await Promise.all([
        db.collection('messages').where('senderId', '==', userId).get(),
        db.collection('messages').where('recipientId', '==', userId).get()
      ]);

      const msgs = [];
      sentSnap.forEach(d => {
        const data = d.data();
        msgs.push({ 
          id: d.id, 
          type: 'sent',
          ...data,
          createdAt: data.createdAt ? { seconds: data.createdAt.seconds } : null
        });
      });
      
      recvSnap.forEach(d => {
        const data = d.data();
        msgs.push({ 
          id: d.id, 
          type: 'received',
          ...data,
          createdAt: data.createdAt ? { seconds: data.createdAt.seconds } : null
        });
      });

      msgs.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
      
      console.log(`📤 Sending ${msgs.length} initial messages to user ${userId}`);
      
      const message = JSON.stringify({ 
        type: 'messages', 
        data: msgs,
        timestamp: Date.now(),
        userId: userId,
        trigger: 'initial_load'
      });
      
      if (activeConnections.has(userId) && !response.destroyed) {
        response.write(`data: ${message}\n\n`);
      }
      
    } catch (error) {
      console.error('❌ SSE initial messages error:', error);
    }
  }

  // Function to fetch and send all messages for the user
  async function sendMessagesUpdate(userId, response) {
    try {
      // Check if connection is still active
      if (!activeConnections.has(userId) || response.destroyed) {
        console.log(`🔌 Connection for user ${userId} is no longer active`);
        return;
      }

      const [sentSnap, recvSnap] = await Promise.all([
        db.collection('messages').where('senderId', '==', userId).get(),
        db.collection('messages').where('recipientId', '==', userId).get()
      ]);

      const msgs = [];
      sentSnap.forEach(d => {
        const data = d.data();
        msgs.push({ 
          id: d.id, 
          type: 'sent',
          ...data,
          createdAt: data.createdAt ? { seconds: data.createdAt.seconds } : null
        });
      });
      
      recvSnap.forEach(d => {
        const data = d.data();
        msgs.push({ 
          id: d.id, 
          type: 'received',
          ...data,
          createdAt: data.createdAt ? { seconds: data.createdAt.seconds } : null
        });
      });

      msgs.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
      
      console.log(`📤 Sending ${msgs.length} updated messages to user ${userId}`);
      
      const message = JSON.stringify({ 
        type: 'messages', 
        data: msgs,
        timestamp: Date.now(),
        userId: userId,
        trigger: 'firestore_update'
      });
      
      response.write(`data: ${message}\n\n`);
      
    } catch (error) {
      console.error('❌ SSE message processing error:', error);
      activeConnections.delete(userId);
      try {
        response.write(`data: ${JSON.stringify({ 
          type: 'error', 
          message: 'Processing error',
          timestamp: Date.now() 
        })}\n\n`);
      } catch (writeError) {
        console.error('❌ Failed to write error message:', writeError);
      }
    }
  }

  // Cleanup function
  const cleanup = () => {
    console.log(`🧹 Cleaning up connection for user ${uid}`);
    activeConnections.delete(uid);
    if (sentListener) sentListener();
    if (receivedListener) receivedListener();
    if (heartbeatInterval) clearInterval(heartbeatInterval);
  };

  // Handle client disconnect
  req.on('close', () => {
    console.log(`🔌 SSE connection closed for user ${uid}`);
    cleanup();
  });

  req.on('error', (error) => {
    console.error(`❌ SSE request error for user ${uid}:`, error);
    cleanup();
  });

  res.on('error', (error) => {
    console.error(`❌ SSE response error for user ${uid}:`, error);
    cleanup();
  });

  res.on('close', () => {
    console.log(`🔌 SSE response closed for user ${uid}`);
    cleanup();
  });

  // Periodic heartbeat to keep connection alive
  const heartbeatInterval = setInterval(() => {
    try {
      if (activeConnections.has(uid) && !res.destroyed) {
        res.write(`data: ${JSON.stringify({ 
          type: 'heartbeat', 
          timestamp: Date.now(),
          userId: uid 
        })}\n\n`);
        console.log(`💓 Heartbeat sent to user ${uid}`);
      } else {
        console.log(`💔 Heartbeat skipped for user ${uid} - connection not active`);
        cleanup();
      }
    } catch (error) {
      console.error('❌ Heartbeat error:', error);
      cleanup();
    }
  }, 15000); // Every 15 seconds
});

/* ────────── GET /api/conversations/:listingId (get conversation thread) ────────── */
router.get('/conversations/:listingId', async (req, res) => {
  const { listingId } = req.params;
  const currentUserId = req.userUid;
  const { otherUserId } = req.query;

  if (!otherUserId) {
    return res.status(400).json({ error: 'otherUserId query parameter required' });
  }

  try {
    const [sentMessages, receivedMessages] = await Promise.all([
      db.collection('messages')
        .where('listingId', '==', listingId)
        .where('senderId', '==', currentUserId)
        .where('recipientId', '==', otherUserId)
        .get(),
      db.collection('messages')
        .where('listingId', '==', listingId)
        .where('senderId', '==', otherUserId)
        .where('recipientId', '==', currentUserId)
        .get()
    ]);

    const messages = [];
    
    sentMessages.forEach(doc => {
      messages.push({ id: doc.id, type: 'sent', ...doc.data() });
    });
    
    receivedMessages.forEach(doc => {
      messages.push({ id: doc.id, type: 'received', ...doc.data() });
    });

    messages.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return aTime - bTime;
    });

    res.json(messages);
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

module.exports = router;

