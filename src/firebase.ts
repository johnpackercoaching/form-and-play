import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  // TODO: Replace with actual Form & Play Firebase config
  apiKey: '',
  authDomain: 'form-and-play.firebaseapp.com',
  projectId: 'form-and-play',
  storageBucket: 'form-and-play.appspot.com',
  messagingSenderId: '',
  appId: '',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
