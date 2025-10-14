import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCq--mTlPsYGN2F59pf1hACigEsq9V4Cmk",
  authDomain: "first-a7079.firebaseapp.com",
  projectId: "first-a7079",
  storageBucket: "first-a7079.firebasestorage.app",
  messagingSenderId: "592843008641",
  appId: "1:592843008641:web:3ac19c83dcdce4d0cabb80",
  measurementId: "G-DENH5RC0EN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Analytics (optional)
export const analytics = getAnalytics(app);

export default app;