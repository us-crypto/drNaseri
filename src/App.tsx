import React, { useEffect, useRef, useState } from 'react'
import BookingSection from './components/BookingSection'
import { LANG_ENDONYM, Lang, LanguageProvider, useLanguage } from './i18n'

import heroIllustration from './assets/images/hero-illustration.jpg'
import galleryIllustration from './assets/images/gallery-illustration.jpg'
import implantProcedure from './assets/images/implant-procedure.jpg'
import dentalRestoration from './assets/images/dental-restoration.jpg'
import implantBg from './assets/images/implant-bg.jpg'

import servicePediatric from './assets/images/service-pediatric.svg'
import serviceRootcanal from './assets/images/service-rootcanal.svg'
import serviceComposite from './assets/images/service-composite.svg'
import serviceImplant from './assets/images/service-implant.svg'
import serviceCavity from './assets/images/service-cavity.svg'
import serviceWhitening from './assets/images/service-whitening.svg'
import serviceReconstruction from './assets/images/service-reconstruction.svg'

// ============================================================
//  IMAGES — all hand-drawn and bundled inside the project itself
//  (src/assets/images), so nothing depends on any outside server that
//  could go down, expire, or block hotlinking again.
// ============================================================

const HERO_IMAGE = heroIllustration

const SECTION2_IMAGE = galleryIllustration

const SECTION3_IMG1 = implantProcedure

const SECTION3_IMG2 = dentalRestoration

const SECTION3_BG = implantBg

// Same order as the `services` array in src/i18n.tsx for every language:
// pediatric, root canal & crowns, composite & veneers, implants, cavity
// restoration, whitening, reconstruction & scaling.
const SERVICE_ICONS = [
  servicePediatric,
  serviceRootcanal,
  serviceComposite,
  serviceImplant,
  serviceCavity,
  serviceWhitening,
  serviceReconstruction,
]

function scrollToBooking() {
  document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })
}

// ============================================================
//  HOOKS
// ============================================================

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false,
  )

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return isMobile
}

interface MaskPosition {
  x: number
  y: number
  sw: number
  sh: number
}

const EMPTY_POSITION: MaskPosition = { x: 0, y: 0, sw: 0, sh: 0 }

function useMaskPositions<T extends HTMLElement>(
  sectionRef: React.RefObject<HTMLElement | null>,
  cardRefs: React.MutableRefObject<(T | null)[]>,
  count: number,
): MaskPosition[] {
  const [positions, setPositions] = useState<MaskPosition[]>(() =>
    Array.from({ length: count }, () => EMPTY_POSITION),
  )

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const recalc = () => {
      const sectionRect = section.getBoundingClientRect()
      const sw = sectionRect.width
      const sh = sectionRect.height
      const next: MaskPosition[] = cardRefs.current.map((card) => {
        if (!card) return { x: 0, y: 0, sw, sh }
        const cardRect = card.getBoundingClientRect()
        return {
          x: cardRect.left - sectionRect.left,
          y: cardRect.top - sectionRect.top,
          sw,
          sh,
        }
      })
      setPositions(next)
    }

    recalc()
    const ro = new ResizeObserver(recalc)
    ro.observe(section)
    cardRefs.current.forEach((c) => c && ro.observe(c))

    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionRef, count])

  return positions
}

function useImageWidth(src: string, sectionHeight: number): number {
  const [renderWidth, setRenderWidth] = useState(0)

  useEffect(() => {
    if (!src || !sectionHeight) return
    const img = new Image()
    img.onload = () => {
      if (img.naturalHeight > 0) {
        setRenderWidth(img.naturalWidth * (sectionHeight / img.naturalHeight))
      }
    }
    img.src = src
  }, [src, sectionHeight])

  return renderWidth
}

function useStaggeredReveal(count: number, threshold = 0.15) {
  const containerRef = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = containerRef.current
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threshold])

  const getAnimStyle = (index: number): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(24px)',
    transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${index * 120}ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${index * 120}ms`,
  })

  return { containerRef, getAnimStyle, count }
}

// ============================================================
//  MASKED CARD
// ============================================================

interface MaskedCardProps {
  bgImage: string
  position: MaskPosition
  imageWidth: number
  focalX: number
  className?: string
  children?: React.ReactNode
  cardRef?: React.Ref<HTMLDivElement>
  style?: React.CSSProperties
}

function MaskedCard({ bgImage, position, imageWidth, focalX, className, children, cardRef, style }: MaskedCardProps) {
  const overflow = imageWidth > position.sw ? imageWidth - position.sw : 0
  const focalOffset = overflow * focalX

  const bgStyle: React.CSSProperties = {
    backgroundImage: `url(${bgImage})`,
    backgroundSize: `auto ${position.sh}px`,
    backgroundPosition: `-${position.x + focalOffset}px -${position.y}px`,
    backgroundRepeat: 'no-repeat',
    ...style,
  }

  return (
    <div ref={cardRef} className={className} style={bgStyle}>
      {children}
    </div>
  )
}

// ============================================================
//  SPLASH SCREEN
// ============================================================

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

function toPersianDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)])
}

function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const { lang } = useLanguage()
  const [count, setCount] = useState(0)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    let step = 0
    const interval = setInterval(() => {
      step += 1
      setCount(step)
      if (step >= 100) {
        clearInterval(interval)
        setTimeout(() => setExiting(true), 200)
      }
    }, 20)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!exiting) return
    const t = setTimeout(onComplete, 700)
    return () => clearTimeout(t)
  }, [exiting, onComplete])

  return (
    <div
      className={`fixed inset-0 z-[100] bg-white flex items-end justify-start transition-opacity duration-700 ${
        exiting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="text-7xl md:text-9xl font-bold tabular-nums p-6 md:p-10 leading-none text-black" dir="ltr">
        {lang === 'fa' ? toPersianDigits(count) : count}
      </div>
    </div>
  )
}

// ============================================================
//  LANGUAGE SWITCHER
// ============================================================

function LanguageSwitcher() {
  const { lang, setLang } = useLanguage()
  const langs: Lang[] = ['fa', 'en', 'tk']

  return (
    <div className="flex items-center gap-1">
      {langs.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={`px-2.5 py-1.5 rounded-full text-[11px] font-semibold border transition-colors duration-150 ${
            lang === l ? 'bg-black text-white border-black' : 'bg-white text-black border-black/20 hover:border-black'
          }`}
        >
          {LANG_ENDONYM[l]}
        </button>
      ))}
    </div>
  )
}

// ============================================================
//  NAVBAR
// ============================================================

function Navbar() {
  const { t } = useLanguage()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-6 py-2 md:py-3 bg-white/80 backdrop-blur-md">
        <div className="flex flex-col">
          <span className="text-xl md:text-2xl font-extrabold tracking-tight leading-none">{t.navLogoLine1}</span>
          <span className="text-xl md:text-2xl font-extrabold tracking-tight leading-none -mt-1.5 md:-mt-2">
            {t.navLogoLine2}
          </span>
          <span className="text-[8px] md:text-[9px] font-medium leading-none mt-1.5 md:mt-2">{t.navTagline}</span>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <LanguageSwitcher />
          <button
            onClick={scrollToBooking}
            className="px-6 py-3 bg-white rounded-full border border-black text-sm font-semibold hover:bg-black hover:text-white transition-colors duration-200"
          >
            {t.navMenuButton}
          </button>
          <span className="text-sm font-semibold text-black">{t.navEmergency}</span>
        </div>

        <button
          className="md:hidden w-10 h-10 flex items-center justify-center relative"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={t.navToggleAria}
        >
          <span
            className={`absolute h-0.5 w-6 bg-black rounded-full transition-all duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] ${
              menuOpen ? 'rotate-45 translate-y-0' : '-translate-y-2'
            }`}
          />
          <span
            className={`absolute h-0.5 w-6 bg-black rounded-full transition-all duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] ${
              menuOpen ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'
            }`}
          />
          <span
            className={`absolute h-0.5 w-6 bg-black rounded-full transition-all duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] ${
              menuOpen ? '-rotate-45 translate-y-0' : 'translate-y-2'
            }`}
          />
        </button>
      </nav>

      <div className={`md:hidden fixed inset-0 z-40 ${menuOpen ? '' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-500 ${
            menuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setMenuOpen(false)}
        />
        <div
          className={`absolute top-0 right-0 h-full w-[85%] max-w-sm bg-white shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] overflow-y-auto ${
            menuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col justify-center min-h-full px-8 py-24 gap-1">
            {t.navLinks.map((link, i) => (
              <a
                key={link}
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setMenuOpen(false)
                }}
                className={`text-3xl sm:text-4xl font-bold text-black hover:text-neutral-500 transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${
                  menuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
                }`}
                style={{ transitionDelay: menuOpen ? `${100 + i * 60}ms` : '0ms' }}
              >
                {link}
              </a>
            ))}

            <div
              className={`mt-8 pt-8 border-t border-neutral-200 transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${
                menuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
              }`}
              style={{ transitionDelay: menuOpen ? '400ms' : '0ms' }}
            >
              <LanguageSwitcher />
            </div>

            <div
              className={`mt-6 pt-6 border-t border-neutral-200 transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${
                menuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
              }`}
              style={{ transitionDelay: menuOpen ? '450ms' : '0ms' }}
            >
              <p className="text-sm font-semibold text-black mb-4">{t.navEmergency}</p>
              <button
                onClick={() => {
                  setMenuOpen(false)
                  scrollToBooking()
                }}
                className="w-full px-6 py-4 bg-black rounded-full text-white text-sm font-semibold hover:bg-neutral-800 transition-colors duration-200"
              >
                {t.navBookButton}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ============================================================
//  SECTION 1 — HERO
// ============================================================

function Section1() {
  const { t } = useLanguage()
  const sectionRef = useRef<HTMLElement | null>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const isMobile = useIsMobile()
  const s1Reveal = useStaggeredReveal(4)

  const positions = useMaskPositions(sectionRef, cardRefs, 4)
  const sectionHeight = positions[0]?.sh || 0
  const imageWidth = useImageWidth(HERO_IMAGE, sectionHeight)
  const focalX = isMobile ? 0.7 : 0.8

  const setRefs = (el: HTMLElement | null) => {
    sectionRef.current = el
    s1Reveal.containerRef.current = el
  }

  return (
    <section
      ref={setRefs}
      className="h-dvh w-full overflow-hidden flex flex-col pt-24 md:pt-24 px-3 md:px-5 pb-1.5 md:pb-2 gap-1.5 md:gap-2"
    >
      {t.featureBars.map((label, i) => (
        <MaskedCard
          key={label}
          bgImage={HERO_IMAGE}
          position={positions[i] || EMPTY_POSITION}
          imageWidth={imageWidth}
          focalX={focalX}
          cardRef={(el) => {
            cardRefs.current[i] = el
          }}
          className="w-full h-14 md:h-20 shrink-0 rounded-xl md:rounded-2xl overflow-hidden relative"
          style={s1Reveal.getAnimStyle(i)}
        >
          <span className="flex items-center justify-center h-full text-black text-base sm:text-lg md:text-3xl font-bold text-center relative z-10 px-2">
            {label}
          </span>
        </MaskedCard>
      ))}

      <MaskedCard
        bgImage={HERO_IMAGE}
        position={positions[3] || EMPTY_POSITION}
        imageWidth={imageWidth}
        focalX={focalX}
        cardRef={(el) => {
          cardRefs.current[3] = el
        }}
        className="w-full flex-1 min-h-0 rounded-xl md:rounded-2xl overflow-hidden relative"
        style={s1Reveal.getAnimStyle(3)}
      >
        <p className="absolute top-4 start-4 md:top-7 md:start-7 text-black text-xs md:text-sm font-semibold leading-4 md:leading-5 max-w-[200px] md:max-w-[300px] z-10">
          {t.heroParagraphLine1}
          <br />
          {t.heroParagraphLine2}
        </p>

        <div className="absolute bottom-5 start-3 md:bottom-8 md:start-4 z-10">
          <span className="block text-black text-xs md:text-sm font-semibold mb-1 md:mb-2">{t.heroBadge}</span>
          <h1 className="text-black text-[clamp(2.75rem,11vw,11rem)] font-bold leading-[0.85] tracking-tight">
            {t.heroHeadingLine1}
            <br />
            {t.heroHeadingLine2}
          </h1>
        </div>

        <span className="absolute bottom-6 end-4 md:bottom-10 md:end-8 text-white text-xs md:text-sm font-semibold z-10 [text-shadow:0_1px_6px_rgba(0,0,0,0.55)]">
          {t.heroFreeConsult}
        </span>
      </MaskedCard>
    </section>
  )
}

// ============================================================
//  SECTION 2 — SMILE GALLERY
// ============================================================

function Section2() {
  const { t } = useLanguage()
  const sectionRef = useRef<HTMLElement | null>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const isMobile = useIsMobile()
  const s2Reveal = useStaggeredReveal(4)

  const positions = useMaskPositions(sectionRef, cardRefs, 4)
  const sectionHeight = positions[0]?.sh || 0
  const imageWidth = useImageWidth(SECTION2_IMAGE, sectionHeight)
  const focalX = isMobile ? 0.65 : 0.8

  const setRefs = (el: HTMLElement | null) => {
    sectionRef.current = el
    s2Reveal.containerRef.current = el
  }

  return (
    <section
      ref={setRefs}
      className="min-h-dvh md:h-dvh w-full overflow-hidden flex flex-col pt-1.5 md:pt-2 px-3 md:px-5 pb-1.5 md:pb-2 gap-1.5 md:gap-2"
    >
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 grid-rows-[auto_auto_auto_auto] md:grid-rows-[0.9fr_0.9fr_1.3fr] gap-1.5 md:gap-2">
        <MaskedCard
          bgImage={SECTION2_IMAGE}
          position={positions[0] || EMPTY_POSITION}
          imageWidth={imageWidth}
          focalX={focalX}
          cardRef={(el) => {
            cardRefs.current[0] = el
          }}
          className="rounded-xl md:rounded-2xl overflow-hidden relative min-h-[160px] md:min-h-0"
          style={s2Reveal.getAnimStyle(0)}
        >
          <h3 className="absolute top-4 start-5 md:top-6 md:start-7 text-white md:text-black text-2xl md:text-3xl font-bold z-10 [text-shadow:0_1px_6px_rgba(0,0,0,0.55)]">
            {t.smileGalleryHeading}
          </h3>
          <p className="absolute bottom-4 start-5 md:bottom-6 md:start-7 text-white md:text-black text-xs md:text-sm font-semibold z-10 [text-shadow:0_1px_6px_rgba(0,0,0,0.55)]">
            {t.smileGallerySubtitle}
          </p>
        </MaskedCard>

        <MaskedCard
          bgImage={SECTION2_IMAGE}
          position={positions[1] || EMPTY_POSITION}
          imageWidth={imageWidth}
          focalX={focalX}
          cardRef={(el) => {
            cardRefs.current[1] = el
          }}
          className="md:row-span-2 rounded-xl md:rounded-2xl overflow-hidden relative min-h-[200px] md:min-h-0"
          style={s2Reveal.getAnimStyle(1)}
        >
          <p className="absolute bottom-16 start-5 md:bottom-20 md:start-7 text-white text-xs md:text-sm font-semibold leading-4 md:leading-5 z-10 [text-shadow:0_1px_6px_rgba(0,0,0,0.55)]">
            {t.smileCard1Line1}
            <br />
            {t.smileCard1Line2}
          </p>
          <button
            onClick={scrollToBooking}
            className="absolute bottom-4 end-4 md:bottom-6 md:end-6 px-5 py-3 md:px-8 md:py-5 bg-white rounded-full text-black text-base md:text-xl font-bold z-10 hover:scale-105 transition-transform"
          >
            {t.callUsButton}
          </button>
        </MaskedCard>

        <MaskedCard
          bgImage={SECTION2_IMAGE}
          position={positions[2] || EMPTY_POSITION}
          imageWidth={imageWidth}
          focalX={focalX}
          cardRef={(el) => {
            cardRefs.current[2] = el
          }}
          className="rounded-xl md:rounded-2xl overflow-hidden relative min-h-[160px] md:min-h-0"
          style={s2Reveal.getAnimStyle(2)}
        >
          <h3 className="absolute top-4 start-5 md:top-6 md:start-7 text-white md:text-black text-[clamp(2.5rem,7vw,6rem)] font-bold leading-[0.9] z-10 [text-shadow:0_1px_6px_rgba(0,0,0,0.55)]">
            {t.makeoverLine1}
            <br />
            {t.makeoverLine2}
          </h3>
        </MaskedCard>

        <MaskedCard
          bgImage={SECTION2_IMAGE}
          position={positions[3] || EMPTY_POSITION}
          imageWidth={imageWidth}
          focalX={focalX}
          cardRef={(el) => {
            cardRefs.current[3] = el
          }}
          className="col-span-1 md:col-span-2 rounded-xl md:rounded-2xl overflow-hidden relative min-h-[260px] md:min-h-0"
          style={s2Reveal.getAnimStyle(3)}
        >
          <div className="absolute inset-0 z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3 p-3 md:p-4 overflow-y-auto">
            {t.services.map((svc, i) => (
              <div
                key={svc.name}
                className="rounded-lg md:rounded-xl bg-white/75 backdrop-blur-md p-2.5 md:p-4 flex flex-col justify-between"
              >
                <img src={SERVICE_ICONS[i]} alt="" className="w-8 h-8 md:w-10 md:h-10 mb-1.5 md:mb-2" />
                <h3 className="text-sm sm:text-base md:text-xl font-bold leading-tight whitespace-pre-line text-black">
                  {svc.name}
                </h3>
                <span
                  dir="ltr"
                  className="self-end w-6 h-6 md:w-9 md:h-9 rounded-full border border-black flex items-center justify-center text-[10px] md:text-xs font-semibold text-black"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
            ))}
          </div>
        </MaskedCard>
      </div>
    </section>
  )
}

// ============================================================
//  SECTION 3 — IMPLANT DENTISTRY
// ============================================================

function Section3() {
  const { t } = useLanguage()
  const s3Reveal = useStaggeredReveal(4)

  return (
    <section
      ref={s3Reveal.containerRef}
      className="min-h-dvh md:h-dvh w-full overflow-hidden flex flex-col pt-1.5 md:pt-2 px-3 md:px-5 pb-1.5 md:pb-2 gap-1.5 md:gap-2"
    >
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-1.5 md:gap-2">
        <div className="flex flex-col gap-1.5 md:gap-2">
          <div
            className="rounded-xl md:rounded-2xl bg-stone-50 p-5 md:p-7 flex flex-col justify-between flex-[1.2] min-h-[180px] md:min-h-0"
            style={s3Reveal.getAnimStyle(0)}
          >
            <h2 className="text-[clamp(2.75rem,7vw,6.5rem)] font-bold leading-[0.95] text-black">
              {t.implantHeadingLine1}
              <br />
              {t.implantHeadingLine2}
            </h2>
            <p className="text-xs md:text-sm font-semibold text-black">{t.implantSubtitle}</p>
          </div>

          <div className="flex gap-1.5 md:gap-2 flex-1 min-h-[140px] md:min-h-0" style={s3Reveal.getAnimStyle(1)}>
            <div className="flex-1 rounded-xl md:rounded-2xl overflow-hidden">
              <img src={SECTION3_IMG1} alt={t.img1Alt} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 rounded-xl md:rounded-2xl overflow-hidden">
              <img src={SECTION3_IMG2} alt={t.img2Alt} className="w-full h-full object-cover" />
            </div>
          </div>

          <div
            className="rounded-xl md:rounded-2xl bg-zinc-200 p-5 md:p-7 flex items-end justify-between flex-[0.8] min-h-[160px] md:min-h-0"
            style={s3Reveal.getAnimStyle(2)}
          >
            <div>
              <p className="text-xs md:text-sm font-semibold text-black mb-2 md:mb-3">{t.consultationLabel}</p>
              <h3 className="text-lg sm:text-xl md:text-3xl font-bold text-black leading-6 md:leading-8">
                {t.consultationHeadingLine1}
                <br />
                {t.consultationHeadingLine2}
                <br />
                {t.consultationHeadingLine3}
              </h3>
            </div>
            <button
              onClick={scrollToBooking}
              className="px-5 py-3 md:px-8 md:py-5 bg-white rounded-full text-black text-sm sm:text-base md:text-xl font-bold hover:scale-105 transition-transform"
            >
              {t.bookOnlineButton}
            </button>
          </div>
        </div>

        <div
          className="rounded-xl md:rounded-2xl overflow-hidden relative min-h-[350px] md:min-h-0"
          style={s3Reveal.getAnimStyle(3)}
        >
          <img src={SECTION3_BG} alt={t.img3Alt} className="w-full h-full object-cover" />
          <div className="absolute bottom-3 left-3 right-3 md:bottom-5 md:left-5 md:right-5 flex gap-1.5 md:gap-2">
            <div className="flex-1 bg-white rounded-xl md:rounded-2xl p-3 md:p-5 flex flex-col justify-between h-36 md:h-52">
              <h4 className="text-base sm:text-lg md:text-2xl font-bold text-black leading-5 md:leading-7">
                {t.processHeadingLine1}
                <br />
                {t.processHeadingLine2}
                <br />
                {t.processHeadingLine3}
              </h4>
              <span className="self-end w-9 h-9 md:w-12 md:h-12 rounded-full border border-black flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="rotate-[-45deg]">
                  <path
                    d="M1 7h12m0 0L8 2m5 5L8 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>

            <div className="flex-1 bg-white/20 backdrop-blur-xl rounded-xl md:rounded-2xl p-3 md:p-5 flex flex-col justify-between h-36 md:h-52">
              <h4 className="text-base sm:text-lg md:text-2xl font-bold text-white leading-5 md:leading-7">
                {t.careHeadingLine1}
                <br />
                {t.careHeadingLine2}
                <br />
                {t.careHeadingLine3}
              </h4>
              <span className="self-end w-9 h-9 md:w-12 md:h-12 rounded-full border border-white flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="rotate-[-45deg] text-white">
                  <path
                    d="M1 7h12m0 0L8 2m5 5L8 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================
//  APP
// ============================================================

function AppContent() {
  const [showSplash, setShowSplash] = useState(true)

  return (
    <div className="bg-white">
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <Navbar />
      <Section1 />
      <Section2 />
      <Section3 />
      <BookingSection />
    </div>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  )
}
