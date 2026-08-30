import { useCallback, useEffect, useRef, useState } from 'react'
import BrandLogo from './BrandLogo.jsx'
import '../site-loader.css'

const SITE_LOADER_SESSION_KEY = 'tell-and-wed:site-loader-seen:v1'

function clampDuration(value, fallback, minimum, maximum) {
  const duration = Number.isFinite(value) ? value : fallback
  return Math.min(Math.max(duration, minimum), maximum)
}

function shouldShowLoader(sessionKey, force) {
  if (force || typeof window === 'undefined') return true
  try {
    return window.sessionStorage.getItem(sessionKey) !== 'true'
  } catch {
    return true
  }
}

function rememberLoader(sessionKey) {
  try {
    window.sessionStorage.setItem(sessionKey, 'true')
  } catch {
    // A private browser may block storage; the loader can still finish normally.
  }
}

/**
 * Initial-session overlay. It is safe to mount as <SiteLoader />: `ready` defaults
 * to true, and both the display and exit transition have bounded timers.
 */
export default function SiteLoader({
  animationPath = `${import.meta.env.BASE_URL}loading.json`,
  force = false,
  maxDuration = 5500,
  minDuration = 1200,
  onFinish,
  ready = true,
  sessionKey = SITE_LOADER_SESSION_KEY,
}) {
  const [phase, setPhase] = useState(() => (
    shouldShowLoader(sessionKey, force) ? 'visible' : 'done'
  ))
  const [animationReady, setAnimationReady] = useState(false)
  const [animationFailed, setAnimationFailed] = useState(false)
  const animationContainerRef = useRef(null)
  const startedAtRef = useRef(Date.now())
  const onFinishRef = useRef(onFinish)
  onFinishRef.current = onFinish

  const reduceMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const safeMinimum = clampDuration(minDuration, 1200, reduceMotion ? 250 : 500, 2500)
  const safeMaximum = clampDuration(maxDuration, 5500, safeMinimum + 250, 10000)

  const beginExit = useCallback(() => {
    rememberLoader(sessionKey)
    setPhase((current) => (current === 'visible' ? 'leaving' : current))
  }, [sessionKey])

  useEffect(() => {
    if (phase !== 'visible') return undefined

    const elapsed = Date.now() - startedAtRef.current
    const hardStop = window.setTimeout(beginExit, Math.max(0, safeMaximum - elapsed))
    const readyStop = ready && (animationReady || animationFailed)
      ? window.setTimeout(
        beginExit,
        Math.max(0, safeMinimum - elapsed, animationReady ? 650 : 0),
      )
      : null

    return () => {
      window.clearTimeout(hardStop)
      if (readyStop !== null) window.clearTimeout(readyStop)
    }
  }, [animationFailed, animationReady, beginExit, phase, ready, safeMaximum, safeMinimum])

  useEffect(() => {
    if (phase === 'done') return undefined
    window.document.body.classList.add('tw-site-loading')
    return () => window.document.body.classList.remove('tw-site-loading')
  }, [phase])

  useEffect(() => {
    if (phase !== 'visible' || reduceMotion || !animationContainerRef.current) return undefined

    let cancelled = false
    let animation = null

    import('lottie-web/build/player/lottie_light.js')
      .then((module) => {
        if (cancelled || !animationContainerRef.current) return
        const lottie = module.default || module
        animation = lottie.loadAnimation({
          container: animationContainerRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          path: animationPath,
          rendererSettings: {
            preserveAspectRatio: 'xMidYMid meet',
            progressiveLoad: true,
          },
        })
        animation.setSpeed(.82)
        animation.addEventListener('DOMLoaded', () => {
          if (!cancelled) setAnimationReady(true)
        })
      })
      .catch(() => {
        if (!cancelled) setAnimationFailed(true)
      })

    return () => {
      cancelled = true
      animation?.destroy()
    }
  }, [animationPath, phase, reduceMotion])

  useEffect(() => {
    if (phase !== 'leaving') return undefined
    const finishTimer = window.setTimeout(() => {
      setPhase('done')
      onFinishRef.current?.()
    }, reduceMotion ? 0 : 420)
    return () => window.clearTimeout(finishTimer)
  }, [phase, reduceMotion])

  if (phase === 'done') return null

  return (
    <div
      className={`tw-loader ${phase === 'leaving' ? 'is-leaving' : ''} ${reduceMotion ? 'is-reduced' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Loading Tell & Wed"
    >
      <div className="tw-loader__content">
        <div className="tw-loader__brand">
          <BrandLogo />
        </div>

        <div className="tw-loader__animation-shell" aria-hidden="true">
          <div className={`tw-loader__fallback ${animationReady ? 'is-hidden' : ''}`}>
            <span>Loading…</span>
          </div>
          {!reduceMotion && <div className="tw-loader__lottie" ref={animationContainerRef} />}
        </div>
      </div>
    </div>
  )
}
