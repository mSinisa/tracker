import { initializeApp } from 'firebase/app'

// Your web app's Firebase configuration. These values identify the project; they are not secrets.
const firebaseConfig = {
  apiKey: 'AIzaSyB1mpST2ZTwkBetW-uhR5OifmuF_QOvTcs',
  authDomain: 'tracker-cc170.firebaseapp.com',
  projectId: 'tracker-cc170',
  storageBucket: 'tracker-cc170.firebasestorage.app',
  messagingSenderId: '717106718095',
  appId: '1:717106718095:web:0b5c5c826bcb3a771797fa',
}

/** The one Firebase app instance, shared by every Firebase adapter. */
export const firebaseApp = initializeApp(firebaseConfig)
