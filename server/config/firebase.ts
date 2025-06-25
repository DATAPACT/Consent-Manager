// Use Firebase Admin SDK for server-side operations
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // Load service account key from file
    const serviceAccountPath = join(__dirname, '../../firebase-admin-key.json');
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: "upconsent",
      storageBucket: "upconsent.firebasestorage.app",
    });
    
    console.log("Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
    throw new Error("Firebase Admin SDK configuration required for server operations");
  }
}

export const db = admin.firestore();
export const storage = admin.storage();
export default admin;