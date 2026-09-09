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
const auth                = require('./middleware/auth');
const listingsRouter      = require('./routes/listings');
const messagesRouter      = require('./routes/messages');
const notificationsRouter = require('./routes/notifications');

const app = express();

// CORS configuration for both local development and production
const allowedOrigins = [
  'http://localhost:3000',      // Next.js default dev port
  'http://localhost:3001',      // Your current dev port
  'https://campusexchange.online',  // Production domain
  'https://www.campusexchange.online'  // Production domain with www
];

// Add any additional origins from environment variable
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({ 
  origin: allowedOrigins,
  credentials: true,  // Allow credentials (cookies, authorization headers)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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
app.use('/api/notifications', auth, notificationsRouter);

/* error handler */
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

/* ─── 3. Listen only when NOT running in Jest ──────────────────── */
const isTest = process.env.NODE_ENV === 'test';
if (!isTest) {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`🚀 API ready at http://localhost:${PORT}`);
    console.log(`🌐 Allowed origins:`, allowedOrigins);
  });
}

/* export for Supertest */
module.exports = app;

