import { useCallback, useEffect, useRef, useState } from 'react'
import '../sponsalia-envelope-intro.css'

const ENVELOPE_POSTER = '/media/busta-rossa-poster.jpg'
const ENVELOPE_VIDEO = '/media/busta-rossa-envelope.mp4'
const PLAYBACK_RATE = 1.25
const CLOSE_LEAD_SECONDS = 0.62
const DISSOLVE_MS = 520
const FALLBACK_OPEN_MS = 820
const HARD_CLOSE_MS = 4400

export default function SponsaliaEnvelopeIntro({ design, onComplete, onUserGesture }) {
  const [phase, setPhase] = useState('sealed')
  const [videoPlaying, setVideoPlaying] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)
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
      style={{ '--spei-poster': `url("${ENVELOPE_POSTER}")` }}
    >
      <span className="spei__ambient" aria-hidden="true" />
      <span className="spei__veil" aria-hidden="true" />

      <button
        ref={buttonRef}
        className="spei__opener"
        type="button"
        onClick={openInvitation}
        onKeyDown={(event) => {
          if (event.key === 'Tab') {
            event.preventDefault()
            buttonRef.current?.focus({ preventScroll: true })
          }
        }}
        aria-label={`Open ${names || 'the wedding'} invitation`}
        aria-disabled={phase !== 'sealed'}
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
