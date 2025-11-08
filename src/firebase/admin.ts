
import { initializeApp, getApps, App, getApp, cert, applicationDefault } from 'firebase-admin/app';
import type { AppOptions } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config';
import { readFileSync } from 'node:fs';

let app: App;
let db: Firestore;

function loadServiceAccountCredential() {
  const raw = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!raw) {
    return undefined;
  }

  try {
    // Support JSON-in-env or a file path
    const json = raw.trim().startsWith('{') ? raw : readFileSync(raw, 'utf8');
    return cert(JSON.parse(json));
  } catch (err) {
    console.error('Failed to load service account credentials from GOOGLE_APPLICATION_CREDENTIALS.', err);
    return undefined;
  }
}

function initializeAdminFirebase() {
  if (getApps().length) {
    app = getApp();
    db = getFirestore(app);
  } else {
    const options: AppOptions = {
      projectId: process.env.GCP_PROJECT || firebaseConfig.projectId,
    };

    const credential = loadServiceAccountCredential();

    if (credential) {
      options.credential = credential;
    } else {
      try {
        options.credential = applicationDefault();
      } catch (err) {
        console.warn('Falling back to unauthenticated Firebase Admin initialization. Firestore writes will fail without credentials.', err);
      }
    }

    app = initializeApp(options);
    db = getFirestore(app);
  }
  return { app, db };
}

export function getDb() {
  const { db } = initializeAdminFirebase();
  return db;
}
