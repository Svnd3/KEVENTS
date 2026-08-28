import { useCallback, useEffect, useRef, useState } from 'react'
import { formatPrice } from '../data/designs.js'
import { scrollWeddingVariants } from '../data/scrollWeddingTemplates.js'
import { getSoundtrack } from '../data/soundtracks.js'
import InvitationIntro from './InvitationIntro.jsx'
import InvitationStory from './InvitationStory.jsx'
import SandeEnvelopeIntro from './SandeEnvelopeIntro.jsx'
import SandeSignatureStory from './SandeSignatureStory.jsx'
import ScrollWeddingStory from './ScrollWeddingStory.jsx'
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

function SoundtrackButton({ soundtrack, playing, onToggle, scrollWedding = false }) {
  const action = playing ? 'Pause' : 'Play'

  return (
    <button
      className={`tp-soundtrack tp-soundtrack--${soundtrack.tone}${scrollWedding ? ' tp-soundtrack--scroll' : ''}${playing ? ' is-playing' : ''}`}
      type="button"
      onClick={onToggle}
      aria-pressed={playing}
      aria-label={`${action} “${soundtrack.title}” by ${soundtrack.artist}`}
      title={`${action} ${soundtrack.title} — ${soundtrack.artist}`}
    >
      <SoundIcon playing={playing} />
      <span>{playing ? soundtrack.playingLabel : soundtrack.idleLabel}</span>
    </button>
  )
}

export default function TemplatePreview({ design, onBack, onEnquire }) {
  const [introComplete, setIntroComplete] = useState(false)
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)
  const audioRef = useRef(null)
  const fadeFrameRef = useRef(0)
  const musicIntentRef = useRef(false)
  const isSandeSignature = design?.variant === 'sande'
  const isScrollWedding = scrollWeddingVariants.has(design?.variant)
  const soundtrack = getSoundtrack(design)

  const cancelAudioFade = useCallback(() => {
    window.cancelAnimationFrame(fadeFrameRef.current)
    fadeFrameRef.current = 0
  }, [])

  const fadeAudio = useCallback((player, targetVolume, duration, onComplete) => {
    cancelAudioFade()
    const fromVolume = player.volume
    const startedAt = performance.now()

    const step = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration)
      const eased = 1 - ((1 - progress) ** 3)
      player.volume = Math.max(0, Math.min(1, fromVolume + (targetVolume - fromVolume) * eased))

      if (progress < 1) {
        fadeFrameRef.current = window.requestAnimationFrame(step)
      } else {
        fadeFrameRef.current = 0
        onComplete?.()
      }
    }

    fadeFrameRef.current = window.requestAnimationFrame(step)
  }, [cancelAudioFade])

  const attachSoundtrack = useCallback(() => {
    const player = audioRef.current
    if (!player) return null
    if (player.dataset.soundtrackSrc === soundtrack.src) return player

    cancelAudioFade()
    player.pause()
    player.src = soundtrack.src
    player.dataset.soundtrackSrc = soundtrack.src
    player.volume = 0
    player.load()
    return player
  }, [cancelAudioFade, soundtrack.src])

  const startMusic = useCallback(() => {
    const player = attachSoundtrack()
    if (!player) return

    musicIntentRef.current = true
    player.volume = 0
    const playback = player.play()
    const fadeIn = () => fadeAudio(player, soundtrack.volume, 520)

    if (playback?.then) {
      playback.then(fadeIn).catch(() => {
        musicIntentRef.current = false
        setIsMusicPlaying(false)
      })
    } else {
      fadeIn()
    }
  }, [attachSoundtrack, fadeAudio, soundtrack.volume])

  const toggleMusic = useCallback(() => {
    const player = audioRef.current
    if (!player || player.paused || !musicIntentRef.current) {
      startMusic()
      return
    }

    musicIntentRef.current = false
    setIsMusicPlaying(false)
    fadeAudio(player, 0, 260, () => {
      if (!musicIntentRef.current) player.pause()
    })
  }, [fadeAudio, startMusic])

  useEffect(() => {
    const player = audioRef.current
    cancelAudioFade()
    musicIntentRef.current = false
    setIntroComplete(false)
    setIsMusicPlaying(false)
    window.scrollTo({ top: 0, behavior: 'auto' })

    if (player) {
      player.pause()
      player.removeAttribute('src')
      delete player.dataset.soundtrackSrc
      player.load()
    }

    return () => {
      cancelAudioFade()
      musicIntentRef.current = false
      if (!player) return
      player.pause()
      player.removeAttribute('src')
      delete player.dataset.soundtrackSrc
      player.load()
    }
  }, [cancelAudioFade, design?.slug])

  useEffect(() => {
    if (!isSandeSignature) return
    ;['/images/wedding-couple.webp', '/images/wedding-celebration.webp'].forEach((src) => {
      const image = new window.Image()
      image.src = src
    })
  }, [isSandeSignature])

  useEffect(() => {
    const handleVisibilityChange = () => {
      const player = audioRef.current
      if (!document.hidden || !player || player.paused) return
      cancelAudioFade()
      musicIntentRef.current = false
      player.volume = 0
      player.pause()
      setIsMusicPlaying(false)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [cancelAudioFade])

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

  const audioPlayer = (
    <audio
      ref={audioRef}
      preload="none"
      loop
      onPlay={() => setIsMusicPlaying(true)}
      onPause={() => setIsMusicPlaying(false)}
    />
  )

  if (isScrollWedding) {
    return (
      <>
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

          <SoundtrackButton soundtrack={soundtrack} playing={isMusicPlaying} onToggle={toggleMusic} scrollWedding />
        </div>
        {audioPlayer}
      </>
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
        {audioPlayer}
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

          <SoundtrackButton soundtrack={soundtrack} playing={isMusicPlaying} onToggle={toggleMusic} />
        </div>
      ) : (
        <InvitationIntro
          design={design}
          onComplete={() => setIntroComplete(true)}
          onUserGesture={startMusic}
        />
      )}

      {audioPlayer}
    </>
  )
}
