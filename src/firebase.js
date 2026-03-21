import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDDq60e8Z_hit1BV1izJLQNttUkp0_LUEc",
  authDomain: "zeos-shop.firebaseapp.com",
  projectId: "zeos-shop",
  storageBucket: "zeos-shop.firebasestorage.app",
  messagingSenderId: "16355169282",
  appId: "1:16355169282:web:24aadc37026bd883b2c31b",
  measurementId: "G-7242KHX0RR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
