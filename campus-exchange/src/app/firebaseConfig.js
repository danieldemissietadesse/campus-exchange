// src/app/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCuuZsEWM8e6_grnsuXOpuGexYJ0Miy9Aw",
  authDomain: "campus-exchange-4323b.firebaseapp.com",
  projectId: "campus-exchange-4323b",
  storageBucket: "campus-exchange-4323b.firebasestorage.app",
  messagingSenderId: "178260341187",
  appId: "1:178260341187:web:615d0e02e840654c530d76",
  measurementId: "G-9W7QQ83CVP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;