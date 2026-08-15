import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// ------------------------------------------------------------
// Create a free Firebase project (no credit card needed) at
// https://console.firebase.google.com, add a "Web app" inside it,
// and paste the config object it gives you below.
//
// This config is safe to keep public / commit to the repo — it only
// identifies which project to talk to. The actual protection (so
// strangers can't overwrite bookings or read patient lists in bulk)
// comes from firestore.rules, which you paste into the Firestore
// "Rules" tab in the same console. See README.md for the full steps.
// ------------------------------------------------------------
const firebaseConfig = {
  apiKey: 'AIzaSyBALZWq063GASSVaFQY2ETWAXpaCC781fw',
  authDomain: 'dr-naseri-dental.firebaseapp.com',
  projectId: 'dr-naseri-dental',
  storageBucket: 'dr-naseri-dental.firebasestorage.app',
  messagingSenderId: '10933254727',
  appId: '1:10933254727:web:ab1541fb11ba82d9d5cf62',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

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
