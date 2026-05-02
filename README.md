# VoteSahayak

Secure Cloud Run voting-assistance app for Indian election guidance. The production deployment serves the React/Vite UI from a hardened Node.js server (`server.js`) and keeps AI provider secrets on the server side.

## What Is Hardened

| Criterion | Implementation |
| --- | --- |
| Code quality | TypeScript strict mode, centralized utilities, code-split routes, health endpoints, clear scripts |
| Security | No `VITE_` AI secrets, server-side Groq proxy, Helmet headers, request body limits, input sanitization, per-IP rate limiting |
| Efficiency | Multi-stage Docker build, production-only runtime dependencies, in-memory AI response cache, lazy-loaded routes, dynamic PDF generation import |
| Testing | Vitest UI tests, security utility tests, Cloud Run server integration tests with mocked AI provider |
| Accessibility | Semantic landmarks, skip link, visible focus states, `aria-*` labels, keyboard Escape support for navigation |
| Google services | Cloud Run-ready server on `PORT`, JSON logs for Cloud Logging, health endpoints for Monitoring, optional Firebase Auth token flow, least-privilege deployment guidance |

## Architecture

```text
Browser
  -> React/Vite SPA
  -> /api/chat on the same Cloud Run service
  -> Node Express server
  -> optional Firebase Auth token verification
  -> Groq API using server-side GROQ_API_KEY
```

The legacy `app.py` Streamlit app is retained as a safe local fallback, but Cloud Run should deploy the Node server.

## Local Development

```bash
npm install
cp .env.example .env
# Fill in your GROQ_API_KEY and Firebase values in .env
npm run dev:all
```

The Vite dev server proxies `/api/*` to `http://localhost:8080`.

## Tests And Build

```bash
npm run typecheck
npm test
npm run build
```

## Required Environment Variables

For local development, copy `.env.example` to `.env` and fill in your values. For production (Cloud Run), use Secret Manager for sensitive keys.

### Public Client Config (VITE_ prefixed)
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

### Server Secrets
- `GROQ_API_KEY`: Required for the AI assistant.
- `SESSION_SECRET`: Recommended for secure sessions.

## Cloud Run Deployment

```bash
PROJECT_ID=your-project-id
REGION=asia-south1
SERVICE=votesahayak
REPO=votesahayak

gcloud config set project $PROJECT_ID
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com logging.googleapis.com monitoring.googleapis.com

gcloud artifacts repositories create $REPO \
  --repository-format=docker \
  --location=$REGION

gcloud secrets create groq-api-key --replication-policy=automatic
printf "YOUR_GROQ_API_KEY" | gcloud secrets versions add groq-api-key --data-file=-

gcloud iam service-accounts create votesahayak-runner \
  --display-name="VoteSahayak Cloud Run runtime"

gcloud secrets add-iam-policy-binding groq-api-key \
  --member="serviceAccount:votesahayak-runner@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud builds submit \
  --tag $REGION-docker.pkg.dev/$PROJECT_ID/$REPO/$SERVICE:latest

gcloud run deploy $SERVICE \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/$REPO/$SERVICE:latest \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --service-account votesahayak-runner@$PROJECT_ID.iam.gserviceaccount.com \
  --port 8080 \
  --concurrency 80 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 60 \
  --set-secrets GROQ_API_KEY=groq-api-key:latest \
  --set-env-vars NODE_ENV=production,ENABLE_FIREBASE_AUTH=true,REQUIRE_AUTH=false,VITE_FIREBASE_PROJECT_ID=election-9ad36,VITE_FIREBASE_API_KEY=AIzaSyDW22owRtHMDv5MGhLyHv-X9g21wOr09_Y,VITE_FIREBASE_AUTH_DOMAIN=election-9ad36.firebaseapp.com,VITE_FIREBASE_APP_ID=1:495082661814:web:8401b6b65a8630914e8317,VITE_FIREBASE_STORAGE_BUCKET=election-9ad36.firebasestorage.app,VITE_FIREBASE_MESSAGING_SENDER_ID=495082661814,VITE_FIREBASE_MEASUREMENT_ID=G-KL9HM4G1L9,RATE_LIMIT_MAX=120,CHAT_RATE_LIMIT_MAX=12,CACHE_TTL_MS=300000
```

## Monitoring

Use `/healthz` for uptime checks and `/readyz` for configuration visibility. The server emits JSON logs with `severity`, `service`, `requestId`, status, latency, and Cloud Trace correlation when Cloud Run supplies trace headers.

## Least-Privilege IAM

The runtime service account should only need:

- `roles/secretmanager.secretAccessor` on the `groq-api-key` secret.
- Firebase permissions only if you enable server-side Firebase Admin verification.
- No broad Editor, Owner, Storage Admin, or Cloud SQL roles unless you add those services later.

## Final-Attempt Checklist

- Run `npm run typecheck`, `npm test`, and `npm run build` before deploying.
- Confirm the deployed URL returns `200` for `/healthz` and `/readyz`.
- Confirm browser DevTools does not contain `GROQ_API_KEY` or any AI key in bundled JS.
- Add Firebase config and test Google sign-in before setting `REQUIRE_AUTH=true`.
- Create a Cloud Monitoring uptime check for `/healthz` and an alert on HTTP 5xx logs.
- Keep `.env`, service account JSON files, and local Firebase admin credentials out of Git.
