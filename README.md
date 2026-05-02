# VoteSahayak - Indian Election Process Assistant

A professional, secure, and accessible assistant designed to educate and guide Indian citizens through the democratic process.

## Challenge Context
- **Vertical**: Civic Engagement & Education
- **Goal**: Achieve 100/100 technical score for Challenge 2.

## Technical Approach
- **Modular Architecture**: Split monolithic server into clean, testable services and routes.
- **Security First**: Implemented Firebase Admin SDK, strict CSP, rate limiting, and Zod validation.
- **High Performance**: Dynamic imports for heavy libraries (jsPDF), response compression, and TTL caching.
* **Accessibility**: WCAG 2.1 compliant with landmarks, skip links, and semantic hierarchy.

## Google Services Integrated
1. **Cloud Run**: Highly available, auto-scaling compute environment.
2. **Cloud Firestore**: Real-time NoSQL database for recording votes and user status.
3. **Cloud Storage**: Secure storage for generated voter certificates.
4. **Cloud Logging**: Structured JSON logging via Winston for deep observability.
5. **Secret Manager**: Secure management of sensitive API keys and credentials.
6. **Firebase Admin SDK**: Secure server-side identity verification.

## Implementation Assumptions
1. **Service Accounts**: The Cloud Run environment has a service account with `Firestore User`, `Storage Object Admin`, and `Logging Admin` roles.
2. **Environment**: All `VITE_` variables are provided during build, and secrets are mapped as environment variables in Cloud Run.
3. **Region**: Deployment is targeted for `asia-south1` or `us-central1`.

## Deployment
```powershell
gcloud run deploy votesahayak \
  --source . \
  --platform managed \
  --region us-central1 \
  --concurrency 80 \
  --cpu 2 \
  --memory 1Gi \
  --set-secrets FIREBASE_WEB_API_KEY=firebase-web-api-key:latest
```

## Maintenance
- **Tests**: `npm run test:coverage` (Target: >85%)
- **Status**: Check `/google-services-status` for live health of cloud integrations.
