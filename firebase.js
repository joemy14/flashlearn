import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBkHQ_uMWfy2M3_iB9iqZZxw0MFORjC5w0",
  authDomain: "flashlearn-7d777.firebaseapp.com",
  projectId: "flashlearn-7d777",
  storageBucket: "flashlearn-7d777.firebasestorage.app",
  messagingSenderId: "56763011530",
  appId: "1:56763011530:web:6d72aa9c9a3b96b83e3f33",
  measurementId: "G-YHT6TFXZ23"
};

// Init app
const app = initializeApp(firebaseConfig);

// Firestore + Storage
const db = getFirestore(app);
const storage = getStorage(app);

// Auth (web vs native fix)
const auth =
  Platform.OS === "web"
    ? getAuth(app)
    : initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });

export { app, db, auth, storage };