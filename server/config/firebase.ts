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
    // Check if using emulator (default: true for local dev)
    const useEmulator = process.env.USE_EMULATOR === 'true';

    if (useEmulator) {
      // Set emulator hosts from environment variables
      if (process.env.EMULATOR_FIRESTORE_HOST) {
        process.env.FIRESTORE_EMULATOR_HOST = process.env.EMULATOR_FIRESTORE_HOST;
      }
      if (process.env.EMULATOR_AUTH_HOST) {
        process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.EMULATOR_AUTH_HOST;
      }
      if (process.env.EMULATOR_STORAGE_HOST) {
        process.env.FIREBASE_STORAGE_EMULATOR_HOST = process.env.EMULATOR_STORAGE_HOST;
      }

      // For emulator, use local service account with upconsent project ID
      console.log("🔧 Using Firebase Emulator mode");
      console.log("  - FIRESTORE_EMULATOR_HOST:", process.env.FIRESTORE_EMULATOR_HOST);
      console.log("  - FIREBASE_AUTH_EMULATOR_HOST:", process.env.FIREBASE_AUTH_EMULATOR_HOST);
      console.log("  - FIREBASE_STORAGE_EMULATOR_HOST:", process.env.FIREBASE_STORAGE_EMULATOR_HOST);

      const localServiceAccountPath = join(__dirname, '../../firebase-admin-key.local.json');
      const localServiceAccount = JSON.parse(readFileSync(localServiceAccountPath, 'utf8'));

      admin.initializeApp({
        credential: admin.credential.cert(localServiceAccount),
        projectId: "upconsent",
      });
    } else {
      // Production Firebase mode
      console.log("🚀 Using Production Firebase");
      const serviceAccountPath = join(__dirname, '../../firebase-admin-key.json');
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: "upconsent",
        storageBucket: "upconsent.firebasestorage.app",
      });
    }

    console.log("✅ Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", error);
    throw new Error("Firebase Admin SDK configuration required for server operations");
  }
}

export const db = admin.firestore();
export const storage = admin.storage();
export default admin;