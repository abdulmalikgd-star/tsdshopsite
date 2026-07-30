import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: "AIzaSyBTMAD6D1eUiPuIq0tsV2UhECK8zj-Qn1g",
  authDomain: "tsdtech-d557f.firebaseapp.com",
  projectId: "tsdtech-d557f",
  storageBucket: "tsdtech-d557f.firebasestorage.app",
  messagingSenderId: "398419445159",
  appId: "1:398419445159:web:fc243d9023aa43a720a282",
  measurementId: "G-4W5ZDTSQRV"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
auth.languageCode = 'ar';
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
