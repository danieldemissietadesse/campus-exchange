# Configuration

Create a Firebase project for local development. Enable email/password sign-in in Authentication and provision Firestore and Storage. Review the repository's Firestore and Storage rules before applying them to your project.

## Frontend

Copy `.env.example` to `.env.local`. Fill the six `NEXT_PUBLIC_FIREBASE_*` values from the Firebase web app configuration. These values identify the client application; authorization still depends on Firebase rules and authentication.

`NEXT_PUBLIC_API_URL` is the Express API base URL, normally `http://localhost:5001`. Restart Next.js after changing environment variables. Public variables are included in the frontend build; never put a service-account key in one.

## Backend

Copy `backend/.env.example` to `backend/.env`. Set the project ID, service-account email, private key, and Storage bucket for the same development project. `FIREBASE_DATABASE_URL` is also passed to Firebase Admin; the application data paths use Firestore.

The private key must be a quoted PEM value with literal `\n` separators. The server expands those separators into newlines. Its current startup code requires `FIREBASE_PRIVATE_KEY` to be present.

The API defaults to port 5001. `FRONTEND_URL` adds an allowed CORS origin. Local ports 3000 and 3001 are already allowed.

## Test environment

Frontend Jest tests use mocks. Backend Jest tests and browser scenarios are integration tests: they use the configured Firebase project and may write or delete records. Use a separate disposable test project, never a project containing real user data.

The backend's existing authentication middleware bypasses token authentication outside production when no bearer token is supplied. Keep the development server local. In production mode, the middleware requires a valid Firebase ID token.

## Deployment

The Next.js configuration uses `output: 'export'`; the generated frontend is in `out/`. Firebase Hosting settings are in `firebase.json`. Install the Firebase CLI separately, select your own Firebase project, and provide a reachable API URL before building. The Express server requires its own hosting and environment configuration.
