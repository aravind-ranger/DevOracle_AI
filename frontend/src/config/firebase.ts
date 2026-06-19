// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyCPTgv44Ro9wV6jofeii0mcHbujD31LNNI",
    authDomain: "devoracle-4c6d4.firebaseapp.com",
    projectId: "devoracle-4c6d4",
    storageBucket: "devoracle-4c6d4.firebasestorage.app",
    messagingSenderId: "300387860213",
    appId: "1:300387860213:web:5635248f27440d89520fbc",
    measurementId: "G-ZXKXM8X4X9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
getAnalytics(app);