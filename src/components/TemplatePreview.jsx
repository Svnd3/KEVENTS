import { useCallback, useEffect, useRef, useState } from 'react'
import { formatPrice } from '../data/designs.js'
import { scrollWeddingVariants } from '../data/scrollWeddingTemplates.js'
import { cinematicWeddingVariants } from '../data/cinematicWeddingTemplates.js'
import { getSoundtrack } from '../data/soundtracks.js'
import InvitationStory from './InvitationStory.jsx'
import SponsaliaEnvelopeIntro from './SponsaliaEnvelopeIntro.jsx'
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
  const [embeddedHtml, setEmbeddedHtml] = useState('')
  const [embeddedError, setEmbeddedError] = useState('')
  const audioRef = useRef(null)
  const embeddedFrameRef = useRef(null)
  const bridgeTokenRef = useRef('')
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

  useEffect(() => {
    if (!design?.templatePath) {
      setEmbeddedHtml('')
      setEmbeddedError('')
      bridgeTokenRef.current = ''
      return undefined
    }

    const controller = new AbortController()
    const token = window.crypto?.randomUUID?.()
      || `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
    const templateUrl = new URL(design.templatePath, window.location.href)
    const templateBase = new URL('.', templateUrl).href
    const assetOrigin = window.location.origin
    bridgeTokenRef.current = token
    setEmbeddedHtml('')
    setEmbeddedError('')

    fetch(templateUrl, { credentials: 'same-origin', signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Template request failed (${response.status})`)
        return response.text()
      })
      .then((source) => {
        if (controller.signal.aborted) return
        const escapedBase = templateBase.replaceAll('&', '&amp;').replaceAll('"', '&quot;')
        let html = source.replaceAll('__KEVENTS_BRIDGE_TOKEN__', token)
        html = html.replace(/<head\b[^>]*>/i, (head) => `${head}<base href="${escapedBase}">`)
        html = html.replace(
          /(<meta http-equiv="Content-Security-Policy" content=")([^"]*)(">)/i,
          (_, open, policy, close) => `${open}${policy.replaceAll("'self'", assetOrigin)}${close}`,
        )
        setEmbeddedHtml(html)
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setEmbeddedError('This invitation preview could not be loaded.')
      })

    return () => controller.abort()
  }, [design?.slug, design?.templatePath])

  useEffect(() => {
    if (!design?.templatePath) return undefined

    const endpoint = import.meta.env.VITE_RSVP_ENDPOINT
    const handleMessage = async (event) => {
      if (event.source !== embeddedFrameRef.current?.contentWindow) return
      if (event.origin !== 'null') return
      const message = event.data
      if (!message || message.source !== 'kevents-template') return
      if (!bridgeTokenRef.current || message.token !== bridgeTokenRef.current) return

      if (message.type === 'enquire') {
        onEnquire?.(design)
        return
      }

      if (message.type === 'directions' && typeof message.url === 'string') {
        try {
          const destination = new URL(message.url)
          const isGoogleMaps = destination.protocol === 'https:'
            && (destination.hostname === 'google.com' || destination.hostname.endsWith('.google.com'))
          if (isGoogleMaps) window.open(destination.href, '_blank', 'noopener,noreferrer')
        } catch {
          // Ignore invalid directions URLs from embedded documents.
        }
        return
      }

      if (message.type !== 'rsvp' || typeof message.requestId !== 'string') return

      const reply = (ok) => event.source?.postMessage({
        source: 'kevents-host',
        type: 'rsvp-result',
        token: bridgeTokenRef.current,
        requestId: message.requestId,
        ok,
        demo: !endpoint,
      }, '*')

      try {
        if (endpoint) {
          const payload = new FormData()
          Object.entries(message.fields || {}).slice(0, 50).forEach(([key, value]) => {
            if (typeof value === 'string') payload.append(key, value.slice(0, 4000))
          })
          payload.set('template', design.name)
          payload.set('price', formatPrice(design.price))

          const response = await fetch(endpoint, {
            method: 'POST',
            body: payload,
            headers: { Accept: 'application/json' },
          })
          if (!response.ok) throw new Error('RSVP could not be sent')
        }
        reply(true)
      } catch {
        reply(false)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [design, onEnquire])

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

  const envelopeIntro = !introComplete ? (
    <SponsaliaEnvelopeIntro
      design={design}
      onComplete={() => setIntroComplete(true)}
      onUserGesture={startMusic}
    />
  ) : null

  if (design.templatePath) {
    return (
      <>
        {envelopeIntro}
        <div className="template-preview template-preview--embedded">
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

          <main id="main-content" className="tp-embedded" tabIndex={-1}>
            {embeddedHtml ? (
              <iframe
                key={design.slug}
                ref={embeddedFrameRef}
                className="tp-embedded__frame"
                srcDoc={embeddedHtml}
                title={`${design.name} invitation preview`}
                allow="autoplay; fullscreen"
                sandbox="allow-scripts allow-modals allow-presentation"
              />
            ) : (
              <div className="tp-embedded__status" role={embeddedError ? 'alert' : 'status'}>
                {embeddedError || 'Loading invitation preview…'}
              </div>
            )}
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

          <audio
            ref={audioRef}
            src={soundtrack.src}
            preload="none"
            loop
            onPlay={(event) => {
              event.currentTarget.volume = soundtrack.volume ?? 0.28
              setIsMusicPlaying(true)
            }}
            onPause={() => setIsMusicPlaying(false)}
          />
        </div>
      </>
    )
  }

  if (isCinematicWedding) {
    return (
      <>
        {envelopeIntro}
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
      </>
    )
  }

  if (isScrollWedding) {
    return (
      <>
        {envelopeIntro}
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
      </>
    )
  }

  if (isSandeSignature) {
    return (
      <>
        {envelopeIntro}
        <SandeSignatureStory
          design={design}
          onBack={onBack}
          onUseDesign={(selectedDesign) => onEnquire?.(selectedDesign)}
          isMusicPlaying={isMusicPlaying}
          onToggleMusic={toggleMusic}
        />
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
      {envelopeIntro}
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
