import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBnG8UhUM-3aYEBbwUFZV7sfbFCCHGM-AI",
  authDomain: "whatsapp-lite-c6685.firebaseapp.com",
  projectId: "whatsapp-lite-c6685",
  storageBucket: "whatsapp-lite-c6685.appspot.com",
  messagingSenderId: "421934470474",
  appId: "1:421934470474:web:18a49f5f3235af41fbddb3",
  measurementId: "G-LSM2EN82CL",
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({ prompt: "select_account" });
googleProvider.addScope("profile");
googleProvider.addScope("email");

export const generateChatId = (uid1: string, uid2: string): string => {
  return [uid1, uid2].sort().join("_");
};
