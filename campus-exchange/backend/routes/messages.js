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

  const { recipientId, message, listingId, listingTitle } = req.body;
  if (!recipientId || !message) {
    return res.status(400).json({ error: 'recipientId and message required' });
  }

  try {
    const data = {
      senderId,
      senderEmail,
      recipientId,
      message,
      listingId   : listingId    || null,
      listingTitle: listingTitle || '',
      read        : false,
      createdAt   : admin.firestore.FieldValue.serverTimestamp()
    };
    const ref = await db.collection('messages').add(data);
    res.status(201).json({ id: ref.id, ...data });
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

/* ────────── GET /api/messages/stream (SSE) ────────── */
router.get('/stream', (req, res) => {
  const uid = req.userUid;

  res.set({
    'Cache-Control': 'no-cache',
    'Content-Type' : 'text/event-stream',
    Connection     : 'keep-alive'
  });
  res.flushHeaders();

  const unsub = db.collection('messages')
                  .where('recipientId', '==', uid)
                  .onSnapshot(snap => {
    const msgs = [];
    snap.forEach(d => msgs.push({ id: d.id, ...d.data() }));
    res.write(`data: ${JSON.stringify(msgs)}\n\n`);
  });

  req.on('close', () => unsub());
});

module.exports = router;
