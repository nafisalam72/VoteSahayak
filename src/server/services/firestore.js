import { Firestore } from "@google-cloud/firestore";
import { config } from "../config.js";

let dbInstance = null;
let useMock = false;
const mockStore = new Map();

function getDb() {
  if (dbInstance) return dbInstance;
  try {
    dbInstance = new Firestore({ projectId: config.firebase.projectId });
    return dbInstance;
  } catch (e) {
    process.stderr.write(`Firestore init failed: ${e.message}. Using Mock Store.\n`);
    useMock = true;
    return null;
  }
}

const VOTES_COLLECTION = "votes";

export async function recordVote(userId, voteData) {
  const db = getDb();
  if (useMock || !db) {
    mockStore.set(userId, voteData);
    return;
  }
  await db.collection(VOTES_COLLECTION).doc(userId).set({
    ...voteData,
    timestamp: Firestore.Timestamp.now(),
  });
}

export async function getVote(userId) {
  const db = getDb();
  if (useMock || !db) return mockStore.get(userId) || null;
  const doc = await db.collection(VOTES_COLLECTION).doc(userId).get();
  return doc.exists ? doc.data() : null;
}

export async function getVoteCounts() {
  const db = getDb();
  if (useMock || !db) {
    const counts = {};
    for (const v of mockStore.values()) {
      counts[v.candidateId] = (counts[v.candidateId] || 0) + 1;
    }
    return counts;
  }
  const snapshot = await db.collection(VOTES_COLLECTION).get();
  const counts = {};
  snapshot.forEach((doc) => {
    const { candidateId } = doc.data();
    counts[candidateId] = (counts[candidateId] || 0) + 1;
  });
  return counts;
}

export async function checkFirestoreHealth() {
  try {
    if (useMock) return true;
    await getDb()?.collection("health").doc("check").get();
    return true;
  } catch { return false; }
}
