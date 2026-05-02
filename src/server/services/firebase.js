import { decodeProtectedHeader, importX509, jwtVerify } from "jose";
import { config } from "../config.js";

const FIREBASE_CERT_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

export class FirebaseVerifier {
  constructor() {
    this.certs = new Map();
    this.expiresAt = 0;
  }

  async fetchCerts() {
    if (Date.now() < this.expiresAt) return this.certs;
    const res = await fetch(FIREBASE_CERT_URL);
    const data = await res.json();
    this.certs = new Map(Object.entries(data));
    const cacheControl = res.headers.get("cache-control") || "";
    const maxAge = parseInt(cacheControl.match(/max-age=(\d+)/)?.[1] || "3600", 10);
    this.expiresAt = Date.now() + maxAge * 1000;
    return this.certs;
  }

  async verify(token) {
    const { kid, alg } = decodeProtectedHeader(token);
    if (alg !== "RS256" || !kid) throw new Error("Invalid header");
    const certs = await this.fetchCerts();
    const cert = certs.get(kid);
    if (!cert) throw new Error("Invalid kid");
    const key = await importX509(cert, "RS256");
    const { payload } = await jwtVerify(token, key, {
      audience: config.firebase.projectId,
      issuer: `https://securetoken.google.com/${config.firebase.projectId}`,
    });
    return payload;
  }
}

export const verifier = new FirebaseVerifier();
