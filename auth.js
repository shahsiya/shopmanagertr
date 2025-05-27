// auth.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyAuXmPITC79LJveEea3tIJqX4a6ToRbMp0",
  authDomain: "shopmanagertr.firebaseapp.com",
  projectId: "shopmanagertr",
  storageBucket: "shopmanagertr.firebasestorage.app",
  messagingSenderId: "403228706121",
  appId: "1:403228706121:web:99c442b4ed70c5b9c5c698"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function signIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

function signOut() {
  return firebaseSignOut(auth);
}

export { auth, db, signIn, signOut, onAuthStateChanged };
