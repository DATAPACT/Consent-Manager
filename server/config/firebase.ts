import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAfSTow8I3P8SOmCdFkEzjV-mEDMC8S1Og",
  authDomain: "upconsent.firebaseapp.com",
  projectId: "upconsent",
  storageBucket: "upconsent.firebasestorage.app",
  messagingSenderId: "792548440786",
  appId: "1:792548440786:web:1ddc8697e82dcc1f124b0b",
  measurementId: "G-KX76EJYGKE",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;