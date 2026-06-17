import admin from 'firebase-admin';
import config from './index.js';
import logger from '../utils/logger.js';

let app = null;

export function initFirebase() {
  if (app) return app;
  const { projectId, clientEmail, privateKey } = config.firebase;
  if (!projectId || !clientEmail || !privateKey) {
    logger.warn('Firebase not configured — phone OTP will use dev fallback. Set FIREBASE_* env vars for production.');
    return null;
  }
  try {
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        // env stores \n as literal — convert back to real newlines
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
    logger.info('Firebase Admin initialized');
    return app;
  } catch (e) {
    logger.error(`Firebase init failed: ${e.message}`);
    return null;
  }
}

export const firebaseEnabled = () => Boolean(app);
export { admin };
