import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDC1CSN4XlXVcVwyQ2P5soHrX2hpGCy4Ts',
  authDomain: 'form-and-play.firebaseapp.com',
  projectId: 'form-and-play',
  storageBucket: 'form-and-play.firebasestorage.app',
  messagingSenderId: '13054494592',
  appId: '1:13054494592:web:7c102c367b778395b5e365',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
