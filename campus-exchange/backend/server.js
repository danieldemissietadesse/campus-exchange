// backend/server.js
require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const morgan   = require('morgan');
const admin    = require('firebase-admin');

const auth            = require('./middleware/auth');
const listingsRouter  = require('./routes/listings');

const app = express();

/* ─────────── Firebase Admin ─────────── */
admin.initializeApp({
  credential: admin.credential.cert({
    projectId:   process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
  databaseURL:   process.env.FIREBASE_DATABASE_URL,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

const db = admin.firestore();

/* ─────────── Global Middleware ─────────── */
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(morgan('dev'));
app.use(express.json());

/* ─────────── Routes ─────────── */
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

app.get('/api/test-firebase', async (_, res, next) => {
  try {
    await db.doc('_health/ping').set({ ts: Date.now() });
    res.json({ firebase: 'connected' });
  } catch (err) {
    next(err);
  }
});

app.use('/api/listings', auth, listingsRouter);

/* ─────────── Error Handler ─────────── */
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

/* ─────────── Start Server ─────────── */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀  API ready at http://localhost:${PORT}`);
});
