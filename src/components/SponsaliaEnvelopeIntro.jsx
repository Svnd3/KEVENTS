import { useCallback, useEffect, useRef, useState } from 'react'
import { formatPrice } from '../data/designs.js'
import SaveDesignButton from './SaveDesignButton.jsx'
import '../sponsalia-envelope-intro.css'

const ENVELOPE_POSTER = '/media/busta-rossa-poster.jpg'
const ENVELOPE_VIDEO = '/media/busta-rossa-envelope.mp4'
const PLAYBACK_RATE = 1.25
const CLOSE_LEAD_SECONDS = 0.62
const DISSOLVE_MS = 520
const FALLBACK_OPEN_MS = 820
const HARD_CLOSE_MS = 4400

const FALLBACK_PALETTE = ['#e6d8c8', '#302923', '#8b2735', '#b9a48d']

function parseHex(value) {
  const match = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(value || '')
  return match ? match.slice(1).map((channel) => Number.parseInt(channel, 16)) : null
}

function toHex(channels) {
  return `#${channels.map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`
}

function mixHex(source, target, sourceWeight) {
  const from = parseHex(source)
  const to = parseHex(target)
  if (!from || !to) return target
  return toHex(from.map((channel, index) => (
    channel * sourceWeight + to[index] * (1 - sourceWeight)
  )))
}

function relativeLuminance(value) {
  const channels = parseHex(value)
  if (!channels) return 0
  return channels
    .map((channel) => channel / 255)
    .map((channel) => (channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4))
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0)
}

function contrastRatio(first, second) {
  const light = Math.max(relativeLuminance(first), relativeLuminance(second))
  const dark = Math.min(relativeLuminance(first), relativeLuminance(second))
  return (light + 0.05) / (dark + 0.05)
}

function envelopeTheme(design) {
  const palette = design?.palette?.length >= 3 ? design.palette : FALLBACK_PALETTE
  const [primary, secondary, accent, detail = secondary] = palette
  const paper = mixHex(primary, '#f6eee4', design?.category === 'Minimal' ? 0.16 : 0.3)
  const backdrop = mixHex(primary, '#2f2825', 0.48)
  const ink = [secondary, detail, primary, '#241d1a', '#fffaf3']
    .find((candidate) => contrastRatio(candidate, paper) >= 4.5) || '#241d1a'
  const focus = [accent, secondary, primary, '#7d2735']
    .find((candidate) => contrastRatio(candidate, paper) >= 3) || ink

  return {
    '--spei-poster': `url("${ENVELOPE_POSTER}")`,
    '--spei-paper': paper,
    '--spei-backdrop': backdrop,
    '--spei-ink': ink,
    '--spei-accent': accent,
    '--spei-seal': focus,
    '--spei-focus': focus,
    '--spei-tone-strength': design?.category === 'Minimal' ? 0.22 : 0.46,
  }
}

export default function SponsaliaEnvelopeIntro({
  design,
  onBack,
  onComplete,
  onUserGesture,
  saved = false,
  onToggleSaved,
}) {
  const [phase, setPhase] = useState('sealed')
  const [videoPlaying, setVideoPlaying] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)
  const dialogRef = useRef(null)
  const buttonRef = useRef(null)
  const videoRef = useRef(null)
  const timersRef = useRef([])
  const startedRef = useRef(false)
  const closingRef = useRef(false)
  const finishedRef = useRef(false)
  const fallbackStartedRef = useRef(false)
  const videoFailedRef = useRef(false)

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current = []
  }, [])

  const schedule = useCallback((callback, delay) => {
    const timer = window.setTimeout(callback, delay)
    timersRef.current.push(timer)
    return timer
  }, [])

  const finish = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    setPhase('complete')
    onComplete?.(design)
  }, [design, onComplete])

  const beginClosing = useCallback((delay = DISSOLVE_MS) => {
    if (closingRef.current || finishedRef.current) return
    closingRef.current = true
    setPhase('closing')
    schedule(finish, delay)
  }, [finish, schedule])

  const runFallback = useCallback(() => {
    if (!startedRef.current || fallbackStartedRef.current) return
    fallbackStartedRef.current = true
    videoFailedRef.current = true
    setVideoFailed(true)
    setVideoPlaying(false)
    videoRef.current?.pause()
    schedule(beginClosing, FALLBACK_OPEN_MS)
  }, [beginClosing, schedule])

  useEffect(() => {
    clearTimers()
    startedRef.current = false
    closingRef.current = false
    finishedRef.current = false
    fallbackStartedRef.current = false
    videoFailedRef.current = false
    setPhase('sealed')
    setVideoPlaying(false)
    setVideoFailed(false)

    const video = videoRef.current
    if (video) {
      video.pause()
      video.playbackRate = PLAYBACK_RATE
      try {
        video.currentTime = 0
      } catch {
        // The remote clip may not have loaded its timeline yet.
      }
    }

    const focusFrame = window.requestAnimationFrame(() => {
      buttonRef.current?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(focusFrame)
  }, [clearTimers, design?.slug])

  useEffect(() => clearTimers, [clearTimers])

  useEffect(() => {
    const bodyOverflow = document.body.style.overflow
    const htmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = bodyOverflow
      document.documentElement.style.overflow = htmlOverflow
    }
  }, [])

  const openInvitation = useCallback(() => {
    if (startedRef.current) return
    startedRef.current = true
    onUserGesture?.(design)

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      setPhase('closing')
      closingRef.current = true
      schedule(finish, 140)
      return
    }

    setPhase('opening')
    schedule(beginClosing, HARD_CLOSE_MS)

    const video = videoRef.current
    if (!video || videoFailedRef.current) {
      runFallback()
      return
    }

    video.playbackRate = PLAYBACK_RATE
    try {
      video.currentTime = 0
    } catch {
      // Playback can still begin once enough metadata arrives.
    }

    const playRequest = video.play()
    playRequest?.catch(runFallback)
  }, [beginClosing, design, finish, onUserGesture, runFallback, schedule])

  const skipInvitation = useCallback(() => {
    if (finishedRef.current || closingRef.current) return
    if (!startedRef.current) {
      startedRef.current = true
      onUserGesture?.(design)
    }
    videoRef.current?.pause()
    beginClosing(180)
  }, [beginClosing, design, onUserGesture])

  const trackProgress = useCallback((event) => {
    const video = event.currentTarget
    if (!Number.isFinite(video.duration) || video.duration <= 0) return
    if (video.currentTime >= video.duration - CLOSE_LEAD_SECONDS) beginClosing()
  }, [beginClosing])

  const handleVideoError = useCallback(() => {
    videoFailedRef.current = true
    setVideoFailed(true)
    if (startedRef.current) runFallback()
  }, [runFallback])

  const names = Array.isArray(design?.couple)
    ? design.couple.filter(Boolean).join(' & ')
    : design?.name

  const className = [
    'sponsalia-envelope-intro',
    `spei-is-${phase}`,
    videoPlaying ? 'spei-video-playing' : '',
    videoFailed ? 'spei-is-fallback' : '',
  ].filter(Boolean).join(' ')

  return (
    <div
      className={className}
      role="dialog"
      aria-modal="true"
      aria-label={`${names || 'Wedding'} invitation`}
      style={envelopeTheme(design)}
      ref={dialogRef}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && onBack) {
          event.preventDefault()
          onBack()
          return
        }
        if (event.key !== 'Tab') return
        const controls = [...(dialogRef.current?.querySelectorAll('button:not(:disabled)') || [])]
        if (!controls.length) return
        const first = controls[0]
        const last = controls.at(-1)
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }}
    >
      <span className="spei__ambient" aria-hidden="true" />
      <span className="spei__veil" aria-hidden="true" />

      <div className="spei__controls">
        <button className="spei__control spei__control--back" type="button" onClick={onBack}>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m11.8 4.5-5.4 5.5 5.4 5.5M6.7 10h7" /></svg>
          <span>All designs</span>
        </button>
        <span className="spei__price"><strong>{design.name}</strong>{formatPrice(design.price)} · one-time</span>
        <div className="spei__control-group">
          <SaveDesignButton design={design} saved={saved} onToggle={onToggleSaved} className="spei__save" />
          <button
            className="spei__control spei__control--skip"
            type="button"
            onClick={skipInvitation}
            disabled={phase === 'closing' || phase === 'complete'}
          >
            Skip intro
          </button>
        </div>
      </div>

      <button
        ref={buttonRef}
        className="spei__opener"
        type="button"
        onClick={openInvitation}
        aria-label={`Open ${names || 'the wedding'} invitation`}
        disabled={phase !== 'sealed'}
      >
        <span className="spei__frame">
          <video
            ref={videoRef}
            className="spei__video"
            src={ENVELOPE_VIDEO}
            poster={ENVELOPE_POSTER}
            preload="auto"
            muted
            playsInline
            aria-hidden="true"
            onPlaying={() => setVideoPlaying(true)}
            onWaiting={() => setVideoPlaying(false)}
            onTimeUpdate={trackProgress}
            onEnded={() => beginClosing()}
            onError={handleVideoError}
          />

          <span className="spei__tone" aria-hidden="true" />

          <span className="spei__caption" aria-hidden="true">
            {names && <span className="spei__names">{names}</span>}
            <span className="spei__hint">Tap to open</span>
          </span>

          <span className="spei__loader" aria-hidden="true" />
        </span>
      </button>

      <span className="spei__status" aria-live="polite">
        {phase === 'sealed' ? 'Invitation ready. Press enter to open.' : 'Opening invitation.'}
      </span>
    </div>
  )
}
