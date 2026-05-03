# Firebase Authentication Setup Guide

## 🔧 Fix: Google Account Signup Issue

If you're having trouble with Google signup, follow these steps:

### Step 1: Add Cloud Run URL to Authorized Domains

1. Go to [Firebase Console](https://console.firebase.google.com/project/election-9ad36/authentication)
2. Click on **"Settings"** tab (gear icon)
3. Scroll down to **"Authorized domains"**
4. Click **"Add domain"**
5. Enter your Cloud Run URL: `votesahayak-132273658004.us-central1.run.app`
6. Click **"Add"**

### Step 2: Verify Sign-in Methods are Enabled

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Make sure these are enabled:
   - ✅ **Email/Password** (if you want email signup)
   - ✅ **Google** (for Google signup)
   - Any other providers you want

### Step 3: Check Firebase API Key Permissions

Your Firebase Web API Key (`AIzaSyDW22owRtHMDv5MGhLyHv-X9g21wOr09_Y`) should have these permissions:
- Firebase Authentication API
- Firestore API
- Cloud Storage API

To verify:
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find your API key
3. Under **"API restrictions"**, ensure these APIs are allowed:
   - Firebase Authentication API
   - Cloud Firestore API
   - Cloud Storage API

### Step 4: Test Authentication

After completing the steps above:

1. Visit: https://votesahayak-132273658004.us-central1.run.app
2. Try signing up with:
   - **Email/Password**: Enter email and password
   - **Google**: Click "Sign in with Google" button

### Common Issues and Solutions

#### Issue 1: "This operation is not allowed in the current execution context"
**Solution**: Add your Cloud Run URL to Authorized domains (Step 1)

#### Issue 2: "Firebase Authentication API has not been used in project"
**Solution**: 
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/library/firebaseauthentication.googleapis.com)
2. Select project: `election-9ad36`
3. Click **"Enable"**

#### Issue 3: "Network error" or "Timeout"
**Solution**: 
- Check if your Cloud Run service is running
- Verify the API endpoint is accessible

#### Issue 4: Google Sign-in not working
**Solution**:
1. In Firebase Console → Authentication → Sign-in method
2. Click on **Google** and ensure it's enabled
3. Make sure you've added your Cloud Run URL to Authorized domains
4. Check that your OAuth consent screen is configured (if using Google Sign-in)

### Step 5: Verify Backend Authentication

The server-side authentication should work automatically once Firebase is configured correctly. To test:

```bash
# Check if Firebase Admin is working
curl https://votesahayak-132273658004.us-central1.run.app/google-services-status

# Should return:
# {"status":{"firebase":true,"firestore":true,"storage":true},"allOk":true}
```

If any service shows `false`, check the service account permissions in Google Cloud Console.

### Additional Notes

- **Firebase Authentication API** must be enabled in Google Cloud Console for project `election-9ad36`
- **Authorized domains** must include your Cloud Run URL
- **Sign-in methods** must be enabled in Firebase Console
- **API Key** must have proper restrictions and permissions

### Need More Help?

Check the Cloud Run logs:
```bash
gcloud run services logs read votesahayak --region us-central1 --limit=50
```

Look for any authentication-related errors.

---

**Last Updated:** May 3, 2026  
**Project:** election-9ad36  
**Cloud Run URL:** https://votesahayak-132273658004.us-central1.run.app