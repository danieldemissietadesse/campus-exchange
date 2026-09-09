# Architecture

Campus Exchange has a Next.js frontend, an Express API, and Firebase services for identity, database records, and uploaded images.

## Frontend

`src/app/page.js` coordinates authentication, marketplace views, and messaging. Components under `src/components/` handle listings, profiles, uploads, and conversations. `src/app/firebaseConfig.js` initializes Firebase Auth, Firestore, and Storage.

Data access currently follows two paths: Firebase SDK calls in `src/lib/` and an HTTP client in `src/lib/api.js`. The HTTP client attaches the current user's Firebase ID token when available. This split is part of the prototype's current design; a future refactor should make ownership of each operation explicit.

## API

`backend/server.js` initializes Firebase Admin, configures CORS, and mounts routes for listings, messages, and notifications. The routes use Firestore and Storage. `backend/middleware/auth.js` verifies Firebase tokens in production and provides a development bypass outside production.

`GET /api/health` returns process health without writing data. `GET /api/test-firebase` writes a health document to Firestore; it is a development diagnostic, not a read-only health endpoint.

## Checks

Frontend Jest tests run in jsdom with Firebase mocks. Backend Jest/Supertest tests exercise API routes against the configured Firebase services. Playwright scenarios exercise the browser and API together. See [status](status.md) for the verified baseline and current limitations.
