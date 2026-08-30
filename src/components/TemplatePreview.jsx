import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useCurrency } from './CurrencyControl.jsx'
import { scrollWeddingTemplates, scrollWeddingVariants } from '../data/scrollWeddingTemplates.js'
import { cinematicWeddingTemplates, cinematicWeddingVariants } from '../data/cinematicWeddingTemplates.js'
import { getSoundtrack } from '../data/soundtracks.js'
import RoseJourney from './RoseJourney.jsx'
import KeepsakeEnvelopeIntro from './KeepsakeEnvelopeIntro.jsx'
import SponsaliaEnvelopeIntro from './SponsaliaEnvelopeIntro.jsx'
import SaveDesignButton from './SaveDesignButton.jsx'
import '../preview.css'

const loadInvitationStory = () => import('./InvitationStory.jsx')
const loadSandeSignatureStory = () => import('./SandeSignatureStory.jsx')
const loadScrollWeddingStory = () => import('./ScrollWeddingStory.jsx')
const loadCinematicWeddingStory = () => import('./CinematicWeddingStory.jsx')
const loadKeepsakeWeddingStory = () => import('./KeepsakeWeddingStory.jsx')

const InvitationStory = lazy(loadInvitationStory)
const SandeSignatureStory = lazy(loadSandeSignatureStory)
const ScrollWeddingStory = lazy(loadScrollWeddingStory)
const CinematicWeddingStory = lazy(loadCinematicWeddingStory)
const KeepsakeWeddingStory = lazy(loadKeepsakeWeddingStory)

function warmImages(sources) {
  sources.filter(Boolean).forEach((src) => {
    const image = new window.Image()
    image.decoding = 'async'
    image.src = src
  })
}

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

function PreviewToolbar({ design, onBack, onEnquire, saved, onToggleSaved }) {
  const { formatPrice, currencyCode } = useCurrency()

  return (
    <nav className="tp-toolbar" aria-label="Invitation preview controls">
      <button className="tp-toolbar__back" type="button" onClick={onBack} aria-label="Back to all designs">
        <BackIcon />
        <span>All designs</span>
      </button>

      <div className="tp-toolbar__title">
        <strong>{design.name}</strong>
        <span>{formatPrice(design.price)}{currencyCode !== 'KES' ? ' approx.' : ''} · one-time</span>
      </div>

      <div className="tp-toolbar__actions">
        <SaveDesignButton
          design={design}
          saved={saved}
          onToggle={onToggleSaved}
          className="tp-toolbar__save"
        />
        <button className="tp-toolbar__use" type="button" onClick={() => onEnquire?.(design)} aria-label={`Start with ${design.name}`}>
          <span className="tp-toolbar__use-label tp-toolbar__use-label--desktop">Start with this design</span>
          <span className="tp-toolbar__use-label tp-toolbar__use-label--mobile">Start</span>
          <ArrowIcon />
        </button>
      </div>
    </nav>
  )
}

function SoundtrackButton({ isPlaying, onToggle, soundtrack }) {
  return (
    <button
      className={`tp-soundtrack${isPlaying ? ' is-playing' : ''}`}
      type="button"
      onClick={onToggle}
      aria-pressed={isPlaying}
      aria-label={`${isPlaying ? 'Pause' : 'Play'} ${soundtrack.title}`}
      title={soundtrack.title}
    >
      <SoundIcon playing={isPlaying} />
      <span>{isPlaying ? 'Sound on' : 'Play song'}</span>
    </button>
  )
}

export default function TemplatePreview({ design, onBack, onEnquire, saved = false, onToggleSaved }) {
  const { formatPrice } = useCurrency()
  const [introComplete, setIntroComplete] = useState(false)
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)
  const [embeddedHtml, setEmbeddedHtml] = useState('')
  const [embeddedError, setEmbeddedError] = useState('')
  const [embeddedAttempt, setEmbeddedAttempt] = useState(0)
  const audioRef = useRef(null)
  const embeddedFrameRef = useRef(null)
  const bridgeTokenRef = useRef('')
  const isSandeSignature = design?.variant === 'sande'
  const isKeepsakeWedding = design?.variant === 'keepsake-tide'
  const isScrollWedding = scrollWeddingVariants.has(design?.variant)
  const isCinematicWedding = cinematicWeddingVariants.has(design?.variant)
  const cinematicMusic = isCinematicWedding ? cinematicWeddingTemplates[design?.variant]?.music : null
  const scrollMusic = isScrollWedding ? scrollWeddingTemplates[design?.variant]?.music : null
  const soundtrack = cinematicMusic ?? scrollMusic ?? getSoundtrack(design)

  useEffect(() => {
    setIntroComplete(false)
    setIsMusicPlaying(false)
    setEmbeddedAttempt(0)
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

    const requestTimeout = window.setTimeout(() => controller.abort('timeout'), 15000)

    fetch(templateUrl, { credentials: 'same-origin', signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Template request failed (${response.status})`)
        return response.text()
      })
      .then((source) => {
        if (controller.signal.aborted) return
        window.clearTimeout(requestTimeout)
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
        window.clearTimeout(requestTimeout)
        if (controller.signal.reason === 'timeout') {
          setEmbeddedError('This invitation preview took too long to load.')
        } else if (error.name !== 'AbortError') {
          setEmbeddedError('This invitation preview could not be loaded.')
        }
      })

    return () => {
      window.clearTimeout(requestTimeout)
      controller.abort()
    }
  }, [design?.slug, design?.templatePath, embeddedAttempt])

  useEffect(() => {
    if (!design?.templatePath) return undefined

    const endpoint = import.meta.env.VITE_RSVP_ENDPOINT || import.meta.env.VITE_ENQUIRY_ENDPOINT
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
          if (payload.get('attendance') === 'yes') payload.set('attendance', 'attending')
          if (payload.get('attendance') === 'no') payload.set('attendance', 'declined')
          payload.set('rsvpSchema', 'kevents-rsvp-v1')
          payload.set('template', design.name)
          payload.set('templateId', design.slug)
          payload.set('eventType', design.eventType || 'Wedding')
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
  }, [design, formatPrice, onEnquire])

  const startMusic = useCallback(() => {
    const player = audioRef.current
    if (!player) return
    player.volume = soundtrack.volume ?? 0.28
    player.play().catch(() => setIsMusicPlaying(false))
  }, [soundtrack.volume])

  const preparePreview = useCallback(() => {
    startMusic()
    if (design?.templatePath) return
    if (isCinematicWedding) {
      const config = cinematicWeddingTemplates[design.variant]
      warmImages([config?.poster, config?.roseJourney?.asset])
      loadCinematicWeddingStory()
    } else if (isScrollWedding) {
      const config = scrollWeddingTemplates[design.variant]
      warmImages([config?.poster, config?.rose])
      loadScrollWeddingStory()
    } else if (isSandeSignature) {
      warmImages(['/images/wedding-couple.webp', '/images/wedding-celebration.webp'])
      loadSandeSignatureStory()
    }
    else loadInvitationStory()
  }, [design?.templatePath, design?.variant, isCinematicWedding, isSandeSignature, isScrollWedding, startMusic])

  const prepareKeepsakePreview = useCallback(() => {
    warmImages([
      '/images/wedding-couple.webp',
      '/images/wedding-dance.webp',
      '/images/wedding-celebration.webp',
      '/images/venue-hotel-pool.webp',
    ])
    loadKeepsakeWeddingStory()
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

  useEffect(() => {
    if (!introComplete) return undefined
    window.scrollTo({ top: 0, behavior: 'auto' })
    const frame = window.requestAnimationFrame(() => {
      document.getElementById('main-content')?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [design?.slug, introComplete])

  if (!design) return null

  const envelopeIntro = !introComplete ? (
    isKeepsakeWedding ? (
      <KeepsakeEnvelopeIntro
        design={design}
        onBack={onBack}
        onComplete={() => setIntroComplete(true)}
        onUserGesture={prepareKeepsakePreview}
      />
    ) : (
      <SponsaliaEnvelopeIntro
        design={design}
        onBack={onBack}
        onComplete={() => setIntroComplete(true)}
        onUserGesture={preparePreview}
        saved={saved}
        onToggleSaved={onToggleSaved}
      />
    )
  ) : null

  let previewContent = null

  if (design.templatePath) {
    previewContent = introComplete ? (
      <div className="template-preview template-preview--embedded">
        <PreviewToolbar design={design} onBack={onBack} onEnquire={onEnquire} saved={saved} onToggleSaved={onToggleSaved} />

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
              <span>{embeddedError || 'Loading invitation preview…'}</span>
              {embeddedError && (
                <button type="button" onClick={() => setEmbeddedAttempt((attempt) => attempt + 1)}>
                  Retry preview
                </button>
              )}
            </div>
          )}
        </main>

        <SoundtrackButton isPlaying={isMusicPlaying} onToggle={toggleMusic} soundtrack={soundtrack} />
      </div>
    ) : null
  } else if (isKeepsakeWedding) {
    previewContent = introComplete ? (
      <div className="template-preview template-preview--keepsake">
        <PreviewToolbar design={design} onBack={onBack} onEnquire={onEnquire} saved={saved} onToggleSaved={onToggleSaved} />
        <main id="main-content" tabIndex={-1}>
          <KeepsakeWeddingStory design={design} isMusicPlaying={isMusicPlaying} onToggleMusic={toggleMusic} />
        </main>
      </div>
    ) : null
  } else if (isCinematicWedding) {
    previewContent = introComplete ? (
      <div className={`template-preview template-preview--cinematic-new template-preview--${design.variant}`}>
        <PreviewToolbar design={design} onBack={onBack} onEnquire={onEnquire} saved={saved} onToggleSaved={onToggleSaved} />
        <main id="main-content" tabIndex={-1}>
          <CinematicWeddingStory design={design} showMusicControl={false} />
        </main>
        <SoundtrackButton isPlaying={isMusicPlaying} onToggle={toggleMusic} soundtrack={soundtrack} />
      </div>
    ) : null
  } else if (isScrollWedding) {
    previewContent = introComplete ? (
      <div className="template-preview template-preview--scroll">
        <PreviewToolbar design={design} onBack={onBack} onEnquire={onEnquire} saved={saved} onToggleSaved={onToggleSaved} />
        <main id="main-content" tabIndex={-1}>
          <ScrollWeddingStory design={design} showMusicControl={false} />
        </main>
        <SoundtrackButton isPlaying={isMusicPlaying} onToggle={toggleMusic} soundtrack={soundtrack} />
      </div>
    ) : null
  } else if (isSandeSignature) {
    previewContent = introComplete ? (
      <div className="tp-rose-host">
        <SandeSignatureStory
          design={design}
          onBack={onBack}
          onUseDesign={(selectedDesign) => onEnquire?.(selectedDesign)}
          isMusicPlaying={isMusicPlaying}
          onToggleMusic={toggleMusic}
          saved={saved}
          onToggleSaved={onToggleSaved}
        />
        <RoseJourney design={design} />
      </div>
    ) : null
  } else {
    previewContent = introComplete ? (
      <div className="template-preview">
        <PreviewToolbar design={design} onBack={onBack} onEnquire={onEnquire} saved={saved} onToggleSaved={onToggleSaved} />

        <main id="main-content" tabIndex={-1}>
          <InvitationStory design={design} onEnquire={onEnquire} />
        </main>

        <RoseJourney design={design} />
        <SoundtrackButton isPlaying={isMusicPlaying} onToggle={toggleMusic} soundtrack={soundtrack} />
      </div>
    ) : null
  }

  return (
    <>
      {envelopeIntro}
      <Suspense
        fallback={(
          <main id="main-content" className="tp-story-loading" tabIndex={-1} role="status">
            Loading invitation…
          </main>
        )}
      >
        {previewContent}
      </Suspense>
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
    </>
  )
}
