const express = require('express');
const admin   = require('firebase-admin');

const router = express.Router();
const db = admin.firestore();

// Store active SSE (Server-Sent Events) connections by user UID
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
    sentSnap.forEach(d  => msgs.push({ id: d.id, ...d.data() }));
    recvSnap.forEach(d => msgs.push({ id: d.id, ...d.data() }));

    // Sort by timestamp, handling potential nulls
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
  const senderEmail = req.decodedToken?.email;
  const { recipientId, message, listingId, listingTitle, recipientEmail } = req.body;

  if (!recipientId || !message || !senderEmail) {
    return res.status(400).json({ error: 'recipientId, message, and senderEmail are required' });
  }

  try {
    const data = {
      senderId,
      senderEmail,
      recipientId,
      recipientEmail: recipientEmail || '', // Ensure recipientEmail exists
      listingId   : listingId    || null,
      listingTitle: listingTitle || '',
      message,
      read        : false,
      createdAt   : admin.firestore.FieldValue.serverTimestamp()
    };

    const ref = await db.collection('messages').add(data);
    const createdDoc = await ref.get();
    const newMessage = { id: ref.id, ...createdDoc.data() };

    // Notify connected sender and recipient via SSE
    notifyUser(senderId, newMessage);
    notifyUser(recipientId, newMessage);

    console.log(`📤 Message sent from ${senderEmail} to ${recipientEmail}`);
    res.status(201).json(newMessage);
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/* ────────── GET /api/messages/stream (SSE for real-time updates) ────────── */
router.get('/stream', (req, res) => {
  const uid = req.userUid;
  
  // Configure SSE headers
  res.set({
    'Cache-Control': 'no-cache',
    'Content-Type' : 'text/event-stream',
    'Connection'   : 'keep-alive'
  });
  res.flushHeaders();

  // Store the connection
  activeConnections.set(uid, res);
  console.log(`🔗 SSE connection established for user: ${uid} (Total: ${activeConnections.size})`);

  // Send a connection confirmation event
  res.write(`data: ${JSON.stringify({ type: 'connection_established' })}\n\n`);

  // Remove the connection when the client disconnects
  req.on('close', () => {
    activeConnections.delete(uid);
    console.log(`🔌 SSE connection closed for user: ${uid} (Total: ${activeConnections.size})`);
  });
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

/**
 * Helper function to send a message to a user via their active SSE connection.
 * @param {string} userId - The UID of the user to notify.
 * @param {object} data - The data payload to send.
 */
function notifyUser(userId, data) {
  const connection = activeConnections.get(userId);
  if (connection && !connection.writableEnded) {
    connection.write(`data: ${JSON.stringify(data)}\n\n`);
    console.log(`🔔 Sent real-time update to user ${userId}`);
  } else {
    console.log(`📭 No active SSE connection for user ${userId}`);
  }
}

module.exports = router;