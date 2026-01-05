import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
 apiKey: "AIzaSyCbXHslyVP5KjQt6ffdTYy_jY7sHO5R3hU",
 authDomain: "roamly-plan-your-nextjourney.firebaseapp.com",
 projectId: "roamly-plan-your-nextjourney",
 storageBucket: "roamly-plan-your-nextjourney.firebasestorage.app",
 messagingSenderId: "315386370414",
 appId: "1:315386370414:web:be9b50f1c29c5a9f0ec97f",
 measurementId: "G-75VMLV70PD"
};

export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
 persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export const db = getFirestore(app);