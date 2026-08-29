import { useCallback, useEffect, useRef, useState } from 'react'
import '../autoplay-music-control.css'

const clampVolume = (value) => {
  const volume = Number(value)
  return Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : 0.24
}

function MusicIcon({ className, playing }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 18V6l9-2v11" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="15.5" cy="15" r="2.5" />
      {playing && <path className={`${className}__wave`} d="M21 7c1.4 1.4 1.4 4.6 0 6" />}
    </svg>
  )
}

export default function AutoplayMusicControl({ music, className = 'cw-music' }) {
  const audioRef = useRef(null)
  const mountedRef = useRef(false)
  const desiredPlayingRef = useRef(true)
  const manualPausedRef = useRef(false)
  const hiddenResumeRef = useRef(false)
  const interactionAttemptedRef = useRef(false)
  const lastScrollAttemptRef = useRef(Number.NEGATIVE_INFINITY)
  const playAttemptRef = useRef(0)
  const [playing, setPlaying] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [unavailable, setUnavailable] = useState(false)

  const requestPlayback = useCallback(() => {
    const player = audioRef.current
    if (
      !player
      || !music?.src
      || document.hidden
      || manualPausedRef.current
      || !desiredPlayingRef.current
      || !player.paused
    ) return

    const attempt = ++playAttemptRef.current
    setUnavailable(false)

    try {
      const playRequest = player.play()
      if (!playRequest?.then) {
        setBlocked(false)
        return
      }

      playRequest.then(() => {
        if (!mountedRef.current || attempt !== playAttemptRef.current) return
        setBlocked(false)
      }).catch((error) => {
        if (
          !mountedRef.current
          || attempt !== playAttemptRef.current
          || manualPausedRef.current
          || !desiredPlayingRef.current
        ) return

        interactionAttemptedRef.current = false
        setPlaying(false)
        setBlocked(error?.name === 'NotAllowedError' || error?.name === 'AbortError')
        setUnavailable(error?.name !== 'NotAllowedError' && error?.name !== 'AbortError')
      })
    } catch {
      if (!mountedRef.current) return
      interactionAttemptedRef.current = false
      setPlaying(false)
      setBlocked(true)
    }
  }, [music?.src])

  useEffect(() => {
    const player = audioRef.current
    mountedRef.current = true
    desiredPlayingRef.current = true
    manualPausedRef.current = false
    hiddenResumeRef.current = false
    interactionAttemptedRef.current = false
    lastScrollAttemptRef.current = Number.NEGATIVE_INFINITY
    playAttemptRef.current += 1
    setPlaying(false)
    setBlocked(false)
    setUnavailable(false)

    if (!player || !music?.src) {
      return () => {
        mountedRef.current = false
      }
    }

    player.volume = clampVolume(music.volume)

    const isMusicControl = (event) => (
      event.target instanceof Element
      && Boolean(event.target.closest('[data-autoplay-music-control]'))
    )

    const retryFromInteraction = (event) => {
      if (interactionAttemptedRef.current || isMusicControl(event)) return
      interactionAttemptedRef.current = true
      requestPlayback()
    }

    const retryFromScroll = () => {
      if (
        !player.paused
        || manualPausedRef.current
        || !desiredPlayingRef.current
        || document.hidden
      ) return

      const now = performance.now()
      if (now - lastScrollAttemptRef.current < 1400) return
      lastScrollAttemptRef.current = now
      requestPlayback()
    }

    const syncVisibility = () => {
      if (document.hidden) {
        hiddenResumeRef.current = !player.paused && desiredPlayingRef.current
        if (hiddenResumeRef.current) player.pause()
        return
      }

      if (
        hiddenResumeRef.current
        && desiredPlayingRef.current
        && !manualPausedRef.current
      ) {
        hiddenResumeRef.current = false
        requestPlayback()
      }
    }

    document.addEventListener('pointerdown', retryFromInteraction, { capture: true, passive: true })
    document.addEventListener('touchstart', retryFromInteraction, { capture: true, passive: true })
    document.addEventListener('keydown', retryFromInteraction, true)
    document.addEventListener('visibilitychange', syncVisibility)
    window.addEventListener('scroll', retryFromScroll, { passive: true })

    requestPlayback()

    return () => {
      mountedRef.current = false
      playAttemptRef.current += 1
      document.removeEventListener('pointerdown', retryFromInteraction, true)
      document.removeEventListener('touchstart', retryFromInteraction, true)
      document.removeEventListener('keydown', retryFromInteraction, true)
      document.removeEventListener('visibilitychange', syncVisibility)
      window.removeEventListener('scroll', retryFromScroll)
      player.pause()
      player.currentTime = 0
    }
  }, [music?.src, music?.volume, requestPlayback])

  const togglePlayback = () => {
    const player = audioRef.current
    if (!player || !music?.src) return

    if (player.paused) {
      manualPausedRef.current = false
      desiredPlayingRef.current = true
      hiddenResumeRef.current = false
      interactionAttemptedRef.current = true
      requestPlayback()
      return
    }

    manualPausedRef.current = true
    desiredPlayingRef.current = false
    hiddenResumeRef.current = false
    playAttemptRef.current += 1
    player.pause()
  }

  if (!music?.src) return null

  const title = music.title || 'Wedding soundtrack'
  const artist = music.artist ? ` by ${music.artist}` : ''
  const buttonState = playing ? 'Pause' : 'Play'
  const statusLabel = playing
    ? 'Playing'
    : unavailable
      ? 'Sound unavailable'
      : blocked
        ? 'Tap for sound'
        : (music.buttonLabel || 'Play soundtrack')

  return (
    <>
      <button
        className={`${className}${playing ? ' is-playing' : ''}${blocked ? ' is-blocked' : ''}${unavailable ? ' is-unavailable' : ''}`}
        type="button"
        onClick={togglePlayback}
        aria-pressed={playing}
        aria-label={`${buttonState} ${title}${artist}`}
        data-autoplay-music-control
        data-playback-state={playing ? 'playing' : blocked ? 'blocked' : unavailable ? 'unavailable' : 'paused'}
      >
        <MusicIcon className={className} playing={playing} />
        <span><b>{statusLabel}</b><small>{title}</small></span>
      </button>
      <audio
        ref={audioRef}
        src={music.src}
        loop
        preload="auto"
        onPlay={() => {
          if (!mountedRef.current) return
          setPlaying(true)
          setBlocked(false)
          setUnavailable(false)
        }}
        onPause={() => {
          if (mountedRef.current) setPlaying(false)
        }}
        onError={() => {
          if (!mountedRef.current) return
          setPlaying(false)
          setBlocked(false)
          setUnavailable(true)
        }}
      />
    </>
  )
}
