// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAfSTow8I3P8SOmCdFkEzjV-mEDMC8S1Og",
  authDomain: "upconsent.firebaseapp.com",
  projectId: "upconsent",
  storageBucket: "upconsent.firebasestorage.app",
  messagingSenderId: "792548440786",
  appId: "1:792548440786:web:1ddc8697e82dcc1f124b0b",
  measurementId: "G-KX76EJYGKE",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
