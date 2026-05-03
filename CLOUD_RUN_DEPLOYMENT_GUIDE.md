# Cloud Run Deployment Guide - VoteSahayak

## Issues Fixed

### 1. Sign-In Authentication Issue
**Problem:** Users couldn't sign in when deployed on Cloud Run due to Firebase Admin SDK initialization issues.

**Root Cause:** The Firebase Admin SDK wasn't properly configured to use Application Default Credentials (ADC) in the Cloud Run environment.

**Solution:** Updated `src/server/services/firebase.js` to:
- Use Application Default Credentials (ADC) automatically available in Cloud Run
- Support explicit service account key files via `GOOGLE_APPLICATION_CREDENTIALS` for local development
- Added proper logging for debugging

### 2. Chat Bot API Issue
**Problem:** The chat API wasn't accessible due to missing CORS configuration.

**Root Cause:** The Express server didn't have CORS middleware configured, blocking cross-origin requests from the frontend.

**Solution:** Added comprehensive CORS configuration in `src/server/middleware.js`:
- Allow requests from all origins (safe for Cloud Run as it's the same origin)
- Support credentials and proper headers
- Include Authorization header support for Firebase tokens

## Required Google Cloud Setup

### 1. Service Account Permissions
Ensure your Cloud Run service account has the following roles:
- **Firestore User** - For database operations
- **Storage Object Admin** - For certificate storage
- **Logging Admin** - For Cloud Logging
- **Firebase Admin SDK Administrator** - For Firebase Admin operations

### 2. Firebase Configuration
Make sure these Firebase services are enabled:
- **Firebase Authentication** - For user sign-in
- **Cloud Firestore** - For vote storage
- **Cloud Storage** - For certificate storage

### 3. Secret Manager Setup
Create the following secrets in Google Cloud Secret Manager:

```bash
# Firebase web API key (public key, safe to expose)
gcloud secrets create firebase-web-api-key --data="your-firebase-api-key"

# Firebase web app ID
gcloud secrets create firebase-web-app-id --data="your-firebase-app-id"

# Groq API key for AI chatbot
gcloud secrets create groq-api-key --data="your-groq-api-key"
```

## Deployment Instructions

### Option 1: Using the provided cloudrun.yaml

```bash
# Deploy using the YAML configuration
gcloud run services replace cloudrun.yaml --region us-central1
```

### Option 2: Using gcloud CLI directly

```bash
gcloud run deploy votesahayak \
  --source . \
  --platform managed \
  --region us-central1 \
  --concurrency 80 \
  --cpu 2 \
  --memory 1Gi \
  --set-secrets \
    FIREBASE_WEB_API_KEY=firebase-web-api-key:latest,\
    FIREBASE_WEB_APP_ID=firebase-web-app-id:latest,\
    GROQ_API_KEY=groq-api-key:latest \
  --set-env-vars \
    FIREBASE_PROJECT_ID=election-9ad36,\
    FIREBASE_AUTH_DOMAIN=election-9ad36.firebaseapp.com,\
    FIREBASE_STORAGE_BUCKET=election-9ad36.appspot.com,\
    ENABLE_FIREBASE_AUTH=true,\
    REQUIRE_AUTH=true,\
    NODE_ENV=production
```

### Option 3: Using Docker

```bash
# Build the Docker image
docker build -t gcr.io/prompt-495020/votesahayak .

# Push to Container Registry
docker push gcr.io/prompt-495020/votesahayak

# Deploy to Cloud Run
gcloud run deploy votesahayak \
  --image gcr.io/prompt-495020/votesahayak \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## Environment Variables

The following environment variables are configured in `cloudrun.yaml`:

### Required
- `NODE_ENV=production`
- `PORT=8080`
- `FIREBASE_PROJECT_ID` - Your Firebase project ID
- `FIREBASE_AUTH_DOMAIN` - Your Firebase auth domain
- `FIREBASE_STORAGE_BUCKET` - Your Firebase storage bucket
- `ENABLE_FIREBASE_AUTH=true` - Enable Firebase authentication
- `REQUIRE_AUTH=true` - Require authentication for protected routes

### Secrets (from Secret Manager)
- `FIREBASE_WEB_API_KEY` - Firebase web API key
- `FIREBASE_WEB_APP_ID` - Firebase web app ID
- `GROQ_API_KEY` - Groq API key for AI chatbot

### Optional
- `GOOGLE_CLOUD_STORAGE_BUCKET` - Custom storage bucket for certificates
- `GROQ_MODEL` - Groq model to use (default: llama-3.3-70b-versatile)
- `RATE_LIMIT_*` - Rate limiting configuration
- `CACHE_*` - Cache configuration

## Verification

After deployment, verify the following:

### 1. Health Check
```bash
curl https://your-service-url.run.app/healthz
# Should return: {"status":"ok"}
```

### 2. Google Services Status
```bash
curl https://your-service-url.run.app/google-services-status
# Should return: {"status":{"firebase":true,"firestore":true,"storage":true},"allOk":true}
```

### 3. API Health
```bash
curl https://your-service-url.run.app/api/health
# Should return: {"status":"Server is running perfectly!"}
```

### 4. Firebase Config
```bash
curl https://your-service-url.run.app/api/config
# Should return Firebase configuration
```

## Troubleshooting

### Sign-In Not Working
1. Check Firebase Authentication is enabled in Firebase Console
2. Verify authorized domains in Firebase Console include your Cloud Run URL
3. Check service account has Firebase Admin SDK Administrator role
4. Review Cloud Logging for Firebase Admin initialization errors

### Chat Bot Not Working
1. Verify `GROQ_API_KEY` secret is set correctly
2. Check Groq API key is valid and has available quota
3. Review Cloud Logging for AI service errors
4. Test the `/api/health` endpoint to ensure server is running

### CORS Errors
The CORS middleware is now configured to allow all origins, which is safe for Cloud Run since requests come from the same origin. If you still see CORS errors:
1. Clear browser cache
2. Check browser console for specific error messages
3. Verify the Cloud Run URL matches the frontend's API calls

## Monitoring

### Cloud Logging
View logs in Google Cloud Console:
```
Logs > Logs Explorer > Resource: Cloud Run Revision
```

### Key Log Messages
- `[Firebase Admin] Initialized with Application Default Credentials (ADC)` - Firebase Admin SDK started successfully
- `[Mock Storage]` or Storage operations - Storage service status
- `HTTP Request` - API request logs with status codes

## Security Notes

1. **Service Account**: The Cloud Run service account should have minimal required permissions
2. **Secrets**: All sensitive keys are stored in Secret Manager, not in code
3. **CORS**: Configured to allow requests from the deployed origin
4. **Rate Limiting**: Enabled to prevent abuse
5. **Helmet.js**: Security headers are automatically set
6. **Firebase Auth**: Server-side token verification ensures secure authentication

## Updates & Maintenance

To update the deployment:
```bash
# Rebuild and redeploy
gcloud run deploy votesahayak --source . --region us-central1
```

The service will automatically scale based on traffic (0 to 10 instances as configured).