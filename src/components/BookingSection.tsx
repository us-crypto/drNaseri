import React, { useEffect, useMemo, useRef, useState } from 'react'
import { collection, doc, getDoc, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'
import {
  BOOKING_WINDOW_DAYS,
  CLINIC_NAME,
  DOCTOR_EMAIL,
  DOCTOR_WHATSAPP_NUMBER,
  FORMSPREE_ENDPOINT,
  RECAPTCHA_SITE_KEY,
  WORKING_DAYS,
  WORKING_SHIFTS,
} from '../config'
import { LANG_LOCALE, useLanguage } from '../i18n'

declare global {
  interface Window {
    grecaptcha?: {
      render: (container: string | HTMLElement, params: Record<string, unknown>) => number
      reset: (widgetId?: number) => void
    }
    onRecaptchaLoad?: () => void
  }
}

const isCaptchaConfigured = RECAPTCHA_SITE_KEY !== 'YOUR_RECAPTCHA_SITE_KEY'

// ------------------------------------------------------------
// Small self-contained scroll reveal (kept local to this file
// so BookingSection.tsx has no dependency on App.tsx internals).
// ------------------------------------------------------------
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.disconnect()
          }
        })
      },
      { threshold },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, visible }
}

// ------------------------------------------------------------
// Date / time helpers
// ------------------------------------------------------------

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
const WEEKDAY_LETTER_FA = ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'] // indexed by Date#getDay() (0 = Sunday)
const WEEKDAY_LETTER_LATIN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function toPersianDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)])
}

interface DayOption {
  date: Date
  dateStr: string
  calDay: string
  calMonth: string
  weekdayLetter: string
}

function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// A rolling window that always starts tomorrow and covers the next
// BOOKING_WINDOW_DAYS working days — since it's computed fresh from
// "today" on every page load, the whole window slides forward on its
// own as each day passes, with nothing to update by hand.
function buildBookableDays(locale: string, isFa: boolean): DayOption[] {
  const days: DayOption[] = []
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  cursor.setDate(cursor.getDate() + 1)

  for (let guard = 0; days.length < BOOKING_WINDOW_DAYS && guard < BOOKING_WINDOW_DAYS * 3; guard++) {
    if (WORKING_DAYS.includes(cursor.getDay())) {
      const parts = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).formatToParts(cursor)
      days.push({
        date: new Date(cursor),
        dateStr: toDateStr(cursor),
        calDay: parts.find((p) => p.type === 'day')?.value ?? '',
        calMonth: parts.find((p) => p.type === 'month')?.value ?? '',
        weekdayLetter: isFa ? WEEKDAY_LETTER_FA[cursor.getDay()] : WEEKDAY_LETTER_LATIN[cursor.getDay()],
      })
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

function buildHourSlots(): number[] {
  const slots: number[] = []
  for (const shift of WORKING_SHIFTS) {
    for (let h = shift.start; h < shift.end; h++) slots.push(h)
  }
  return slots
}

function formatHour(h: number, isFa: boolean): string {
  const label = `${String(h).padStart(2, '0')}:00`
  return isFa ? toPersianDigits(label) : label
}

// Reassembled in the natural reading order (weekday, day, month, year) —
// each locale's own default part order reads a bit oddly otherwise.
function formatFullDate(d: Date, locale: string): string {
  const parts = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).formatToParts(d)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('weekday')} ${get('day')} ${get('month')} ${get('year')}`
}

// Never let a Firestore call hang the page forever — if it doesn't settle
// within this long, treat it the same as a failure and move on.
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      },
    )
  })
}

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'
type LockResult = 'locked' | 'taken' | 'skipped'

export default function BookingSection() {
  const { lang, t } = useLanguage()
  const isFa = lang === 'fa'
  const locale = LANG_LOCALE[lang]

  const { ref, visible } = useReveal()
  const hours = useMemo(buildHourSlots, [])
  const days = useMemo(() => buildBookableDays(locale, isFa), [locale, isFa])

  const [selectedDay, setSelectedDay] = useState<DayOption | null>(null)
  const [takenHours, setTakenHours] = useState<Set<number>>(new Set())
  const [loadingSlots, setLoadingSlots] = useState(true)

  const [selectedHour, setSelectedHour] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [problem, setProblem] = useState('')
  const [website, setWebsite] = useState('') // honeypot — real visitors never see or fill this
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Keep the selected day valid whenever the day list is rebuilt (e.g. on
  // language switch, or if the previously selected day rolled out of the
  // window) — default to the first bookable day.
  useEffect(() => {
    setSelectedDay((prev) => {
      if (prev) {
        const stillValid = days.find((d) => d.dateStr === prev.dateStr)
        if (stillValid) return stillValid
      }
      return days[0] ?? null
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days])

  // reCAPTCHA v2 widget — rendered once a site key is configured; the form
  // works without it too (the honeypot field still screens obvious bots).
  const recaptchaRef = useRef<HTMLDivElement | null>(null)
  const recaptchaWidgetId = useRef<number | null>(null)

  useEffect(() => {
    if (!isCaptchaConfigured) return

    const renderWidget = () => {
      if (recaptchaRef.current && recaptchaWidgetId.current === null && window.grecaptcha) {
        recaptchaWidgetId.current = window.grecaptcha.render(recaptchaRef.current, {
          sitekey: RECAPTCHA_SITE_KEY,
          callback: (token: string) => setCaptchaToken(token),
          'expired-callback': () => setCaptchaToken(null),
        })
      }
    }

    if (window.grecaptcha) {
      renderWidget()
      return
    }
    if (document.getElementById('recaptcha-script')) return

    window.onRecaptchaLoad = renderWidget
    const script = document.createElement('script')
    script.id = 'recaptcha-script'
    script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit'
    script.async = true
    script.defer = true
    document.body.appendChild(script)
  }, [])

  // Live-updating list of already-booked hours for the selected date, so a
  // slot someone else just took disappears for everyone without a reload.
  // Skipped entirely until Firebase is actually configured, so the page
  // never sits there waiting on a project that doesn't exist yet.
  useEffect(() => {
    if (!selectedDay) {
      setTakenHours(new Set())
      setLoadingSlots(false)
      return
    }
    if (!isFirebaseConfigured) {
      setTakenHours(new Set())
      setLoadingSlots(false)
      return
    }

    setLoadingSlots(true)
    const q = query(collection(db, 'bookings'), where('date', '==', selectedDay.dateStr))
    // eslint-disable-next-line no-console
    console.log('[booking] subscribing to date', selectedDay.dateStr)
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const taken = new Set<number>()
        snapshot.forEach((docSnap: { data: () => Record<string, unknown> }) => {
          const data = docSnap.data()
          if (typeof data.hour === 'number') taken.add(data.hour)
        })
        // eslint-disable-next-line no-console
        console.log('[booking] live snapshot for', selectedDay.dateStr, '— taken hours:', Array.from(taken), '— doc count:', snapshot.size)
        setTakenHours(taken)
        setLoadingSlots(false)
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.log('[booking] snapshot listener error for', selectedDay.dateStr, '—', err)
        setTakenHours(new Set())
        setLoadingSlots(false)
      },
    )
    return () => unsubscribe()
  }, [selectedDay])

  const isFormReady = Boolean(
    selectedDay &&
      selectedHour !== null &&
      name.trim() &&
      phone.trim() &&
      (!isCaptchaConfigured || captchaToken),
  )

  // Tries to lock the slot in the shared database. Never throws and never
  // hangs — if Firebase isn't set up yet, or the request times out, it
  // just tells the caller to carry on without a hard lock rather than
  // blocking the patient from reaching WhatsApp/email.
  //
  // Checks whether the slot is already taken directly (not just relying on
  // the live list on screen, which could be a moment stale) before writing
  // — so a slot can't be double-booked even if the Firestore security
  // rules on the project aren't set up exactly right yet.
  async function tryLockSlot(slotId: string, data: Record<string, unknown>): Promise<LockResult> {
    // eslint-disable-next-line no-console
    console.log('[booking] attempting to lock slot', slotId, '— firebase configured:', isFirebaseConfigured)
    if (!isFirebaseConfigured) return 'skipped'
    const ref = doc(db, 'bookings', slotId)
    try {
      const existing = await withTimeout(getDoc(ref), 8000)
      // eslint-disable-next-line no-console
      console.log('[booking] existence check for', slotId, '— exists:', existing.exists())
      if (existing.exists()) return 'taken'
    } catch (err) {
      const code = (err as { code?: string } | null)?.code
      // eslint-disable-next-line no-console
      console.log('[booking] existence check FAILED for', slotId, '— code:', code, '— error:', err)
      if (code === 'permission-denied') return 'taken'
      // Couldn't check (network hiccup, etc.) — fall through and still try
      // the write below, which has its own protection either way.
    }
    try {
      await withTimeout(setDoc(ref, data), 8000)
      // eslint-disable-next-line no-console
      console.log('[booking] write SUCCEEDED for', slotId)
      return 'locked'
    } catch (err) {
      const code = (err as { code?: string } | null)?.code
      // eslint-disable-next-line no-console
      console.log('[booking] write FAILED for', slotId, '— code:', code, '— error:', err)
      if (code === 'permission-denied') return 'taken'
      return 'skipped'
    }
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDay || selectedHour === null || !isFormReady || status === 'submitting') return

    // Honeypot: real visitors never fill this field in (it's invisible to
    // them). If it's non-empty, silently drop the submission.
    if (website.trim()) return

    setStatus('submitting')
    setErrorMessage('')

    // Open the WhatsApp tab synchronously, inside the click handler, so
    // browsers don't treat it as a blocked popup — we fill in its address
    // once the booking step below settles, which happens quickly either way.
    const waWindow = window.open('', '_blank')

    const slotId = `${selectedDay.dateStr}_${selectedHour}`
    // eslint-disable-next-line no-console
    console.log('[booking] confirm clicked — slotId:', slotId, '— browser timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone)
    const lockResult = await tryLockSlot(slotId, {
      name: name.trim(),
      phone: phone.trim(),
      date: selectedDay.dateStr,
      hour: selectedHour,
      problem: problem.trim(),
      createdAt: serverTimestamp(),
    })

    if (lockResult === 'taken') {
      waWindow?.close()
      window.grecaptcha?.reset(recaptchaWidgetId.current ?? undefined)
      setCaptchaToken(null)
      setStatus('error')
      setErrorMessage(t.slotTakenError)
      return
    }

    // The doctor reads Persian, so the notification she receives always
    // stays in Persian regardless of which language the patient viewed the
    // site in — only the on-page form labels change with the language.
    const summary = [
      'درخواست نوبت جدید',
      `نام: ${name.trim()}`,
      `تلفن: ${phone.trim()}`,
      `تاریخ: ${formatFullDate(selectedDay.date, 'fa-IR')}`,
      `ساعت: ${formatHour(selectedHour, true)}`,
      problem.trim() ? `مشکل دندانی: ${problem.trim()}` : undefined,
    ]
      .filter(Boolean)
      .join('\n')

    const waUrl = `https://wa.me/${DOCTOR_WHATSAPP_NUMBER}?text=${encodeURIComponent(summary)}`
    if (waWindow) waWindow.location.href = waUrl
    else window.open(waUrl, '_blank', 'noopener,noreferrer')

    // Auto-email the clinic too — fire-and-forget, doesn't block the
    // confirmation screen if it's slow.
    fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        phone: phone.trim(),
        date: formatFullDate(selectedDay.date, 'fa-IR'),
        time: formatHour(selectedHour, true),
        dentalIssue: problem.trim(),
        _subject: `درخواست نوبت جدید — ${CLINIC_NAME}`,
      }),
    }).catch(() => {})

    setStatus('success')
  }

  const resetForm = () => {
    setStatus('idle')
    setSelectedHour(null)
    setName('')
    setPhone('')
    setProblem('')
    setCaptchaToken(null)
    window.grecaptcha?.reset(recaptchaWidgetId.current ?? undefined)
  }

  return (
    <section id="booking" className="w-full bg-white px-3 md:px-5 py-14 md:py-24">
      <div
        ref={ref}
        className="max-w-5xl mx-auto"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div className="mb-8 md:mb-12">
          <p className="text-xs md:text-sm font-semibold text-black mb-2 md:mb-3">{t.bookingEyebrow}</p>
          <h2 className="text-black text-[clamp(2.25rem,7vw,5.5rem)] font-bold leading-[0.95] tracking-tight">
            {t.bookingHeadingLine1}
            <br />
            {t.bookingHeadingLine2}
          </h2>
          <p className="text-sm md:text-base font-semibold text-black/60 mt-3">{t.bookingSubtitle}</p>
        </div>

        {status === 'success' && selectedDay ? (
          <div className="rounded-xl md:rounded-2xl bg-stone-50 p-6 md:p-10">
            <h3 className="text-xl md:text-2xl font-bold text-black mb-2">{t.successHeading}</h3>
            <p className="text-sm md:text-base text-black/70">
              {t.successParagraph(
                name.trim(),
                formatFullDate(selectedDay.date, locale),
                selectedHour !== null ? formatHour(selectedHour, isFa) : '',
              )}
            </p>
            <button
              onClick={resetForm}
              className="mt-6 px-6 py-3 bg-black rounded-full text-white text-sm font-semibold hover:bg-neutral-800 transition-colors duration-200"
            >
              {t.resetButton}
            </button>
          </div>
        ) : (
          <form onSubmit={handleConfirm} className="rounded-xl md:rounded-2xl bg-stone-50 p-5 md:p-10">
            {/* Honeypot — hidden from real visitors, invisible to screen readers */}
            <div className="absolute w-0 h-0 overflow-hidden opacity-0 pointer-events-none" aria-hidden="true">
              <label htmlFor="website">Website</label>
              <input
                id="website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <div className="mb-6 md:mb-8">
              <p className="text-xs md:text-sm font-semibold text-black mb-3">{t.chooseDateLabel}</p>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                {days.map((d) => {
                  const isSelected = selectedDay?.dateStr === d.dateStr
                  return (
                    <button
                      type="button"
                      key={d.dateStr}
                      onClick={() => {
                        setSelectedDay(d)
                        setSelectedHour(null)
                      }}
                      className={`shrink-0 flex flex-col items-center justify-center rounded-xl border py-3 px-4 min-w-[64px] transition-colors duration-150 ${
                        isSelected
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-black border-neutral-200 hover:border-black'
                      }`}
                    >
                      <span className="text-xs font-semibold opacity-70">{d.weekdayLetter}</span>
                      <span className="text-lg font-bold leading-tight">
                        {isFa ? toPersianDigits(d.calDay) : d.calDay}
                      </span>
                      <span className="text-[10px] font-semibold opacity-70">{d.calMonth}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mb-6 md:mb-8">
              <p className="text-xs md:text-sm font-semibold text-black mb-3">{t.chooseHourLabel}</p>
              {loadingSlots ? (
                <p className="text-sm text-black/50">{t.loadingHours}</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {hours.map((h) => {
                    const isTaken = takenHours.has(h)
                    const isSelected = selectedHour === h
                    return (
                      <button
                        type="button"
                        key={h}
                        disabled={isTaken}
                        onClick={() => setSelectedHour(h)}
                        dir="ltr"
                        className={`rounded-xl border py-3 text-sm font-semibold transition-colors duration-150 ${
                          isTaken
                            ? 'bg-neutral-100 text-black/30 border-neutral-100 line-through cursor-not-allowed'
                            : isSelected
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-black border-neutral-200 hover:border-black'
                        }`}
                      >
                        {formatHour(h, isFa)}
                      </button>
                    )
                  })}
                </div>
              )}
              <p className="text-xs text-black/50 mt-3">{t.hoursNote}</p>
            </div>

            {selectedHour !== null && (
              <div className="mb-6 md:mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="name" className="text-xs md:text-sm font-semibold text-black">
                    {t.nameLabel}
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.namePlaceholder}
                    className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-black outline-none focus:border-black transition-colors duration-150"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="phone" className="text-xs md:text-sm font-semibold text-black">
                    {t.phoneLabel}
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    dir="ltr"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t.phonePlaceholder}
                    className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-black text-left outline-none focus:border-black transition-colors duration-150"
                  />
                </div>

                <div className="md:col-span-2 flex flex-col gap-1.5">
                  <label htmlFor="problem" className="text-xs md:text-sm font-semibold text-black">
                    {t.problemLabel}
                  </label>
                  <textarea
                    id="problem"
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    placeholder={t.problemPlaceholder}
                    rows={3}
                    className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-black outline-none focus:border-black transition-colors duration-150 resize-none"
                  />
                </div>

                {isCaptchaConfigured && (
                  <div className="md:col-span-2">
                    <div ref={recaptchaRef} />
                  </div>
                )}
              </div>
            )}

            {selectedHour !== null && (
              <button
                type="submit"
                disabled={!isFormReady || status === 'submitting'}
                className="w-full sm:w-auto px-8 py-4 bg-black rounded-full text-white text-sm md:text-base font-semibold hover:bg-neutral-800 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {status === 'submitting' ? t.submittingButton : t.confirmButton}
              </button>
            )}

            {status === 'error' && <p className="text-sm text-red-600 mt-4">{errorMessage}</p>}

            <p className="text-xs text-black/40 mt-6">
              {t.disclaimerPrefix}{' '}
              <a href={`mailto:${DOCTOR_EMAIL}`} className="underline hover:text-black" dir="ltr">
                {DOCTOR_EMAIL}
              </a>
            </p>
          </form>
        )}
      </div>
    </section>
  )
}
