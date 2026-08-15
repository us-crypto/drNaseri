// Runs monthly via .github/workflows/monthly-report.yml (GitHub Actions'
// free scheduled cron). Counts how many patients booked in the previous
// calendar month and emails that count to the doctor.
//
// Uses the SAME public Firebase web config as src/firebase.ts — that's
// fine, it's not a secret (see the comment in that file). It can read the
// "bookings" collection because firestore.rules allows public read.
// The only real secret here is the Gmail App Password used to send mail.

import { initializeApp } from 'firebase/app'
import { collection, getDocs, getFirestore, query, Timestamp, where } from 'firebase/firestore'
import nodemailer from 'nodemailer'

// Keep this in sync with src/firebase.ts.
const firebaseConfig = {
  apiKey: 'AIzaSyBALZWq063GASSVaFQY2ETWAXpaCC781fw',
  authDomain: 'dr-naseri-dental.firebaseapp.com',
  projectId: 'dr-naseri-dental',
  storageBucket: 'dr-naseri-dental.firebasestorage.app',
  messagingSenderId: '10933254727',
  appId: '1:10933254727:web:ab1541fb11ba82d9d5cf62',
}

const DOCTOR_EMAIL = 'drnaseri2019@gmail.com'

async function main() {
  const app = initializeApp(firebaseConfig)
  const db = getFirestore(app)

  const now = new Date()
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const bookingsQuery = query(
    collection(db, 'bookings'),
    where('createdAt', '>=', Timestamp.fromDate(startOfPrevMonth)),
    where('createdAt', '<', Timestamp.fromDate(startOfThisMonth)),
  )
  const snapshot = await getDocs(bookingsQuery)
  const count = snapshot.size

  const monthLabel = startOfPrevMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const gmailUser = process.env.GMAIL_USER
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD
  if (!gmailUser || !gmailAppPassword) {
    throw new Error('Missing GMAIL_USER or GMAIL_APP_PASSWORD environment variables.')
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: gmailUser, pass: gmailAppPassword },
  })

  await transporter.sendMail({
    from: gmailUser,
    to: DOCTOR_EMAIL,
    subject: `Monthly patient count — ${monthLabel}`,
    text: `${count} patient${count === 1 ? '' : 's'} booked an appointment in ${monthLabel}.`,
  })

  console.log(`Sent monthly report: ${count} booking(s) in ${monthLabel}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
