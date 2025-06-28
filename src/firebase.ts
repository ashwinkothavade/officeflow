import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDrhGVxT_j-ce8V3VznBYqldf-0cM5yIDg",
    authDomain: "officeflow-4974f.firebaseapp.com",
    projectId: "officeflow-4974f",
    storageBucket: "officeflow-4974f.firebasestorage.app",
    messagingSenderId: "752875440730",
    appId: "1:752875440730:web:46302551c3e4a67b4fa663",
    measurementId: "G-D90TFJ3MBD"
};

// Note: Replace the above values with your actual Firebase config

// Initialize Firebase
let app;
if (!firebase.apps.length) {
  app = firebase.initializeApp(firebaseConfig);
} else {
  app = firebase.app();
}

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Configure Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
// Add any additional scopes you might need
googleProvider.addScope('profile');
googleProvider.addScope('email');
// Set custom parameters if needed
googleProvider.setCustomParameters({
  prompt: 'select_account'  // Forces account selection even for one account
});

// Debug log for Google provider
console.log('Google authentication provider configured');

// Enable offline persistence for Firestore
// db.enablePersistence().catch((err) => {
//   console.error('Firebase persistence error:', err);
// });

// Log Firebase initialization
console.log('Firebase initialized:', app.name);

export { auth, db, storage, googleProvider };
export default firebase;

