// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);