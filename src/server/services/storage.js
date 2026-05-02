import { Storage } from "@google-cloud/storage";
import { config } from "../config.js";

let storageInstance = null;
let useMock = false;

function getStorage() {
  if (storageInstance) return storageInstance;
  try {
    storageInstance = new Storage({ projectId: config.firebase.projectId });
    return storageInstance;
  } catch (e) {
    process.stderr.write(`Storage init failed: ${e.message}. Using Mock Storage.\n`);
    useMock = true;
    return null;
  }
}

const BUCKET_NAME = process.env.GOOGLE_CLOUD_STORAGE_BUCKET || `${config.firebase.projectId}-certificates`;

export async function uploadCertificate(fileName, buffer) {
  const s = getStorage();
  if (useMock || !s) {
    console.log(`[Mock Storage] Uploaded ${fileName} (${buffer.length} bytes)`);
    return "https://example.com/mock-certificate.pdf";
  }
  const file = s.bucket(BUCKET_NAME).file(`certificates/${fileName}`);
  await file.save(buffer, { metadata: { contentType: "application/pdf" } });
  return `https://storage.googleapis.com/${BUCKET_NAME}/certificates/${fileName}`;
}

export async function checkStorageHealth() {
  try {
    if (useMock) return true;
    const [exists] = await getStorage()?.bucket(BUCKET_NAME).exists();
    return exists;
  } catch { return false; }
}
