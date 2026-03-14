/**
 * Firebase Admin SDK — lazy initialization
 * Returns messaging instance or null if not configured (graceful degradation for dev)
 */
import admin from 'firebase-admin';

let initialized = false;

export function getFirebaseMessaging(): admin.messaging.Messaging | null {
  if (!initialized) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
      console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_JSON not set — push notifications disabled');
      return null;
    }
    try {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccountJson)),
      });
      initialized = true;
      console.log('✅ Firebase Admin SDK initialized');
    } catch (error) {
      console.error('❌ Firebase Admin SDK init failed:', error);
      return null;
    }
  }
  return admin.messaging();
}
