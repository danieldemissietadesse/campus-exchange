# Campus Exchange

Campus Exchange is a marketplace demo built with Next.js for the frontend and an Express
backend that stores data in Firebase. The project uses Firebase Authentication,
Firestore and Storage, and Tailwind CSS for styling.

## Prerequisites

- **Node.js 18+** and npm
- A Firebase project with service account credentials

## Setup

Clone the repository and install dependencies:

```bash
# clone and enter the project
git clone <repository-url>
cd campus-exchange/campus-exchange

# frontend dependencies
npm install

# backend dependencies
cd backend
npm install
cd ..
```

### Environment variables

Create `.env.local` in the project root with the API URL used by the frontend:

```
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

Create `backend/.env` for the Express server. Fill in the Firebase values from
your service account:

```
PORT=5001
FRONTEND_URL=http://localhost:3000
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

## Running the application

Open two terminals.

1. **Frontend**

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`.

2. **Backend**

   ```bash
   cd backend
   npm run dev
   ```

   The API will listen on `http://localhost:5001`.

## Testing

The backend includes Jest tests. Run them with:

```bash
cd backend
npm test
```

## Deployment

Use the provided `deploy` script to build and deploy to Firebase Hosting:

```bash
npm run deploy
```

