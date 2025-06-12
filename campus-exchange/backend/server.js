// backend/server.js
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');
const admin   = require('firebase-admin');

/* ─── 1. Initialise Firebase before any router code ─── */
admin.initializeApp({
  credential: admin.credential.cert({
    projectId  : process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey : process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
  databaseURL  : process.env.FIREBASE_DATABASE_URL,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

/* ─── 2. Import middleware / routers ────────────────── */
const auth            = require('./middleware/auth');
const listingsRouter  = require('./routes/listings');
const messagesRouter  = require('./routes/messages');

/* ─── 3. Express plumbing ───────────────────────────── */
const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(morgan('dev'));
app.use(express.json());

/* ─── 4. Health + Firebase ping ─────────────────────── */
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));
app.get('/api/test-firebase', async (_, res, next) => {
  try {
    await admin.firestore().doc('_health/ping').set({ ts: Date.now() });
    res.json({ firebase: 'connected' });
  } catch (err) { next(err); }
});

/* ─── 5. Protected API routes ───────────────────────── */
app.use('/api/listings',  auth, listingsRouter);
app.use('/api/messages',  auth, messagesRouter);

/* ─── 6. Error handler ──────────────────────────────── */
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

/* ─── 7. Start server ───────────────────────────────── */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 API ready at http://localhost:${PORT}`);
});
