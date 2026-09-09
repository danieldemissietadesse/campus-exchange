/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testTimeout: 15000          // Firestore writes can be slow on first run
};
