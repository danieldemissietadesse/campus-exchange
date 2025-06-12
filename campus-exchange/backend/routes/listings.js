// backend/routes/listings.js
const express = require('express');
const admin   = require('firebase-admin');
const router  = express.Router();

const db = admin.firestore();

/**
 * GET /api/listings
 * Returns all listings ordered by newest first.
 * Optional ?category=<name> filter.
 */
router.get('/', async (req, res) => {
  try {
    let q = db.collection('listings').orderBy('createdAt', 'desc');
    const { category } = req.query;
    if (category && category !== 'All') {
      q = db.collection('listings')
           .where('category', '==', category)
           .orderBy('createdAt', 'desc');
    }
    const snap = await q.get();
    const listings = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(listings);
  } catch (err) {
    console.error('List fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

/**
 * POST /api/listings
 * Creates a listing (no image upload yet—keep it simple first).
 * Body: { title, description, price, category }
 */
router.post('/', async (req, res) => {
  try {
    const { title, description, price, category } = req.body;
    const data = {
      title, description, price, category,
      userId: req.userUid,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    const ref = await db.collection('listings').add(data);
    res.status(201).json({ id: ref.id, ...data });
  } catch (err) {
    console.error('Create listing error:', err);
    res.status(500).json({ error: 'Failed to create listing' });
  }
});

module.exports = router;
s