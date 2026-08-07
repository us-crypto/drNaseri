// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBALZWq063GASSVaFQY2ETWAXpaCC781fw",
  authDomain: "dr-naseri-dental.firebaseapp.com",
  projectId: "dr-naseri-dental",
  storageBucket: "dr-naseri-dental.firebasestorage.app",
  messagingSenderId: "10933254727",
  appId: "1:10933254727:web:ab1541fb11ba82d9d5cf62",
  measurementId: "G-3D75PXS8H5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// True once you've replaced the placeholder values above with a real
// project's config. Booking code checks this so that, until Firebase is
// set up, the form still works (patients still reach WhatsApp/email) —
// it just skips the live slot-locking instead of hanging on a request to
// a project that doesn't exist.
export const isFirebaseConfigured = firebaseConfig.apiKey !== 'YOUR_API_KEY'

if (!isFirebaseConfigured && typeof window !== 'undefined') {
  // Only visible in the browser console (devtools) — never shown to
  // patients on the page. If you're seeing booked hours stay available
  // for other visitors, this is almost always why: src/firebase.ts still
  // has placeholder values. See README.md step 2.
  // eslint-disable-next-line no-console
  console.warn(
    '[dr-naseri-dental] Firebase is not configured yet (src/firebase.ts has placeholder values) — ' +
      'booking still works, but slots are not locked across devices until this is set up. See README.md step 2.',
  )
}
