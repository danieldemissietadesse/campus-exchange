// backend/server.js
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');
const admin   = require('firebase-admin');

/* ─── 1. Firebase init ─────────────────────────────────────────── */
admin.initializeApp({
  credential: admin.credential.cert({
    projectId  : process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey : process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
  databaseURL  : process.env.FIREBASE_DATABASE_URL,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

/* ─── 2. Routers & middleware ──────────────────────────────────── */
const auth            = require('./middleware/auth');
const listingsRouter  = require('./routes/listings');
const messagesRouter  = require('./routes/messages');

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(morgan('dev'));
app.use(express.json());

/* health checks */
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));
app.get('/api/test-firebase', async (_, res, next) => {
  try {
    await admin.firestore().doc('_health/ping').set({ ts: Date.now() });
    res.json({ firebase: 'connected' });
  } catch (err) { next(err); }
});

/* protected API routes */
app.use('/api/listings', auth, listingsRouter);
app.use('/api/messages', auth, messagesRouter);

/* error handler */
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

/* ─── 3. Listen only when NOT running in Jest ──────────────────── */
const isTest = process.env.NODE_ENV === 'test';
if (!isTest) {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () =>
    console.log(`🚀 API ready at http://localhost:${PORT}`));
}

/* export for Supertest */
module.exports = app;
