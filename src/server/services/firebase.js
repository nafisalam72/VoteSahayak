import admin from "firebase-admin";
import { config } from "../config.js";

let isInitialized = false;

/**
 * Initialize Firebase Admin SDK for Cloud Run.
 * 
 * In Cloud Run, the Firebase Admin SDK uses Application Default Credentials (ADC)
 * which are automatically provided by the Cloud Run service account.
 * 
 * For local development, you can set GOOGLE_APPLICATION_CREDENTIALS to point
 * to a service account key file.
 */
function initFirebase() {
  if (isInitialized) return true;
  try {
    if (!admin.apps.length) {
      // Check if a service account key file is provided (for local development or explicit config)
      const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

      if (serviceAccountPath) {
        // Use explicit service account key file
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: config.firebase.projectId,
        });
        process.stdout.write(`[Firebase Admin] Initialized with service account from ${serviceAccountPath}\n`);
      } else {
        // In Cloud Run, use Application Default Credentials (ADC) automatically
        // The service account attached to Cloud Run provides authentication
        // Firebase Admin SDK will automatically use ADC when no explicit credentials are provided
        admin.initializeApp({
          projectId: config.firebase.projectId,
        });
        process.stdout.write(`[Firebase Admin] Initialized with Application Default Credentials (ADC)\n`);
      }
    }
    isInitialized = true;
    return true;
  } catch (e) {
    process.stderr.write(`[Firebase Admin] Initialization failed: ${e.message}\n`);
    return false;
  }
}

export const verifier = {
  async verify(token) {
    if (!initFirebase()) return { sub: "local-dev-user", email: "dev@votesahayak.in" };
    try {
      return await admin.auth().verifyIdToken(token);
    } catch (e) {
      if (process.env.NODE_ENV !== "production") return { sub: "local-dev-user" };
      throw e;
    }
  },
};

export async function checkFirebaseHealth() {
  if (!initFirebase()) return false;
  try {
    await admin.auth().listUsers(1);
    return true;
  } catch { return false; }
}
