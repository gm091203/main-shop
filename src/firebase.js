import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDDq60e8Z_hit1BV1izJLQNttUkp0_LUEc",
  authDomain: "zeos-shop.firebaseapp.com",
  projectId: "zeos-shop",
  storageBucket: "zeos-shop.firebasestorage.app",
  messagingSenderId: "547466107383",
  appId: "1:547466107383:web:9f029a1b15fed71775fe9c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false
});
const auth = getAuth(app);

export { app, db, auth };
