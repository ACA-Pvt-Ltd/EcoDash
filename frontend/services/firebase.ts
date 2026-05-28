import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyAX_ZnhLITR48N8EeqRFfjKQNCbzM55oSA',
  authDomain: 'ecodash-27845.firebaseapp.com',
  databaseURL: 'https://ecodash-27845-default-rtdb.firebaseio.com',
  projectId: 'ecodash-27845',
  storageBucket: 'ecodash-27845.firebasestorage.app',
  messagingSenderId: '619261486530',
  appId: '1:619261486530:web:5b77387b5533ef077ba25b',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getDatabase(app);
