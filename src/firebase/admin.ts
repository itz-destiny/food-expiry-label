
import { initializeApp, getApps, App, getApp, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App;
let db: Firestore;

function initializeAdminFirebase() {
  if (getApps().length) {
    app = getApp();
    db = getFirestore(app);
  } else {
     // Check if running in a Google Cloud environment
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
       app = initializeApp({
        credential: cert(JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS))
       });
    } else if (process.env.GCP_PROJECT) {
       app = initializeApp();
    } else {
      // Local development without specific credentials
      // The SDK will try to use a service account file if GOOGLE_APPLICATION_CREDENTIALS env var is set
      // or default to application default credentials.
      app = initializeApp();
    }
    db = getFirestore(app);
  }
  return { app, db };
}

export function getDb() {
  const { db } = initializeAdminFirebase();
  return db;
}
