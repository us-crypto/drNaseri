import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type Lang = 'fa' | 'en' | 'tk'

export const LANG_DIR: Record<Lang, 'rtl' | 'ltr'> = { fa: 'rtl', en: 'ltr', tk: 'ltr' }
export const LANG_LOCALE: Record<Lang, string> = { fa: 'fa-IR', en: 'en-US', tk: 'tk' }
export const LANG_ENDONYM: Record<Lang, string> = { fa: 'فارسی', en: 'English', tk: 'Türkmen' }

export interface ServiceItem {
  name: string
}

export interface Translation {
  navLogoLine1: string
  navLogoLine2: string
  navTagline: string
  navMenuButton: string
  navEmergency: string
  navToggleAria: string
  navLinks: string[]
  navBookButton: string

  featureBars: string[]
  heroParagraphLine1: string
  heroParagraphLine2: string
  heroBadge: string
  heroHeadingLine1: string
  heroHeadingLine2: string
  heroFreeConsult: string

  smileGalleryHeading: string
  smileGallerySubtitle: string
  smileCard1Line1: string
  smileCard1Line2: string
  callUsButton: string
  makeoverLine1: string
  makeoverLine2: string
  services: ServiceItem[]

  implantHeadingLine1: string
  implantHeadingLine2: string
  implantSubtitle: string
  img1Alt: string
  img2Alt: string
  img3Alt: string
  consultationLabel: string
  consultationHeadingLine1: string
  consultationHeadingLine2: string
  consultationHeadingLine3: string
  bookOnlineButton: string
  processHeadingLine1: string
  processHeadingLine2: string
  processHeadingLine3: string
  careHeadingLine1: string
  careHeadingLine2: string
  careHeadingLine3: string

  bookingEyebrow: string
  bookingHeadingLine1: string
  bookingHeadingLine2: string
  bookingSubtitle: string
  chooseDateLabel: string
  chooseHourLabel: string
  loadingHours: string
  hoursNote: string
  nameLabel: string
  namePlaceholder: string
  phoneLabel: string
  phonePlaceholder: string
  problemLabel: string
  problemPlaceholder: string
  captchaError: string
  confirmButton: string
  submittingButton: string
  slotTakenError: string
  genericError: string
  successHeading: string
  successParagraph: (name: string, date: string, time: string) => string
  resetButton: string
  disclaimerPrefix: string
  disclaimerEmailCta: string
}

export const translations: Record<Lang, Translation> = {
  // ------------------------------------------------------------------ fa
  fa: {
    navLogoLine1: 'دکتر',
    navLogoLine2: 'ناصری',
    navTagline: 'دندان‌پزشکی با کیفیت در گرگان',
    navMenuButton: 'منو',
    navEmergency: 'اورژانس دندانپزشکی',
    navToggleAria: 'باز و بسته کردن منو',
    navLinks: ['خانه', 'خدمات', 'درباره ما', 'گالری', 'تماس'],
    navBookButton: 'رزرو نوبت',

    featureBars: ['دندانپزشکی پیشرفته', 'تجهیزات با کیفیت بالا', 'کادر مهربان و دوستانه'],
    heroParagraphLine1: 'با عشق و جدیدترین امکانات روز،',
    heroParagraphLine2: 'از لبخند شما مراقبت می‌کنیم',
    heroBadge: 'همراه شما برای یک لبخند سالم',
    heroHeadingLine1: 'دندان‌های',
    heroHeadingLine2: 'سالم',
    heroFreeConsult: 'مشاوره رایگان',

    smileGalleryHeading: 'گالری لبخند',
    smileGallerySubtitle: 'نمونه کارهای زیبایی دندان ما',
    smileCard1Line1: 'اگر به دنبال لبخندی زیبا هستید،',
    smileCard1Line2: 'برای مشاوره تغییر لبخند با ما تماس بگیرید.',
    callUsButton: 'تماس با ما',
    makeoverLine1: 'تغییر',
    makeoverLine2: 'لبخند',
    services: [
      { name: 'دندانپزشکی\nکودکان' },
      { name: 'عصب‌کشی\nو روکش' },
      { name: 'کامپوزیت\nو لمینت' },
      { name: 'ایمپلنت' },
      { name: 'ترمیم\nپوسیدگی' },
      { name: 'بلیچینگ و\nسفید کردن' },
      { name: 'بازسازی و\nجرم‌گیری' },
    ],

    implantHeadingLine1: 'ایمپلنت',
    implantHeadingLine2: 'دندان',
    implantSubtitle: 'بازسازی دندان‌های از دست رفته',
    img1Alt: 'روند ایمپلنت دندان',
    img2Alt: 'بازسازی دندان',
    img3Alt: 'بیمار خندان',
    consultationLabel: 'مشاوره',
    consultationHeadingLine1: 'خدمات',
    consultationHeadingLine2: 'بازسازی',
    consultationHeadingLine3: 'دندان',
    bookOnlineButton: 'رزرو آنلاین',
    processHeadingLine1: 'روند',
    processHeadingLine2: 'کاشت',
    processHeadingLine3: 'ایمپلنت',
    careHeadingLine1: 'مراقبت',
    careHeadingLine2: 'از ایمپلنت‌های',
    careHeadingLine3: 'دندانی',

    bookingEyebrow: 'رزرو آنلاین',
    bookingHeadingLine1: 'درخواست',
    bookingHeadingLine2: 'نوبت',
    bookingSubtitle: 'روزتان را انتخاب کنید، ما بقیه‌اش را هماهنگ می‌کنیم.',
    chooseDateLabel: 'چه روزی برایتان بهتر است؟',
    chooseHourLabel: 'و چه ساعتی؟',
    loadingHours: 'در حال بررسی ساعت‌های خالی…',
    hoursNote: 'هر ساعت فقط برای یک نفر رزرو می‌شود و به‌محض ثبت، برای بقیه بسته می‌شود.',
    nameLabel: 'اسمتان چیست؟',
    namePlaceholder: 'نام و نام خانوادگی',
    phoneLabel: 'شماره تماس یا واتس‌اپ‌تان',
    phonePlaceholder: '0913 123 4567',
    problemLabel: 'کمی درباره‌ی مشکل دندانتان بنویسید',
    problemPlaceholder: 'مثلاً: چند روزیه دندون سمت راست پایینم درد می‌کنه و به سرما حساس شده',
    captchaError: 'لطفاً تأیید کنید که ربات نیستید.',
    confirmButton: 'تایید رزرو',
    submittingButton: 'در حال ثبت…',
    slotTakenError: 'این ساعت همین الان توسط شخص دیگری رزرو شد. لطفاً ساعت دیگری را انتخاب کنید.',
    genericError: 'مشکلی پیش آمد. لطفاً دوباره تلاش کنید یا از طریق واتس‌اپ با ما تماس بگیرید.',
    successHeading: 'نوبت شما رزرو شد',
    successParagraph: (name, date, time) =>
      `ممنون${name ? ` ${name} عزیز` : ''} — نوبت شما برای ${date} ساعت ${time} رزرو شد و به کس دیگری داده نمی‌شود. یک ایمیل هم برای مطب ارسال شد و یک پیام واتس‌اپ برایتان باز شده — کافیست آن را بفرستید تا مطب زودتر از آن باخبر شود.`,
    resetButton: 'رزرو یک نوبت دیگر',
    disclaimerPrefix:
      'با تایید، نوبت شما رزرو می‌شود، ایمیلی به‌صورت خودکار برای مطب ارسال می‌شود و یک پیام واتس‌اپ آماده برای ارسال باز خواهد شد. ترجیح می‌دهید مستقیم صحبت کنید؟ ایمیل بزنید:',
    disclaimerEmailCta: '',
  },
  // ------------------------------------------------------------------ en
  en: {
    navLogoLine1: 'Dr.',
    navLogoLine2: 'Naseri',
    navTagline: 'Quality dentistry in Gorgan',
    navMenuButton: 'Menu',
    navEmergency: 'Dental Emergency',
    navToggleAria: 'Toggle menu',
    navLinks: ['Home', 'Services', 'About', 'Gallery', 'Contact'],
    navBookButton: 'Book Appointment',

    featureBars: ['Advanced Dentistry', 'High-Quality Equipment', 'Warm & Friendly Staff'],
    heroParagraphLine1: 'With care and the latest facilities,',
    heroParagraphLine2: 'we look after your smile',
    heroBadge: 'With you, for a healthy smile',
    heroHeadingLine1: 'Healthy',
    heroHeadingLine2: 'Teeth',
    heroFreeConsult: 'Free Consultation',

    smileGalleryHeading: 'Smile Gallery',
    smileGallerySubtitle: 'A look at our cosmetic dental work',
    smileCard1Line1: 'Want a smile you love?',
    smileCard1Line2: 'Call us to talk about a smile makeover.',
    callUsButton: 'Call Us',
    makeoverLine1: 'Smile',
    makeoverLine2: 'Makeover',
    services: [
      { name: 'Pediatric\nDentistry' },
      { name: 'Root Canal\n& Crowns' },
      { name: 'Composite\n& Veneers' },
      { name: 'Implants' },
      { name: 'Cavity\nRestoration' },
      { name: 'Bleaching &\nWhitening' },
      { name: 'Reconstruction\n& Scaling' },
    ],

    implantHeadingLine1: 'Dental',
    implantHeadingLine2: 'Implants',
    implantSubtitle: 'Restoring missing teeth',
    img1Alt: 'Dental implant procedure',
    img2Alt: 'Dental restoration',
    img3Alt: 'Smiling patient',
    consultationLabel: 'Consultation',
    consultationHeadingLine1: 'Restorative',
    consultationHeadingLine2: 'Dental',
    consultationHeadingLine3: 'Services',
    bookOnlineButton: 'Book Online',
    processHeadingLine1: 'The',
    processHeadingLine2: 'Implant',
    processHeadingLine3: 'Process',
    careHeadingLine1: 'Caring for',
    careHeadingLine2: 'Dental',
    careHeadingLine3: 'Implants',

    bookingEyebrow: 'Book Online',
    bookingHeadingLine1: 'Request an',
    bookingHeadingLine2: 'Appointment',
    bookingSubtitle: "Pick your day — we'll take care of the rest.",
    chooseDateLabel: 'Which day works better for you?',
    chooseHourLabel: 'And what time?',
    loadingHours: 'Checking available times…',
    hoursNote: 'Each hour is booked for one patient only — the moment it\'s taken, it closes for everyone else.',
    nameLabel: "What's your name?",
    namePlaceholder: 'Full name',
    phoneLabel: 'Phone / WhatsApp number',
    phonePlaceholder: '0913 123 4567',
    problemLabel: 'Tell us a bit about your dental problem',
    problemPlaceholder: 'E.g. tooth pain on the lower right side for a few days, sensitive to cold',
    captchaError: "Please confirm you're not a robot.",
    confirmButton: 'Confirm Booking',
    submittingButton: 'Confirming…',
    slotTakenError: 'That time was just booked by someone else. Please choose another hour.',
    genericError: 'Something went wrong. Please try again, or reach us on WhatsApp.',
    successHeading: 'Your appointment is booked',
    successParagraph: (name, date, time) =>
      `Thanks${name ? `, ${name}` : ''} — your slot for ${date} at ${time} is booked and won't be given to anyone else. We've emailed the clinic, and opened a WhatsApp message for you — just hit send to notify them right away.`,
    resetButton: 'Book another appointment',
    disclaimerPrefix:
      "Confirming will lock your slot, email the clinic automatically, and open a pre-filled WhatsApp message for you to send. Prefer to talk directly? Email:",
    disclaimerEmailCta: '',
  },
  // ------------------------------------------------------------------ tk
  tk: {
    navLogoLine1: 'Doktor',
    navLogoLine2: 'Naseri',
    navTagline: 'Gürgende hilli dişçilik hyzmaty',
    navMenuButton: 'Menýu',
    navEmergency: 'Gyssagly diş kömegi',
    navToggleAria: 'Menýuny aç/ýap',
    navLinks: ['Baş sahypa', 'Hyzmatlar', 'Biz barada', 'Galereýa', 'Habarlaşmak'],
    navBookButton: 'Nobat alyň',

    featureBars: ['Ösen Dişçilik', 'Ýokary Hilli Enjamlar', 'Mähirli Işgärler'],
    heroParagraphLine1: 'Söýgi we iň täze enjamlar bilen,',
    heroParagraphLine2: 'ýylgyryşyňyza seredýäris',
    heroBadge: 'Sagdyn ýylgyryş üçin siziň bilen',
    heroHeadingLine1: 'Sagdyn',
    heroHeadingLine2: 'Dişler',
    heroFreeConsult: 'Mugt maslahat',

    smileGalleryHeading: 'Ýylgyryş Galereýasy',
    smileGallerySubtitle: 'Kosmetiki diş işlerimizden nusgalar',
    smileCard1Line1: 'Owadan ýylgyryş isleýärsiňizmi?',
    smileCard1Line2: 'Ýylgyryş üýtgetmek barada maslahat üçin jaň ediň.',
    callUsButton: 'Jaň ediň',
    makeoverLine1: 'Ýylgyryş',
    makeoverLine2: 'Täzelenişi',
    services: [
      { name: 'Çagalar\nDişçiligi' },
      { name: 'Nerw Aýyrmak\nwe Koronka' },
      { name: 'Kompozit\nwe Laminat' },
      { name: 'Implant' },
      { name: 'Çüýrügi\nBejermek' },
      { name: 'Ağardyş we\nSpitleşdiriş' },
      { name: 'Dikeltmek we\nArassalamak' },
    ],

    implantHeadingLine1: 'Diş',
    implantHeadingLine2: 'Implantlary',
    implantSubtitle: 'Ýitirilen dişleriň ornuny dikeltmek',
    img1Alt: 'Diş implant prosesi',
    img2Alt: 'Diş bejergisi',
    img3Alt: 'Ýylgyrýan näsag',
    consultationLabel: 'Maslahat',
    consultationHeadingLine1: 'Diş',
    consultationHeadingLine2: 'Bejeriş',
    consultationHeadingLine3: 'Hyzmatlary',
    bookOnlineButton: 'Onlaýn nobat',
    processHeadingLine1: 'Implant',
    processHeadingLine2: 'Ornaşdyrmak',
    processHeadingLine3: 'Prosesi',
    careHeadingLine1: 'Implant',
    careHeadingLine2: 'Idegi',
    careHeadingLine3: 'Barada',

    bookingEyebrow: 'Onlaýn nobat',
    bookingHeadingLine1: 'Nobat',
    bookingHeadingLine2: 'Alyň',
    bookingSubtitle: 'Günüňizi saýlaň, galanyny biz guraryn.',
    chooseDateLabel: 'Haýsy gün size amatly?',
    chooseHourLabel: 'Haýsy sagat?',
    loadingHours: 'Boş wagtlar barlanýar…',
    hoursNote: 'Her sagat diňe bir näsag üçin — alnan badyna beýlekiler üçin ýapylýar.',
    nameLabel: 'Adyňyz näme?',
    namePlaceholder: 'Ady we familiýasy',
    phoneLabel: 'Telefon / WhatsApp belgiňiz',
    phonePlaceholder: '0913 123 4567',
    problemLabel: 'Diş kynçylygyňyz barada gysgaça ýazyň',
    problemPlaceholder: 'Mysal: birnäçe gündür sag aşaky dişim agyrýar, sowuga duýgur',
    captchaError: 'Robot däldigiňizi tassyklaň.',
    confirmButton: 'Nobaty tassykla',
    submittingButton: 'Ýazylýar…',
    slotTakenError: 'Bu wagt ýaňy başga biri tarapyndan alyndy. Başga sagat saýlaň.',
    genericError: 'Näsazlyk ýüze çykdy. Gaýtadan synanyşyň ýa-da WhatsApp arkaly bize ýüz tutuň.',
    successHeading: 'Nobatyňyz alyndy',
    successParagraph: (name, date, time) =>
      `Sag boluň${name ? `, ${name}` : ''} — ${date}, sagat ${time} üçin nobatyňyz alyndy we başga hiç kime berilmez. Klinika e-poçta iberildi, we siz üçin WhatsApp habary açyldy — ony ibermek ýeterlik.`,
    resetButton: 'Başga nobat alyň',
    disclaimerPrefix:
      'Tassyklanyňyzda nobatyňyz alynýar, klinika awtomatiki e-poçta iberilýär we ibermek üçin taýýar WhatsApp habary açylýar. Göni gürleşmek isleýärsiňizmi? E-poçta iberiň:',
    disclaimerEmailCta: '',
  },
}

// ------------------------------------------------------------------
// Context
// ------------------------------------------------------------------

interface LanguageContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: Translation
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('fa')

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = LANG_DIR[lang]
  }, [lang])

  const value = useMemo<LanguageContextValue>(() => ({ lang, setLang, t: translations[lang] }), [lang])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside a LanguageProvider')
  return ctx
}
