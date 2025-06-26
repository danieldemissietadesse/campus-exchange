const express = require('express');
const admin   = require('firebase-admin');

const router = express.Router();
const db = admin.firestore();

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
    
    // Return the created message with the ID
    const createdMessage = { id: ref.id, ...data };
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

/* ────────── GET /api/messages/stream (SSE) - FIXED VERSION ────────── */
router.get('/stream', (req, res) => {
  const uid = req.userUid;
  console.log(`🔗 SSE connection request for user: ${uid}`);

  res.set({
    'Cache-Control': 'no-cache',
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });
  res.flushHeaders();

  // Send initial heartbeat
  res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now(), userId: uid })}\n\n`);
  console.log(`💓 Sent heartbeat to user ${uid}`);

  // Create Firestore listener with proper error handling
  const unsub = db.collection('messages')
                  .where('recipientId', '==', uid)  // Only messages FOR this user
                  .orderBy('createdAt', 'desc')
                  .onSnapshot(snap => {
    try {
      const msgs = [];
      snap.forEach(d => {
        const data = d.data();
        msgs.push({ 
          id: d.id, 
          type: 'received',
          ...data,
          // Convert Firestore timestamp to seconds for frontend
          createdAt: data.createdAt ? { seconds: data.createdAt.seconds } : null
        });
      });
      
      console.log(`📤 Sending ${msgs.length} messages to user ${uid}`);
      
      // Send as structured message
      const message = JSON.stringify({ 
        type: 'messages', 
        data: msgs,
        timestamp: Date.now(),
        userId: uid
      });
      
      res.write(`data: ${message}\n\n`);
      
    } catch (error) {
      console.error('❌ SSE message processing error:', error);
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        message: 'Processing error',
        timestamp: Date.now() 
      })}\n\n`);
    }
  }, (error) => {
    console.error('❌ Firestore listener error for user', uid, ':', error);
    res.write(`data: ${JSON.stringify({ 
      type: 'error', 
      message: 'Database connection error',
      timestamp: Date.now() 
    })}\n\n`);
  });

  // Handle client disconnect
  req.on('close', () => {
    console.log(`🔌 SSE connection closed for user ${uid}`);
    unsub();
  });

  req.on('error', (error) => {
    console.error(`❌ SSE request error for user ${uid}:`, error);
    unsub();
  });

  // Periodic heartbeat to keep connection alive
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(`data: ${JSON.stringify({ 
        type: 'heartbeat', 
        timestamp: Date.now(),
        userId: uid 
      })}\n\n`);
    } catch (error) {
      console.error('❌ Heartbeat error:', error);
      clearInterval(heartbeatInterval);
    }
  }, 30000); // Every 30 seconds

  // Clean up heartbeat on disconnect
  req.on('close', () => {
    clearInterval(heartbeatInterval);
  });
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
    // Get all messages between these two users for this listing
    const [sentMessages, receivedMessages] = await Promise.all([
      db.collection('messages')
        .where('listingId', '==', listingId)
        .where('senderId', '==', currentUserId)
        .where('recipientId', '==', otherUserId)
        .orderBy('createdAt', 'asc')
        .get(),
      db.collection('messages')
        .where('listingId', '==', listingId)
        .where('senderId', '==', otherUserId)
        .where('recipientId', '==', currentUserId)
        .orderBy('createdAt', 'asc')
        .get()
    ]);

    const messages = [];
    
    sentMessages.forEach(doc => {
      messages.push({ id: doc.id, type: 'sent', ...doc.data() });
    });
    
    receivedMessages.forEach(doc => {
      messages.push({ id: doc.id, type: 'received', ...doc.data() });
    });

    // Sort by timestamp
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