import admin from "firebase-admin";
import { config } from "../config.js";

let isInitialized = false;

function initFirebase() {
  if (isInitialized) return true;
  try {
    if (!admin.apps.length) {
      admin.initializeApp({ projectId: config.firebase.projectId });
    }
    isInitialized = true;
    return true;
  } catch (e) {
    process.stderr.write(`Firebase Admin init skipped: ${e.message}\n`);
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
