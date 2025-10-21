import { initializeApp } from 'firebase/app'
import {
  getFirestore, collection, addDoc, serverTimestamp, onSnapshot, query, where,
  doc, updateDoc, increment, setDoc
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

export const colReports        = collection(db, 'reports')
export const colSegments       = collection(db, 'segments')
export const colAnnouncements  = collection(db, 'announcements')   // ⬅️ ESTE FALTABA

export {
  addDoc, serverTimestamp, onSnapshot, query, where, doc, updateDoc, increment, setDoc
}
