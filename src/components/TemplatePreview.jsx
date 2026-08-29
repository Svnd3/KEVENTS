import { useCallback, useEffect, useRef, useState } from 'react'
import { formatPrice } from '../data/designs.js'
import { scrollWeddingVariants } from '../data/scrollWeddingTemplates.js'
import { cinematicWeddingVariants } from '../data/cinematicWeddingTemplates.js'
import { getSoundtrack } from '../data/soundtracks.js'
import InvitationIntro from './InvitationIntro.jsx'
import InvitationStory from './InvitationStory.jsx'
import SandeEnvelopeIntro from './SandeEnvelopeIntro.jsx'
import SandeSignatureStory from './SandeSignatureStory.jsx'
import ScrollWeddingStory from './ScrollWeddingStory.jsx'
import CinematicWeddingStory from './CinematicWeddingStory.jsx'
import '../preview.css'

function BackIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="m11.8 4.5-5.4 5.5 5.4 5.5M6.7 10h7" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="m8 4.5 5.5 5.5L8 15.5M13.2 10H5.5" />
    </svg>
  )
}

function SoundIcon({ playing }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 18V7l9-2v10" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="15.5" cy="15" r="2.5" />
      {playing && <path className="tp-soundtrack__wave" d="M21 8c1 1 1 3 0 4" />}
    </svg>
  )
}

export default function TemplatePreview({ design, onBack, onEnquire }) {
  const [introComplete, setIntroComplete] = useState(false)
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)
  const audioRef = useRef(null)
  const isSandeSignature = design?.variant === 'sande'
  const isScrollWedding = scrollWeddingVariants.has(design?.variant)
  const isCinematicWedding = cinematicWeddingVariants.has(design?.variant)
  const soundtrack = getSoundtrack(design)

  useEffect(() => {
    setIntroComplete(false)
    setIsMusicPlaying(false)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [design?.slug])

  useEffect(() => {
    if (!isSandeSignature) return
    ;['/images/wedding-couple.webp', '/images/wedding-celebration.webp'].forEach((src) => {
      const image = new window.Image()
      image.src = src
    })
  }, [isSandeSignature])

  useEffect(() => {
    const player = audioRef.current
    return () => {
      if (!player) return
      player.pause()
      player.currentTime = 0
    }
  }, [design?.slug])

  const startMusic = useCallback(() => {
    const player = audioRef.current
    if (!player) return
    player.volume = 0.28
    player.play().catch(() => setIsMusicPlaying(false))
  }, [])

  const toggleMusic = useCallback(() => {
    const player = audioRef.current
    if (!player) return
    if (player.paused) {
      player.play().catch(() => setIsMusicPlaying(false))
    } else {
      player.pause()
    }
  }, [])

  useEffect(() => {
    if (!introComplete) return undefined

    const root = document.querySelector('.template-preview')
    const targets = [...(root?.querySelectorAll('[data-invite-reveal]') || [])]
    if (!targets.length) return undefined

    root.classList.add('tp-reveal-enabled')
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion || !('IntersectionObserver' in window)) {
      targets.forEach((target) => target.classList.add('is-visible'))
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      }),
      { threshold: 0.08, rootMargin: '0px 0px -5% 0px' },
    )

    targets.forEach((target) => observer.observe(target))
    return () => observer.disconnect()
  }, [design?.slug, introComplete])

  if (!design) return null

  if (isCinematicWedding) {
    return (
      <div className={`template-preview template-preview--cinematic-new template-preview--${design.variant}`}>
        <nav className="tp-toolbar" aria-label="Invitation preview controls">
          <button className="tp-toolbar__back" type="button" onClick={onBack} aria-label="Back to all designs">
            <BackIcon />
            <span>All designs</span>
          </button>

          <div className="tp-toolbar__title">
            <strong>{design.name}</strong>
            <span>{formatPrice(design.price)}</span>
          </div>

          <button className="tp-toolbar__use" type="button" onClick={() => onEnquire?.(design)} aria-label={`Use ${design.name} design`}>
            <span>Use this design</span>
            <ArrowIcon />
          </button>
        </nav>

        <main id="main-content" tabIndex={-1}>
          <CinematicWeddingStory design={design} />
        </main>
      </div>
    )
  }

  if (isScrollWedding) {
    return (
      <div className="template-preview template-preview--scroll">
        <nav className="tp-toolbar" aria-label="Invitation preview controls">
          <button className="tp-toolbar__back" type="button" onClick={onBack} aria-label="Back to all designs">
            <BackIcon />
            <span>All designs</span>
          </button>

          <div className="tp-toolbar__title">
            <strong>{design.name}</strong>
            <span>{formatPrice(design.price)}</span>
          </div>

          <button className="tp-toolbar__use" type="button" onClick={() => onEnquire?.(design)} aria-label={`Use ${design.name} design`}>
            <span>Use this design</span>
            <ArrowIcon />
          </button>
        </nav>

        <main id="main-content" tabIndex={-1}>
          <ScrollWeddingStory design={design} />
        </main>
      </div>
    )
  }

  if (isSandeSignature) {
    return (
      <>
        {introComplete ? (
          <SandeSignatureStory
            design={design}
            onBack={onBack}
            onUseDesign={(selectedDesign) => onEnquire?.(selectedDesign)}
            isMusicPlaying={isMusicPlaying}
            onToggleMusic={toggleMusic}
          />
        ) : (
          <SandeEnvelopeIntro
            design={design}
            onComplete={() => setIntroComplete(true)}
            onUserGesture={startMusic}
          />
        )}
        <audio
          ref={audioRef}
          src={soundtrack.src}
          preload="none"
          loop
          onPlay={() => setIsMusicPlaying(true)}
          onPause={() => setIsMusicPlaying(false)}
        />
      </>
    )
  }

  return (
    <>
      {introComplete ? (
        <div className="template-preview">
          <nav className="tp-toolbar" aria-label="Invitation preview controls">
            <button className="tp-toolbar__back" type="button" onClick={onBack} aria-label="Back to all designs">
              <BackIcon />
              <span>All designs</span>
            </button>

            <div className="tp-toolbar__title">
              <strong>{design.name}</strong>
              <span>{formatPrice(design.price)}</span>
            </div>

            <button className="tp-toolbar__use" type="button" onClick={() => onEnquire?.(design)} aria-label={`Use ${design.name} design`}>
              <span>Use this design</span>
              <ArrowIcon />
            </button>
          </nav>

          <main id="main-content" tabIndex={-1}>
            <InvitationStory design={design} onEnquire={onEnquire} />
          </main>

          <button
            className={`tp-soundtrack${isMusicPlaying ? ' is-playing' : ''}`}
            type="button"
            onClick={toggleMusic}
            aria-pressed={isMusicPlaying}
            aria-label={`${isMusicPlaying ? 'Pause' : 'Play'} ${soundtrack.title}`}
            title={soundtrack.title}
          >
            <SoundIcon playing={isMusicPlaying} />
            <span>{isMusicPlaying ? 'Sound on' : 'Play song'}</span>
          </button>
        </div>
      ) : (
        <InvitationIntro
          design={design}
          onComplete={() => setIntroComplete(true)}
          onUserGesture={startMusic}
        />
      )}

      <audio
        ref={audioRef}
        src={soundtrack.src}
        preload="none"
        loop
        onPlay={() => setIsMusicPlaying(true)}
        onPause={() => setIsMusicPlaying(false)}
      />
    </>
  )
}
