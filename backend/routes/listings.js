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

/* ────────── GET /api/listings/saved ────────── */
router.get('/saved', async (req, res) => {
  try {
    // Use the userId from auth middleware
    const userId = req.userUid;

    // Get saved listing IDs
    const savedListings = await db.collection('savedListings')
      .where('userId', '==', userId)
      .orderBy('savedAt', 'desc')
      .get();

    if (savedListings.empty) {
      return res.status(200).json([]);
    }

    // Get the actual listings
    const listingIds = savedListings.docs.map(doc => doc.data().listingId);
    const listings = [];

    // Fetch listings in batches (Firestore has a limit of 10 for 'in' queries)
    for (let i = 0; i < listingIds.length; i += 10) {
      const batch = listingIds.slice(i, i + 10);
      const listingsSnapshot = await db.collection('listings')
        .where(admin.firestore.FieldPath.documentId(), 'in', batch)
        .get();
      
      listingsSnapshot.docs.forEach(doc => {
        if (doc.exists) {
          listings.push({ id: doc.id, ...doc.data() });
        }
      });
    }

    // Sort by saved date
    const savedMap = new Map();
    savedListings.docs.forEach(doc => {
      savedMap.set(doc.data().listingId, doc.data().savedAt);
    });

    listings.sort((a, b) => {
      const aTime = savedMap.get(a.id)?.seconds || 0;
      const bTime = savedMap.get(b.id)?.seconds || 0;
      return bTime - aTime;
    });

    res.status(200).json(listings);
  } catch (error) {
    console.error('Error fetching saved listings:', error);
    res.status(500).json({ error: 'Failed to fetch saved listings' });
  }
});

/* ────────── DELETE /api/listings/:id ────────── */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Use the userId from auth middleware
    const userId = req.userUid;

    // Get the listing to check ownership and get image URLs
    const listingDoc = await db.collection('listings').doc(id).get();
    
    if (!listingDoc.exists) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const listing = listingDoc.data();
    
    // Check if the user owns this listing
    if (listing.userId !== userId) {
      return res.status(403).json({ error: 'You can only delete your own listings' });
    }

    // Delete images from storage if they exist
    if (listing.imageUrls && listing.imageUrls.length > 0) {
      for (const imageUrl of listing.imageUrls) {
        try {
          // Extract file path from URL and delete from storage
          const fileName = imageUrl.split('/').pop().split('?')[0];
          if (fileName && fileName.includes('listing-images')) {
            await bucket.file(`listing-images/${fileName.split('listing-images%2F')[1]}`).delete();
          }
        } catch (error) {
          console.error('Error deleting image:', error);
          // Continue with listing deletion even if image deletion fails
        }
      }
    }

    // Delete the listing document
    await db.collection('listings').doc(id).delete();

    res.status(200).json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Error deleting listing:', error);
    res.status(500).json({ error: 'Failed to delete listing' });
  }
});

/* ────────── POST /api/listings/:id/save ────────── */
router.post('/:id/save', async (req, res) => {
  try {
    const { id } = req.params;
    // Use the userId from auth middleware
    const userId = req.userUid;

    // Check if listing exists
    const listingDoc = await db.collection('listings').doc(id).get();
    if (!listingDoc.exists) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Check if already saved
    const existingSave = await db.collection('savedListings')
      .where('userId', '==', userId)
      .where('listingId', '==', id)
      .get();

    if (!existingSave.empty) {
      return res.status(400).json({ error: 'Listing already saved' });
    }

    // Save the listing
    await db.collection('savedListings').add({
      userId,
      listingId: id,
      savedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({ message: 'Listing saved successfully' });
  } catch (error) {
    console.error('Error saving listing:', error);
    res.status(500).json({ error: 'Failed to save listing' });
  }
});

/* ────────── DELETE /api/listings/:id/save ────────── */
router.delete('/:id/save', async (req, res) => {
  try {
    const { id } = req.params;
    // Use the userId from auth middleware
    const userId = req.userUid;

    // Find and delete the saved listing
    const savedListings = await db.collection('savedListings')
      .where('userId', '==', userId)
      .where('listingId', '==', id)
      .get();

    if (savedListings.empty) {
      return res.status(404).json({ error: 'Saved listing not found' });
    }

    // Delete all matching documents (should be only one)
    const batch = db.batch();
    savedListings.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    res.status(200).json({ message: 'Listing unsaved successfully' });
  } catch (error) {
    console.error('Error unsaving listing:', error);
    res.status(500).json({ error: 'Failed to unsave listing' });
  }
});

module.exports = router;
