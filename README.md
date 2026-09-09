# Campus Exchange

A campus marketplace prototype for posting items, browsing listings, saving items, and messaging sellers. Built with Next.js, React, Express, and Firebase.

The application includes email authentication, listing images, search and pagination, saved listings, conversations, and notifications. The frontend uses Firebase directly for some operations and an Express API for others; [architecture notes](docs/architecture.md) explain the split.

**Status:** prototype. The existing frontend test suite has failures, and the backend integration tests require a separate Firebase test project. See [validation and limitations](docs/status.md).

## Run locally

Use Node.js 22 and npm. You will need a Firebase project with Authentication, Firestore, and Storage configured.

```sh
git clone https://github.com/danieldemissietadesse/campus-exchange.git
cd campus-exchange
npm ci
npm --prefix backend ci
cp .env.example .env.local
cp backend/.env.example backend/.env
```

Fill in the environment files using the [configuration guide](docs/configuration.md), then start both processes:

```sh
npm run dev:both
```

The frontend runs at `http://localhost:3000`; the API runs at `http://localhost:5001`. `GET /api/health` checks the API process.

## Repository layout

```text
src/app/            Pages, layout, and Firebase client setup
src/components/     Authentication, listings, profiles, and messaging UI
src/lib/            API client and Firebase data access
backend/            Express API, middleware, and integration tests
tests/systems/      Playwright browser tests
docs/               Configuration, architecture, and validation notes
public/             Static assets
```

Dependencies, build output, logs, Firebase caches, and test reports are generated locally and are not source files.

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the frontend |
| `npm --prefix backend run dev` | Start the API |
| `npm run dev:both` | Start both processes |
| `npm test -- --runInBand` | Run frontend Jest tests with mocks |
| `npm run lint` | Run the existing Next.js lint check |
| `npm run build` | Build the static frontend export in `out/` |
| `npm --prefix backend test` | Run integration tests against the configured Firebase project |
| `npm run test:systems` | Start the app and run Playwright scenarios |

For backend or browser tests, use a dedicated disposable Firebase project. Those tests can create and delete data. Install the Playwright browser with `npx playwright install chromium` before browser tests.

## Working on the project

Keep changes focused and include the behavior you changed, how you checked it, and any remaining limitations in the pull request. Preserve the existing test coverage when updating UI expectations. Do not commit credentials or generated files.

Deployment settings in `firebase.json` describe Firebase Hosting. Select your own project with the Firebase CLI and configure the backend separately before deploying. The repository is not a production deployment template.
