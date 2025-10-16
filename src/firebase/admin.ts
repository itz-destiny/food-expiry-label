import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { firebaseConfig } from './config';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeAdminFirebase() {
  if (!getApps().length) {
    initializeApp({
        credential: undefined, // Use Application Default Credentials
        projectId: firebaseConfig.projectId,
    });
  }

  return getSdks(getApp());
}

export function getSdks(app: App) {
  const firestore = getFirestore(app);

  return {
    app,
    firestore
  };
}
