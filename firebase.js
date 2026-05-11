// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBkHQ_uMWfy2M3_iB9iqZZxw0MFORjC5w0",
  authDomain: "flashlearn-7d777.firebaseapp.com",
  projectId: "flashlearn-7d777",
  storageBucket: "flashlearn-7d777.firebasestorage.app",
  messagingSenderId: "56763011530",
  appId: "1:56763011530:web:6d72aa9c9a3b96b83e3f33",
  measurementId: "G-YHT6TFXZ23"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Use Platform detection so Web Browser uses standard web persistence, while iOS/Android uses React Native's AsyncStorage.
const auth = Platform.OS === 'web' 
  ? getAuth(app) 
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });

export { app, db, auth, storage };