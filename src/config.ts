// ============================================================
//  CLINIC SETTINGS — edit the values below, nothing else needed
// ============================================================

// 1. Dr. Naseri's WhatsApp number, in international format, digits only.
export const DOCTOR_WHATSAPP_NUMBER = '989031542212'

// 2. Dr. Naseri's email address.
export const DOCTOR_EMAIL = 'drnaseri2019@gmail.com'

// 3. Formspree endpoint — auto-emails the doctor on every booking.
export const FORMSPREE_FORM_ID = 'xpqvvljy'
export const FORMSPREE_ENDPOINT = `https://formspree.io/f/${FORMSPREE_FORM_ID}`

// 4. Booking calendar settings — one appointment slot per hour, across
//    two shifts (morning + evening). Add/remove/edit shifts freely; each
//    is a separate {start, end} range in 24h time — `end` is exclusive,
//    so {start: 8, end: 12} books 08:00, 09:00, 10:00, 11:00.
export const WORKING_SHIFTS = [
  { start: 8, end: 12 },
  { start: 17, end: 19 },
]
export const WORKING_DAYS = [1, 2, 3, 4, 5, 6] // 0 = Sunday ... 6 = Saturday (clinic closed Sundays)
export const BOOKING_WINDOW_DAYS = 14 // rolling 2-week window, always starting from tomorrow

// 5. reCAPTCHA — free bot-blocking checkbox on the booking form. Get a
//    site key at https://www.google.com/recaptcha/admin (choose
//    "reCAPTCHA v2" → "I'm not a robot" checkbox, register your domain),
//    then paste the site key below. Until you do, the form still works —
//    it just relies on the built-in honeypot field alone for bot protection.
export const RECAPTCHA_SITE_KEY = 'YOUR_RECAPTCHA_SITE_KEY'

export const CLINIC_NAME = 'دندان‌پزشکی دکتر ناصری'
