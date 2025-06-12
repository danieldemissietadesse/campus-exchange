// backend/middleware/auth.js
const admin = require('firebase-admin');

/**
 * Verifies Firebase ID token sent as:
 *    Authorization: Bearer <idToken>
 * Attaches `req.userUid` and `req.decodedToken` on success.
 */
module.exports = async function auth(req, res, next) {
  const header = req.headers.authorization || '';
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
