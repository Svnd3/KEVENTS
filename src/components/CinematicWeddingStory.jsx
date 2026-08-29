import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { cinematicWeddingTemplates } from '../data/cinematicWeddingTemplates.js'
import '../cinematic-wedding-story.css'

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value))
const smoothStep = (value) => {
  const amount = clamp(value)
  return amount * amount * (3 - 2 * amount)
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ))

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    query.addEventListener?.('change', update)
    return () => query.removeEventListener?.('change', update)
  }, [])

  return reduced
}

function useDeferredFilm(reducedMotion) {
  const [ready, setReady] = useState(false)
  const connection = typeof navigator !== 'undefined' ? navigator.connection : null
  const isConstrained = Boolean(
    reducedMotion
    || connection?.saveData
    || /(^|-)2g$/.test(connection?.effectiveType || ''),
  )

  useEffect(() => {
    if (isConstrained) return undefined

    let idleId = 0
    let timeoutId = 0
    const enable = () => setReady(true)
    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(enable, { timeout: 850 })
    } else {
      timeoutId = window.setTimeout(enable, 240)
    }

    return () => {
      window.cancelIdleCallback?.(idleId)
      window.clearTimeout(timeoutId)
    }
  }, [isConstrained])

  return ready && !isConstrained
}

function useScrollDirection(storyRef, videoRef, config, allowFilm) {
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const story = storyRef.current
    const video = videoRef.current
    if (!story || !video || !config) return undefined

    const scenes = [...story.querySelectorAll('[data-cw-scene]')]
    const sceneLines = scenes.map((scene) => [...scene.querySelectorAll('[data-cw-line]')])
    const planCards = [...story.querySelectorAll('[data-cw-plan-card]')]
    let metrics = []
    let storyTop = 0
    let storyDistance = 1
    let viewportHeight = window.innerHeight
    let viewportWidth = window.innerWidth
    let frame = 0
    let lastSeek = 0
    let lastChapter = -1

    const documentTop = (element) => element.getBoundingClientRect().top + window.scrollY

    const measure = () => {
      storyTop = documentTop(story)
      viewportHeight = window.innerHeight
      viewportWidth = window.innerWidth
      storyDistance = Math.max(1, story.offsetHeight - viewportHeight)
      metrics = scenes.map((scene) => ({
        top: documentTop(scene),
        height: Math.max(1, scene.offsetHeight),
      }))
      queueRender()
    }

    const render = (now = performance.now()) => {
      frame = 0
      const scrollY = window.scrollY
      const viewportCenter = scrollY + viewportHeight * 0.5
      const progress = clamp((scrollY - storyTop) / storyDistance)
      story.style.setProperty('--cw-story-progress', progress.toFixed(4))

      let activeChapter = 0
      let strongestPresence = -1
      let planProgress = 0

      metrics.forEach((metric, index) => {
        const scene = scenes[index]
        const local = clamp((scrollY - metric.top) / Math.max(1, metric.height - viewportHeight))
        const distance = Math.abs(viewportCenter - (metric.top + metric.height * 0.5))
        const presence = smoothStep(clamp(1 - distance / (metric.height * 0.55 + viewportHeight * 0.28)))
        scene.style.setProperty('--cw-local', local.toFixed(4))
        scene.style.setProperty('--cw-presence', presence.toFixed(4))
        scene.toggleAttribute('data-active', presence > 0.44)

        if (presence > strongestPresence) {
          strongestPresence = presence
          activeChapter = index
        }

        sceneLines[index].forEach((line, lineIndex) => {
          const reveal = smoothStep(clamp((local - 0.06 - lineIndex * 0.075) / 0.24))
          line.style.setProperty('--cw-line-reveal', reveal.toFixed(4))
        })

        if (scene.dataset.scene === 'plan') planProgress = smoothStep(clamp((local - 0.08) / 0.82))
      })

      if (activeChapter !== lastChapter) {
        story.dataset.chapter = String(activeChapter + 1).padStart(2, '0')
        story.querySelector('[data-cw-folio]')?.setAttribute('data-chapter', story.dataset.chapter)
        lastChapter = activeChapter
      }

      const usesScrollArc = config.theme === 'transit' || (config.theme === 'scarlet' && viewportWidth <= 680)
      if (usesScrollArc) {
        const travel = planProgress * Math.max(0, planCards.length - 1)
        const isScarletMobile = config.theme === 'scarlet'
        const spacing = isScarletMobile
          ? Math.min(viewportWidth * 0.84, 360)
          : Math.min(viewportWidth * 0.72, 610)
        planCards.forEach((card, index) => {
          const offset = index - travel
          const distance = Math.abs(offset)
          const x = offset * spacing
          const y = isScarletMobile
            ? Math.min(34, distance * distance * 9)
            : Math.min(130, distance * distance * 34)
          const scale = 1 - Math.min(isScarletMobile ? 0.1 : 0.18, distance * (isScarletMobile ? 0.045 : 0.085))
          const opacity = clamp(1.25 - distance * (isScarletMobile ? 0.38 : 0.46), 0.08, 1)
          card.style.setProperty('--cw-card-x', `${x.toFixed(2)}px`)
          card.style.setProperty('--cw-card-y', `${y.toFixed(2)}px`)
          card.style.setProperty('--cw-card-rotate', `${(offset * (isScarletMobile ? 1.4 : 3.2)).toFixed(2)}deg`)
          card.style.setProperty('--cw-card-scale', scale.toFixed(3))
          card.style.setProperty('--cw-card-opacity', opacity.toFixed(3))
          card.style.zIndex = String(20 - Math.round(distance * 4))
        })
      }

      if (allowFilm && video.readyState >= 2 && Number.isFinite(video.duration)) {
        const cuePosition = progress * (config.videoCues.length - 1)
        const fromIndex = Math.floor(cuePosition)
        const toIndex = Math.min(config.videoCues.length - 1, fromIndex + 1)
        const cueProgress = smoothStep(cuePosition - fromIndex)
        const fromCue = config.videoCues[fromIndex] ?? 0
        const toCue = config.videoCues[toIndex] ?? 1
        const desiredProgress = fromCue + (toCue - fromCue) * cueProgress
        const desiredTime = desiredProgress * Math.max(0, video.duration - 0.08)
        const seekInterval = viewportWidth <= 680 ? 62 : 42
        if (!video.seeking && now - lastSeek >= seekInterval && Math.abs(video.currentTime - desiredTime) > 0.04) {
          video.currentTime = desiredTime
          lastSeek = now
        }
      }
    }

    function queueRender() {
      if (!frame) frame = window.requestAnimationFrame(render)
    }

    if (reducedMotion) story.dataset.motion = 'reduced'
    else story.dataset.motion = allowFilm ? 'film' : 'poster'

    if (allowFilm) video.load()
    else {
      video.pause()
      video.removeAttribute('src')
      video.load()
    }

    const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(measure) : null
    resizeObserver?.observe(story)
    video.addEventListener('loadedmetadata', queueRender)
    window.addEventListener('scroll', queueRender, { passive: true })
    window.addEventListener('resize', measure, { passive: true })
    measure()

    return () => {
      window.cancelAnimationFrame(frame)
      resizeObserver?.disconnect()
      video.removeEventListener('loadedmetadata', queueRender)
      window.removeEventListener('scroll', queueRender)
      window.removeEventListener('resize', measure)
    }
  }, [allowFilm, config, reducedMotion, storyRef, videoRef])
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M14 6l6 6-6 6" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.4" />
    </svg>
  )
}

function MusicIcon({ playing }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 18V6l9-2v11" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="15.5" cy="15" r="2.5" />
      {playing && <path className="cw-music__wave" d="M21 7c1.4 1.4 1.4 4.6 0 6" />}
    </svg>
  )
}

function RevealLines({ as: Tag = 'h2', id, lines, className = '' }) {
  return (
    <Tag id={id} className={`cw-lines ${className}`}>
      {lines.map((line, index) => (
        <span className="cw-line" data-cw-line data-tone={index % 3} key={`${line}-${index}`}>
          <span>{line}</span>
        </span>
      ))}
    </Tag>
  )
}

function StoryFilm({ config, videoRef, allowFilm }) {
  return (
    <div className="cw-film" aria-hidden="true">
      <div className="cw-film__wash" />
      <video
        ref={videoRef}
        className="cw-film__video"
        muted
        playsInline
        preload={allowFilm ? 'metadata' : 'none'}
        poster={config.poster}
        src={allowFilm ? config.video : undefined}
        tabIndex={-1}
      />
      <div className="cw-film__veil" />
      <div className="cw-film__texture" />
      <span className="cw-film__folio" data-cw-folio>SCENE</span>
    </div>
  )
}

function Hero({ config }) {
  return (
    <section className="cw-scene cw-hero" data-cw-scene data-scene="hero" aria-labelledby={`${config.id}-title`}>
      <div className="cw-stage cw-hero__stage">
        <div className="cw-hero__topline">
          <span>{config.hero.eyebrow}</span>
          <span>{config.dateShort}</span>
        </div>
        <h1 id={`${config.id}-title`} className="cw-hero__names">
          <span>{config.couple[0]}</span>
          <i>&amp;</i>
          <span>{config.couple[1]}</span>
        </h1>
        <RevealLines as="p" lines={config.hero.statement} className="cw-hero__statement" />
        <div className="cw-hero__footer">
          <span>{config.hero.footer}</span>
          <span className="cw-scroll-cue"><i /> Scroll to arrive</span>
        </div>
      </div>
    </section>
  )
}

function InvitationNote({ config }) {
  return (
    <section className="cw-scene cw-note" data-cw-scene data-scene="note" aria-labelledby={`${config.id}-note`}>
      <div className="cw-stage cw-note__stage">
        <article className="cw-paper">
          <div className="cw-paper__meta">
            <span>{config.note.eyebrow}</span>
            <i />
            <span>{config.date}</span>
          </div>
          <RevealLines id={`${config.id}-note`} lines={config.note.heading} className="cw-note__heading" />
          <p className="cw-note__body">{config.note.body}</p>
          <p className="cw-note__signoff">{config.note.signoff}</p>
          <span className="cw-paper__stamp" aria-hidden="true">K<br />E</span>
        </article>
      </div>
    </section>
  )
}

function StoryMap({ config }) {
  return (
    <section className="cw-scene cw-route" data-cw-scene data-scene="route" aria-labelledby={`${config.id}-route`}>
      <div className="cw-stage cw-route__stage">
        <header className="cw-section-copy">
          <span>{config.map.eyebrow}</span>
          <RevealLines id={`${config.id}-route`} lines={config.map.heading} className="cw-section-copy__heading" />
          <p>{config.map.body}</p>
        </header>
        <div className="cw-map-card">
          <img src={config.map.image} alt="Map of the celebration route in Nairobi" loading="lazy" decoding="async" />
          <svg className="cw-map-card__route" viewBox="0 0 1000 620" preserveAspectRatio="none" aria-hidden="true">
            <path d="M142 470C250 354 314 425 408 314S624 130 822 188" />
          </svg>
          <ol className="cw-map-card__stops">
            {config.map.stops.map((stop, index) => (
              <li key={stop.name}>
                <b>{String(index + 1).padStart(2, '0')}</b>
                <span><strong>{stop.name}</strong><small>{stop.time} · {stop.note}</small></span>
              </li>
            ))}
          </ol>
          <a href={config.map.routeUrl} target="_blank" rel="noreferrer">
            <PinIcon /> Open the route <ArrowIcon />
          </a>
        </div>
      </div>
    </section>
  )
}

function DayPlan({ config }) {
  return (
    <section className="cw-scene cw-plan" data-cw-scene data-scene="plan" aria-labelledby={`${config.id}-plan`}>
      <div className="cw-stage cw-plan__stage">
        <header className="cw-section-copy cw-plan__heading">
          <span>{config.planEyebrow}</span>
          <RevealLines id={`${config.id}-plan`} lines={config.planHeading} className="cw-section-copy__heading" />
        </header>
        <div className="cw-plan__deck">
          {config.venues.map((venue) => (
            <article className="cw-plan-card" data-cw-plan-card key={venue.number}>
              <figure>
                <img src={venue.image} alt="" loading="lazy" decoding="async" />
                <figcaption>{venue.chapter}</figcaption>
              </figure>
              <div className="cw-plan-card__copy">
                <span className="cw-plan-card__number">{venue.number}</span>
                <time>{venue.time}</time>
                <h3>{venue.title}</h3>
                <p>{venue.note}</p>
                <a href={venue.directionsUrl} target="_blank" rel="noreferrer"><PinIcon /> Directions</a>
              </div>
            </article>
          ))}
        </div>
        <div className="cw-plan__progress" aria-hidden="true"><i /><i /><i /></div>
      </div>
    </section>
  )
}

function VibeList({ config }) {
  return (
    <section className="cw-scene cw-vibes" data-cw-scene data-scene="vibes" aria-labelledby={`${config.id}-vibes`}>
      <div className="cw-stage cw-vibes__stage">
        <header className="cw-section-copy">
          <span>{config.vibes.eyebrow}</span>
          <RevealLines id={`${config.id}-vibes`} lines={config.vibes.heading} className="cw-section-copy__heading" />
        </header>
        <ol className="cw-vibes__list">
          {config.vibes.items.map((item) => (
            <li key={item.number}>
              <span>{item.number}</span>
              <strong>{item.title}</strong>
              <small>{item.detail}</small>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function ReplyLanded({ reducedMotion }) {
  return (
    <figure className="cw-reply-landed">
      {reducedMotion ? (
        <img src="/images/reply-landed-poster.webp" alt="" />
      ) : (
        <video
          src="/media/reply-landed.mp4"
          poster="/images/reply-landed-poster.webp"
          muted
          playsInline
          autoPlay
          preload="metadata"
          aria-hidden="true"
        />
      )}
      <figcaption>Your reply has landed</figcaption>
    </figure>
  )
}

function RSVP({ config }) {
  const fieldId = useId()
  const reducedMotion = useReducedMotion()
  const [attendance, setAttendance] = useState('yes')
  const [guestName, setGuestName] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const submit = (event) => {
    event.preventDefault()
    setGuestName(new FormData(event.currentTarget).get('name')?.trim() || 'You')
    setSubmitted(true)
  }

  return (
    <section className="cw-scene cw-rsvp" data-cw-scene data-scene="rsvp" aria-labelledby={`${config.id}-rsvp`}>
      <div className="cw-stage cw-rsvp__stage">
        <header className="cw-section-copy cw-rsvp__intro">
          <span>{config.rsvp.eyebrow}</span>
          <RevealLines id={`${config.id}-rsvp`} lines={config.rsvp.heading} className="cw-section-copy__heading" />
          <p>{config.rsvp.body}</p>
        </header>

        {submitted ? (
          <div className="cw-rsvp__success" role="status">
            <span>{attendance === 'yes' ? config.rsvp.successEyebrow : config.rsvp.declineEyebrow}</span>
            <h3>{attendance === 'yes' ? config.rsvp.successHeading : config.rsvp.declineHeading}</h3>
            <p>{(attendance === 'yes' ? config.rsvp.successBody : config.rsvp.declineBody).replace('{name}', guestName)}</p>
            {config.theme === 'transit' ? <ReplyLanded reducedMotion={reducedMotion} /> : <i className="cw-rsvp__seal" aria-hidden="true">Z<br />&amp;<br />J</i>}
          </div>
        ) : (
          <form className="cw-rsvp__form" onSubmit={submit}>
            <fieldset>
              <legend>Can you make it?</legend>
              <label className={attendance === 'yes' ? 'is-selected' : ''}>
                <input type="radio" name="attendance" value="yes" checked={attendance === 'yes'} onChange={() => setAttendance('yes')} />
                <span>{config.rsvp.yes}</span><i>Yes</i>
              </label>
              <label className={attendance === 'no' ? 'is-selected' : ''}>
                <input type="radio" name="attendance" value="no" checked={attendance === 'no'} onChange={() => setAttendance('no')} />
                <span>{config.rsvp.no}</span><i>No</i>
              </label>
            </fieldset>
            <label htmlFor={`${fieldId}-name`}>Your full name</label>
            <input id={`${fieldId}-name`} name="name" autoComplete="name" required />
            <label htmlFor={`${fieldId}-contact`}>Email address</label>
            <input id={`${fieldId}-contact`} name="contact" type="email" inputMode="email" autoComplete="email" required />
            <label htmlFor={`${fieldId}-note`}>Leave us a note <span>(optional)</span></label>
            <textarea id={`${fieldId}-note`} name="note" rows="2" />
            <button type="submit"><span>{attendance === 'yes' ? config.rsvp.cta : config.rsvp.declineCta}</span><ArrowIcon /></button>
          </form>
        )}
      </div>
    </section>
  )
}

function MusicControl({ music }) {
  const audioRef = useRef(null)
  const fadeRef = useRef(0)
  const [playing, setPlaying] = useState(false)

  const stopFade = useCallback(() => {
    window.cancelAnimationFrame(fadeRef.current)
    fadeRef.current = 0
  }, [])

  const fadeTo = useCallback((target, duration, done) => {
    const player = audioRef.current
    if (!player) return
    stopFade()
    const start = player.volume
    const startedAt = performance.now()
    const tick = (now) => {
      const progress = clamp((now - startedAt) / duration)
      player.volume = start + (target - start) * (1 - (1 - progress) ** 3)
      if (progress < 1) fadeRef.current = window.requestAnimationFrame(tick)
      else done?.()
    }
    fadeRef.current = window.requestAnimationFrame(tick)
  }, [stopFade])

  const toggle = () => {
    const player = audioRef.current
    if (!player) return
    if (player.paused) {
      if (!player.getAttribute('src')) {
        player.src = music.src
        player.load()
      }
      player.volume = 0
      player.play().then(() => fadeTo(music.volume, 560)).catch(() => setPlaying(false))
    } else {
      setPlaying(false)
      fadeTo(0, 240, () => player.pause())
    }
  }

  useEffect(() => {
    const player = audioRef.current
    const pauseWhenHidden = () => {
      if (!document.hidden || !player || player.paused) return
      stopFade()
      player.pause()
      setPlaying(false)
    }
    document.addEventListener('visibilitychange', pauseWhenHidden)
    return () => {
      document.removeEventListener('visibilitychange', pauseWhenHidden)
      stopFade()
      if (player) {
        player.pause()
        player.removeAttribute('src')
        player.load()
      }
    }
  }, [stopFade])

  return (
    <>
      <button
        className={`cw-music${playing ? ' is-playing' : ''}`}
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        aria-label={`${playing ? 'Pause' : 'Play'} ${music.title} by ${music.artist}`}
      >
        <MusicIcon playing={playing} />
        <span><b>{playing ? 'Playing' : music.buttonLabel}</b><small>{music.title}</small></span>
      </button>
      <audio ref={audioRef} preload="none" loop onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
    </>
  )
}

function Footer({ config }) {
  return (
    <footer className="cw-scene cw-footer" data-cw-scene data-scene="footer">
      <div className="cw-footer__monogram">{config.couple[0][0]}<i>&amp;</i>{config.couple[1][0]}</div>
      <p>{config.date} · {config.city}</p>
      <span>Made for a very good day</span>
    </footer>
  )
}

export default function CinematicWeddingStory({ design }) {
  const config = cinematicWeddingTemplates[design.variant]
  const storyRef = useRef(null)
  const videoRef = useRef(null)
  const reducedMotion = useReducedMotion()
  const allowFilm = useDeferredFilm(reducedMotion)
  useScrollDirection(storyRef, videoRef, config, allowFilm)

  if (!config) return null

  return (
    <div className={`cw-story cw-story--${config.theme}`} ref={storyRef}>
      <StoryFilm config={config} videoRef={videoRef} allowFilm={allowFilm} />
      <div className="cw-story__content">
        <Hero config={config} />
        <InvitationNote config={config} />
        <StoryMap config={config} />
        <DayPlan config={config} />
        <VibeList config={config} />
        <RSVP config={config} />
        <Footer config={config} />
      </div>
      <MusicControl music={config.music} />
    </div>
  )
}
