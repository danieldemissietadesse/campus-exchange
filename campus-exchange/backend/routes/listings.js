const express = require('express');
const admin   = require('firebase-admin');
const multer  = require('multer');

const router  = express.Router();
const db      = admin.firestore();
const bucket  = admin.storage().bucket();
const upload  = multer({ storage: multer.memoryStorage() });

/* ────────── GET /api/listings (search + cursor pagination) ────────── */
router.get('/', async (req, res) => {
  try {
    /* query params */
    const {
      category   = 'All',
      q          = '',
      minPrice   = 0,
      maxPrice   = Number.MAX_SAFE_INTEGER,
      pageSize   = 12,
      cursor
    } = req.query;

    /* base query */
    let query = db.collection('listings')
                  .where('price', '>=', Number(minPrice))
                  .where('price', '<=', Number(maxPrice))
                  .orderBy('price')
                  .limit(Number(pageSize));

    if (category !== 'All') {
      query = query.where('category', '==', category);
    }

    if (cursor) {
      const cursorDoc = await db.collection('listings').doc(cursor).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }

    const snap = await query.get();

    const docs = snap.docs.filter(d => {
      if (!q) return true;
      const text = `${d.get('title')} ${d.get('description')}`.toLowerCase();
      return text.includes(q.toLowerCase());
    });

    const listings   = docs.map(d => ({ id: d.id, ...d.data() }));
    const nextCursor = snap.docs.length === Number(pageSize)
                     ? snap.docs[snap.docs.length - 1].id
                     : null;

    res.json({ listings, nextCursor });
  } catch (err) {
    console.error('List fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

/* ────────── POST /api/listings (create + image upload) ───────────── */
router.post('/', upload.array('images', 6), async (req, res) => {
  try {
    const { title, description, price, category } = req.body;

    const docRef = db.collection('listings').doc();
    const data = {
      title,
      description,
      price   : Number(price),
      category,
      userId  : req.userUid,
      userEmail: req.decodedToken?.email || 'dev@localhost', // Add this line
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      imageUrls: []
    };


    if (req.files?.length) {
      const urls = await Promise.all(
        req.files.map(async file => {
          const name = `listings/${docRef.id}/${Date.now()}_${file.originalname}`;
          const ref  = bucket.file(name);
          await ref.save(file.buffer, { contentType: file.mimetype });
          await ref.makePublic().catch(() => {});
          return `https://storage.googleapis.com/${bucket.name}/${name}`;
        })
      );
      data.imageUrls = urls;
    }

    await docRef.set(data);
    res.status(201).json({ id: docRef.id, ...data });
  } catch (err) {
    console.error('Create listing error:', err);
    res.status(500).json({ error: 'Failed to create listing' });
  }
});

/* ────────── GET /api/listings/stream (SSE real-time feed) ────────── */
router.get('/stream', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache',
    'Content-Type' : 'text/event-stream',
    Connection     : 'keep-alive'
  });
  res.flushHeaders();

  const unsub = db.collection('listings')
                  .orderBy('createdAt', 'desc')
                  .limit(25)
                  .onSnapshot(snapshot => {
    const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  });

  req.on('close', () => unsub());
});

module.exports = router;
