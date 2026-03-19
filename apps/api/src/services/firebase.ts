/**
 * Firebase Admin SDK — lazy initialization
 * Returns messaging instance or null if not configured (graceful degradation for dev)
 *
 * Supports two credential sources:
 * 1. FIREBASE_SERVICE_ACCOUNT_JSON env var (inline JSON string)
 * 2. GOOGLE_APPLICATION_CREDENTIALS env var (path to JSON file — recommended for Docker)
 */
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

let initialized = false;

export function getFirebaseMessaging(): admin.messaging.Messaging | null {
  if (!initialized) {
    try {
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      if (serviceAccountJson) {
        admin.initializeApp({
          credential: admin.credential.cert(JSON.parse(serviceAccountJson)),
        });
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        const fileContents = readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8');
        admin.initializeApp({
          credential: admin.credential.cert(JSON.parse(fileContents)),
        });
      } else {
        console.warn('⚠️ Firebase credentials not configured — push notifications disabled');
        return null;
      }
      initialized = true;
      console.log('✅ Firebase Admin SDK initialized');
    } catch (error) {
      console.error('❌ Firebase Admin SDK init failed:', error);
      return null;
    }
  }
  return admin.messaging();
}
