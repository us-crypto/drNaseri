# Dr. M. Naseri — Dental Health

Single-page dental clinic site (React + Vite + TypeScript + Tailwind CSS) with a live
appointment-booking section: patients pick any day in a rolling two-week window, one hour slot
per patient, and a booked slot is locked for everyone else the instant it's taken. Confirming a
booking automatically emails the clinic and opens a pre-filled WhatsApp message.

The site has a language switcher (Persian / English / Turkmen) — Persian is the default and the
page switches to right-to-left automatically for it. Dates are shown in each language's own
calendar (Persian shows the Jalali calendar). This README stays in English since it's for
whoever maintains the code.

> ⚠️ **If booked hours still show as available to other people/devices, Firebase (step 2) is
> not actually connected yet — this is by far the most common cause.** The form is designed to
> keep working even without it (so it never freezes), but that also means a missing setup step
> fails silently instead of breaking loudly. To check: open `src/firebase.ts` — if `apiKey`
> still reads `'YOUR_API_KEY'`, that's why. Also open the site, press F12 for devtools, and look
> at the Console tab — if Firebase isn't set up, you'll see an orange warning there saying so
> explicitly (never shown to patients, only in devtools).

## 1. Run it locally

```bash
npm install
npm run dev
```

Open the local URL it prints (usually `http://localhost:5173`). It works right away — Firebase
(step 2) only adds cross-patient slot-locking on top.

## 2. Set up Firebase (free, no credit card) — this is what blocks a slot automatically

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project**
   → give it any name → you can skip Google Analytics.
2. Inside the project: **Build → Firestore Database → Create database** → start in
   **production mode** → pick any region close to your patients.
3. Still in Firestore: open the **Rules** tab, delete what's there, paste in the contents of
   **`firestore.rules`** from this repo, and click **Publish**.
   (This is the rule that makes "first patient to book wins the slot" work — it rejects any
   attempt to overwrite an hour that's already booked.)
4. Back in Project Settings (gear icon, top left) → scroll to **Your apps** → click the
   **`</>`** (web) icon → register an app (any nickname) → it shows you a `firebaseConfig`
   object.
5. Copy that object into **two places**, replacing the placeholder values:
   - `src/firebase.ts`
   - `scripts/send-monthly-report.mjs`

That's it — Firestore's free tier (50k reads / 20k writes per day) is far more than a single
clinic needs.

## 3. Confirm the clinic's contact details

Already filled in for you in **`src/config.ts`**:

```ts
export const DOCTOR_WHATSAPP_NUMBER = '989031542212'
export const DOCTOR_EMAIL = 'drnaseri2019@gmail.com'
export const FORMSPREE_FORM_ID = 'xpqvvljy'
```

`WORKING_SHIFTS` and `WORKING_DAYS` in the same file control the bookable hours/days — set to
two shifts by default (08:00–12:00 and 17:00–19:00), Mon–Sat. Add, remove, or edit shifts freely.

## 4. Set up reCAPTCHA (free, optional but recommended) — blocks bot submissions

1. Go to [google.com/recaptcha/admin](https://www.google.com/recaptcha/admin) → register a new
   site → choose **reCAPTCHA v2** → **"I'm not a robot" Checkbox** → add your domain
   (`us-crypto.github.io`, and `localhost` too if you want it to work while testing locally).
2. Copy the **Site Key** it gives you into `RECAPTCHA_SITE_KEY` in `src/config.ts`.

Until you do this, the form still works and still blocks obvious bots via a built-in honeypot
field (a hidden field real visitors never fill in, but auto-fill bots do) — reCAPTCHA is a
stronger second layer on top of that, not a replacement for the form working at all.

## 5. Set up the monthly patient-count email

This runs automatically via GitHub Actions on the 1st of every month — no server needed.

1. On the Gmail account you want to send *from* (can be the same `drnaseri2019@gmail.com`,
   or a separate one): turn on 2-Step Verification, then create an
   [App Password](https://myaccount.google.com/apppasswords).
2. In your GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**
   → name it `GMAIL_APP_PASSWORD`, paste the app password as the value.
3. If you used a different sending address than `drnaseri2019@gmail.com`, update `GMAIL_USER`
   in `.github/workflows/monthly-report.yml`.

You can trigger it early to test: repo → **Actions** tab → **Monthly Patient Report** →
**Run workflow**.

## 6. How the booking flow works

- Patients pick any working day within the **next 14 days** — the window is computed fresh
  from today's date on every page load, so it automatically slides forward day by day; there's
  nothing to update manually. Change `BOOKING_WINDOW_DAYS` in `src/config.ts` to widen or
  narrow it.
- Hours come from `WORKING_SHIFTS` — two ranges by default (08:00–12:00, 17:00–19:00), so the
  grid naturally skips the closed hours in between.
- Available hours for the selected day update live (Firestore's real-time listener) — if
  someone else books 2pm while a patient is looking at the page, it greys out for them
  immediately, no reload needed. This only runs once Firebase is configured (see above) — until
  then, every hour just shows as open.
- A hidden honeypot field plus (once configured) a reCAPTCHA checkbox screen out bots before
  the form will even submit.
- **تایید رزرو** ("Confirm Booking") does up to three things automatically, from one click:
  1. Tries to lock the slot in Firestore, capped at an 8-second timeout so a slow or
     unconfigured connection can never freeze the page. If someone genuinely grabbed that slot
     a moment earlier, this step fails on purpose (enforced by the database rules, not just the
     UI) and the patient is asked to pick another hour. Any *other* failure — Firebase not set
     up yet, a network hiccup — is treated as "couldn't verify, but don't block the patient over
     it," and the flow continues to steps 2 and 3 regardless.
  2. Sends the booking to Formspree, which emails Dr. Naseri — fully automatic, no further
     action needed from the patient.
  3. Opens a pre-filled WhatsApp chat to the clinic's number with the same details.

The WhatsApp/email message the **clinic** receives always stays in Persian, since that's what
Dr. Naseri reads — only the form itself changes with the visitor's language choice.

**One honest limitation:** step 3's WhatsApp message still needs the patient to tap "send"
inside WhatsApp themselves. That's not a gap in this build — it's a rule WhatsApp enforces on
its own platform, and it can't be bypassed by a website. The only way to send a WhatsApp
message with *zero* patient interaction is Meta's paid, business-verified WhatsApp Cloud API,
which needs a registered business phone number and a backend server holding API credentials —
a meaningfully bigger project than a static site. Email already reaches the doctor with no
patient action either way, so nothing is missed even if the patient closes that WhatsApp tab.

## 7. Deploy to GitHub Pages

This repo is set up for **`github.com/us-crypto/drNaseri`**, published at
`us-crypto.github.io/drNaseri/` — `vite.config.ts` and `package.json` are already configured
for that address, so no path changes are needed as long as you push it there unmodified.

**Option A — GitHub Actions (included, recommended):**
1. Push this project to `github.com/us-crypto/drNaseri`.
2. In the repo's **Settings → Pages**, set "Source" to **GitHub Actions**.
3. Push to `main` — `.github/workflows/deploy.yml` builds and publishes automatically.

**Option B — manual, via the `gh-pages` package:**
```bash
npm run build
npm run deploy
```

If you ever rename the repo or move it under a different account, update `base` in
`vite.config.ts` (and `homepage` in `package.json`) to match — a mismatch shows up as broken
CSS/images on the live site.

**Seeing a 404 on the Pages URL?** Check the repo's **Actions** tab — if the "Deploy to
GitHub Pages" run shows a red ✕, nothing was actually published yet (a 404 just means Pages
has nothing to serve). Click into the failed run to see why; the most common cause is the
build step failing, which stops the site from ever being deployed.

## Project structure

```
src/
  App.tsx                       # splash screen, navbar, hero + gallery + implant sections
  i18n.tsx                      # fa/en/tk translations + language switcher context
  components/BookingSection.tsx # live booking calendar, Firestore slot locking, auto-send
  firebase.ts                   # Firestore connection (paste your project config here)
  config.ts                     # editable clinic settings (contact info, hours, captcha key)
firestore.rules                 # paste into Firebase Console → Firestore → Rules
scripts/send-monthly-report.mjs # counts last month's bookings, emails the doctor
.github/workflows/
  deploy.yml                    # builds + publishes to GitHub Pages on every push
  monthly-report.yml            # runs the monthly count email on the 1st of each month
```

## A note on the Turkmen translation

I translated the site into Turkmen (Latin script) as a good-faith effort, but Turkmen is a
lower-resource language for me — the everyday copy should be fine, but I'd genuinely recommend
having a native speaker skim the dental/medical terms in `src/i18n.tsx` (the `tk` section)
before treating it as patient-facing, especially the service names.
