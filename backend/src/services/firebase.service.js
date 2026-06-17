import { admin, firebaseEnabled } from '../config/firebase.js';
import logger from '../utils/logger.js';

/**
 * Verifies a Firebase ID token (from client-side phone auth) and returns
 * the decoded token { uid, phone_number, email, ... }.
 */
export async function verifyFirebaseToken(idToken) {
  if (!firebaseEnabled()) throw new Error('Firebase not configured');
  return admin.auth().verifyIdToken(idToken);
}

/** Send an FCM push to a set of device tokens. No-op if Firebase is off. */
export async function sendPush(tokens, { title, body, data = {} }) {
  if (!firebaseEnabled() || !tokens?.length) return { skipped: true };
  try {
    return await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    });
  } catch (e) { logger.warn(`FCM send failed: ${e.message}`); return { error: e.message }; }
}
