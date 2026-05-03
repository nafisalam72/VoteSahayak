# 🔧 FINAL FIX for Google Sign-In [auth/internal-error]

## 🎯 The Real Issue

Since email/password works but Google sign-in gives `[auth/internal-error]`, the problem is **NOT** the authorized domain. The issue is that the **Firebase Authentication API** is not properly enabled or the **OAuth 2.0 client** is not configured correctly.

## ✅ Complete Fix (Follow ALL Steps)

### Step 1: Enable Firebase Authentication API (REQUIRED)

This is the most critical step that's likely missing:

1. Go to [Google Cloud Console - APIs & Services](https://console.cloud.google.com/apis/library/firebaseauthentication.googleapis.com)
2. At the top, make sure project **`election-9ad36`** is selected
3. Click the **ENABLE** button
4. Wait for it to say "API enabled" (may take 10-20 seconds)

**⚠️ This step is MANDATORY for Google sign-in to work!**

### Step 2: Verify Google Sign-In Provider is Enabled

1. Go to [Firebase Console - Authentication](https://console.firebase.google.com/project/election-9ad36/authentication)
2. Click **Sign-in method** tab
3. Find **Google** in the list
4. Make sure it shows **Enabled** (not just "Set up")
5. If not enabled, click on it and toggle **Enable** to ON
6. Set your project support email
7. Click **Save**

### Step 3: Add Authorized Domain

1. In Firebase Console → Authentication → Settings (gear icon)
2. Scroll to **Authorized domains**
3. Make sure `votesahayak-cxijollt3q-uc.a.run.app` is in the list
4. If not, click **Add domain** and enter it exactly as shown (no https://, no trailing slash)

### Step 4: Clear Everything and Test

1. **Clear browser cache and cookies** (Ctrl+Shift+Delete)
2. **Close all browser windows**
3. **Open a new incognito/private window**
4. Visit: https://votesahayak-cxijollt3q-uc.a.run.app
5. Click "Sign in with Google"

## 🔍 How to Verify API is Enabled

After Step 1, verify:

1. Go to [Google Cloud Console - APIs & Services Dashboard](https://console.cloud.google.com/apis/dashboard)
2. Select project `election-9ad36`
3. Look for **Firebase Authentication API** in the list
4. It should show status as **Enabled**

If it's not in the list or shows as disabled, you haven't completed Step 1 correctly.

## ⚠️ Common Mistakes

### Mistake 1: Enabling in Wrong Project
Make sure you're enabling the API in project `election-9ad36`, NOT `prompt-495020`.

### Mistake 2: Thinking Firebase Console is Enough
Enabling authentication in Firebase Console is NOT enough. You MUST also enable the API in Google Cloud Console.

### Mistake 3: Not Waiting for API to Enable
After clicking "Enable", wait 10-20 seconds for it to fully enable before testing.

### Mistake 4: Not Clearing Cache
Firebase SDK caches configuration. You MUST clear browser cache after making changes.

## 🧪 Test Checklist

Before concluding it's not working, verify:
- [ ] Firebase Authentication API shows as "Enabled" in Google Cloud Console
- [ ] Google sign-in provider shows as "Enabled" in Firebase Console
- [ ] Authorized domain is added correctly
- [ ] Browser cache is cleared
- [ ] Testing in incognito mode

## 🆘 Still Not Working?

If you've completed ALL steps and still get the error:

1. **Check API Status:**
   - Go to Google Cloud Console → APIs & Services → Dashboard
   - Confirm Firebase Authentication API is listed and enabled

2. **Check OAuth Consent Screen:**
   - Go to [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
   - Make sure it's configured (at least app name and user support email)

3. **Check for Errors in Browser Console:**
   - Press F12 to open developer tools
   - Go to Console tab
   - Try Google sign-in again
   - Look for any error messages

4. **Try a Different Browser:**
   - Sometimes browser extensions interfere with Google sign-in
   - Try in a different browser (Chrome, Firefox, Edge)

## 📝 Summary

The deployment is perfect. Email/password works. The ONLY thing preventing Google sign-in is:
1. Firebase Authentication API not enabled in Google Cloud Console
2. OR OAuth consent screen not configured
3. OR browser cache not cleared

Complete Step 1 (enable the API) and this will work! 🎉

---

**Your Application URL:** https://votesahayak-cxijollt3q-uc.a.run.app  
**Firebase Project:** election-9ad36  
**Critical Step:** Enable Firebase Authentication API in Google Cloud Console

**Direct Link to Enable API:**  
https://console.cloud.google.com/apis/library/firebaseauthentication.googleapis.com?project=election-9ad36