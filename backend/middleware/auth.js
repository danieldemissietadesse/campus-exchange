// backend/middleware/auth.js
const admin = require('firebase-admin');

/**
 * Dev bypass:
 *   – If NODE_ENV !== 'production' **and** no auth header is sent,
 *     we treat the request as a fake user “dev-tester”.
 *
 * Real mode (production):
 *   – Requires Authorization: Bearer <idToken>
 *   – Verifies token with Firebase Admin and attaches req.userUid.
 */
module.exports = async function auth(req, res, next) {
  const header = req.headers.authorization || '';

  // ─── Dev shortcut ─────────────────────────────────────
  if (process.env.NODE_ENV !== 'production' && !header.startsWith('Bearer ')) {
    req.userUid = 'dev-tester-uid';
    req.decodedToken = { email: 'dev@localhost' };
    return next();
  }

  // ─── Real token check ─────────────────────────────────
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No auth token provided' });
  }

  const idToken = header.split(' ')[1];

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.userUid = decoded.uid;
    req.decodedToken = decoded;
    return next();
  } catch (err) {
    console.error('Token verification failed:', err);
    return res.status(403).json({ error: 'Unauthorized' });
  }
};
