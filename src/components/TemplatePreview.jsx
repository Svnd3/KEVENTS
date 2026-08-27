import { useCallback, useEffect, useRef, useState } from 'react'
import { formatPrice } from '../data/designs.js'
import chaiYaSaaKumiUrl from '../../songs/CHAI YA SAA KUMI (LYRIC VIDEO) - YWAYA TAJIRI [7b5aUIQ-sUc].mp3?url'
import InvitationIntro from './InvitationIntro.jsx'
import InvitationStory from './InvitationStory.jsx'
import SandeEnvelopeIntro from './SandeEnvelopeIntro.jsx'
import SandeSignatureStory from './SandeSignatureStory.jsx'
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

export default function TemplatePreview({ design, onBack, onEnquire }) {
  const [introComplete, setIntroComplete] = useState(false)
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)
  const audioRef = useRef(null)
  const isSandeSignature = design?.variant === 'sande'

  useEffect(() => {
    setIntroComplete(false)
    setIsMusicPlaying(false)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [design?.slug])

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
          src={chaiYaSaaKumiUrl}
          preload="none"
          loop
          onPlay={() => setIsMusicPlaying(true)}
          onPause={() => setIsMusicPlaying(false)}
        />
      </>
    )
  }

  if (!introComplete) {
    return <InvitationIntro design={design} onComplete={() => setIntroComplete(true)} />
  }

  return (
    <div className="template-preview">
      <nav className="tp-toolbar" aria-label="Invitation preview controls">
        <button className="tp-toolbar__back" type="button" onClick={onBack}>
          <BackIcon />
          <span>All designs</span>
        </button>

        <div className="tp-toolbar__title">
          <strong>{design.name}</strong>
          <span>{formatPrice(design.price)}</span>
        </div>

        <button className="tp-toolbar__use" type="button" onClick={() => onEnquire?.(design)}>
          <span>Use this design</span>
          <ArrowIcon />
        </button>
      </nav>

      <main id="main-content" tabIndex={-1}>
        <InvitationStory design={design} onEnquire={onEnquire} />
      </main>
    </div>
  )
}
