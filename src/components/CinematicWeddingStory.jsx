import { useEffect, useId, useRef, useState } from 'react'
import { cinematicWeddingTemplates } from '../data/cinematicWeddingTemplates.js'
import { submitRsvp } from '../utils/submitRsvp.js'
import AutoplayMusicControl from './AutoplayMusicControl.jsx'
import EventRevealMoment from './EventRevealMoment.jsx'
import '../cinematic-wedding-story.css'

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value))
const smoothStep = (value) => {
  const amount = clamp(value)
  return amount * amount * (3 - 2 * amount)
}

const cinematicRosePaths = {
  sweep: [
    { x: -34, y: 16, turn: -14, scale: .76, mobile: { x: -27, y: 17, turn: -14, scale: .72 } },
    { x: 30, y: 8, turn: 32, scale: .68, mobile: { x: 24, y: 9, turn: 32, scale: .65 } },
    { x: -27, y: -12, turn: -18, scale: .7, mobile: { x: -22, y: -10, turn: -18, scale: .66 } },
    { x: 25, y: -5, turn: 54, scale: .66, mobile: { x: 21, y: -4, turn: 54, scale: .62 } },
    { x: -30, y: 12, turn: 6, scale: .68, mobile: { x: -24, y: 11, turn: 6, scale: .64 } },
    { x: 29, y: -11, turn: 72, scale: .64, mobile: { x: 23, y: -9, turn: 72, scale: .6 } },
    { x: -25, y: 5, turn: 26, scale: .6, mobile: { x: -20, y: 6, turn: 26, scale: .57 } },
    { x: 26, y: -4, turn: 92, scale: .55, mobile: { x: 21, y: -3, turn: 92, scale: .52 } },
  ],
  drift: [
    { x: 30, y: -12, turn: 12, scale: .72, mobile: { x: 25, y: -10, turn: 12, scale: .68 } },
    { x: -25, y: 9, turn: 72, scale: .65, mobile: { x: -21, y: 9, turn: 72, scale: .61 } },
    { x: 24, y: 14, turn: 135, scale: .62, mobile: { x: 20, y: 12, turn: 135, scale: .59 } },
    { x: -28, y: -8, turn: 198, scale: .68, mobile: { x: -23, y: -7, turn: 198, scale: .64 } },
    { x: 27, y: -10, turn: 255, scale: .64, mobile: { x: 22, y: -8, turn: 255, scale: .6 } },
    { x: -23, y: 13, turn: 318, scale: .62, mobile: { x: -20, y: 11, turn: 318, scale: .58 } },
    { x: 24, y: 4, turn: 382, scale: .58, mobile: { x: 20, y: 4, turn: 382, scale: .55 } },
    { x: -20, y: -5, turn: 438, scale: .52, mobile: { x: -17, y: -4, turn: 438, scale: .49 } },
  ],
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

function useScrollDirection(storyRef, videoRef, roseRef, config, allowFilm, reducedMotion) {
  useEffect(() => {
    const story = storyRef.current
    const video = videoRef.current
    if (!story || !video || !config) return undefined

    const rose = roseRef.current
    const roseJourney = config.roseJourney
    const rosePath = roseJourney
      ? cinematicRosePaths[roseJourney.path] || cinematicRosePaths.sweep
      : null
    const scenes = [...story.querySelectorAll('[data-cw-scene]')]
    const sceneLines = scenes.map((scene) => [...scene.querySelectorAll('[data-cw-line]')])
    const planCards = [...story.querySelectorAll('[data-cw-plan-card]')]
    let metrics = []
    let storyTop = 0
    let storyDistance = 1
    let viewportHeight = window.innerHeight
    let viewportWidth = window.innerWidth
    let frame = 0
    let roseIdleTimer = 0
    let lastSeek = 0
    let lastChapter = -1
    let lastRoseTransform = ''

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

      if (rose && rosePath) {
        if (reducedMotion) {
          rose.classList.remove('is-rose-moving')
          rose.style.removeProperty('transform')
          lastRoseTransform = ''
        } else {
          const pathPosition = progress * (rosePath.length - 1)
          const fromIndex = Math.floor(pathPosition)
          const toIndex = Math.min(rosePath.length - 1, fromIndex + 1)
          const segmentProgress = pathPosition - fromIndex
          const easedProgress = smoothStep(segmentProgress)
          const from = viewportWidth <= 680
            ? rosePath[fromIndex].mobile || rosePath[fromIndex]
            : rosePath[fromIndex]
          const to = viewportWidth <= 680
            ? rosePath[toIndex].mobile || rosePath[toIndex]
            : rosePath[toIndex]
          const direction = roseJourney.mirror ? -1 : 1
          const curve = Math.sin(segmentProgress * Math.PI)
          const x = (from.x + (to.x - from.x) * easedProgress) * direction
          const y = from.y + (to.y - from.y) * easedProgress - curve * 2.4
          const turn = (from.turn + (to.turn - from.turn) * easedProgress) * direction
          const scale = from.scale + (to.scale - from.scale) * easedProgress
          const transform = `translate(-50%, -50%) translate3d(${x.toFixed(2)}vw, ${y.toFixed(2)}vh, 0) rotate(${turn.toFixed(2)}deg) scale(${scale.toFixed(3)})`

          if (transform !== lastRoseTransform) {
            rose.style.transform = transform
            lastRoseTransform = transform
          }
        }
      }

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

      const usesScrollArc = config.planMotion === 'arc' && (config.theme !== 'scarlet' || viewportWidth <= 680)
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
      if (rose && !reducedMotion) {
        rose.classList.add('is-rose-moving')
        window.clearTimeout(roseIdleTimer)
        roseIdleTimer = window.setTimeout(() => {
          rose.classList.remove('is-rose-moving')
        }, 180)
      }
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
      window.clearTimeout(roseIdleTimer)
      rose?.classList.remove('is-rose-moving')
      resizeObserver?.disconnect()
      video.removeEventListener('loadedmetadata', queueRender)
      window.removeEventListener('scroll', queueRender)
      window.removeEventListener('resize', measure)
    }
  }, [allowFilm, config, reducedMotion, roseRef, storyRef, videoRef])
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

function StoryFilm({ config, videoRef, roseRef, allowFilm }) {
  return (
    <div className="cw-film" aria-hidden="true">
      <div className="cw-film__wash" />
      <video
        ref={videoRef}
        className="cw-film__video"
        muted
        playsInline
        disablePictureInPicture
        controlsList="nodownload noplaybackrate noremoteplayback"
        preload={allowFilm ? 'metadata' : 'none'}
        poster={config.poster}
        src={allowFilm ? config.video : undefined}
        style={{ objectPosition: config.videoPosition || '50% 50%' }}
        tabIndex={-1}
      />
      <div className="cw-film__veil" />
      <div className="cw-film__texture" />
      {config.roseJourney && (
        <img
          ref={roseRef}
          className={`cw-film__rose cw-film__rose--${config.roseJourney.kind}`}
          src={config.roseJourney.asset}
          alt=""
          aria-hidden="true"
          draggable="false"
          decoding="async"
          style={{ '--cw-rose-opacity': config.roseJourney.opacity }}
        />
      )}
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
  const successRef = useRef(null)
  const [attendance, setAttendance] = useState('yes')
  const [guestName, setGuestName] = useState('')
  const [status, setStatus] = useState('idle')
  const [demo, setDemo] = useState(false)

  useEffect(() => {
    if (status === 'success') successRef.current?.focus()
  }, [status])

  const submit = async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    setGuestName(new FormData(form).get('name')?.trim() || 'You')
    setStatus('sending')
    try {
      const result = await submitRsvp(form, config.label, { templateId: config.id })
      setDemo(result.demo)
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section className="cw-scene cw-rsvp" data-cw-scene data-scene="rsvp" aria-labelledby={`${config.id}-rsvp`}>
      <div className="cw-stage cw-rsvp__stage">
        <header className="cw-section-copy cw-rsvp__intro">
          <span>{config.rsvp.eyebrow}</span>
          <RevealLines id={`${config.id}-rsvp`} lines={config.rsvp.heading} className="cw-section-copy__heading" />
          <p>{config.rsvp.body}</p>
        </header>

        {status === 'success' ? (
          <div className="cw-rsvp__success" role="status" aria-live="polite" ref={successRef} tabIndex={-1}>
            <span>{demo ? 'Preview response' : attendance === 'yes' ? config.rsvp.successEyebrow : config.rsvp.declineEyebrow}</span>
            <h3>{attendance === 'yes' ? config.rsvp.successHeading : config.rsvp.declineHeading}</h3>
            <p>{demo
              ? `${guestName}, this is a demo only—your reply was not sent.`
              : (attendance === 'yes' ? config.rsvp.successBody : config.rsvp.declineBody).replace('{name}', guestName)}</p>
            {config.theme === 'transit' ? (
              <ReplyLanded reducedMotion={reducedMotion} />
            ) : (
              <i className="cw-rsvp__seal" aria-hidden="true">
                {config.couple[0][0]}<br />&amp;<br />{config.couple[1][0]}
              </i>
            )}
          </div>
        ) : (
          <form className="cw-rsvp__form" onSubmit={submit} aria-busy={status === 'sending'}>
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
            {status === 'error' && <p className="cw-rsvp__error" role="alert">That reply did not send. Please try again.</p>}
            <button type="submit" disabled={status === 'sending'}><span>{status === 'sending' ? 'Sending…' : attendance === 'yes' ? config.rsvp.cta : config.rsvp.declineCta}</span><ArrowIcon /></button>
          </form>
        )}
      </div>
    </section>
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

export default function CinematicWeddingStory({ design, showMusicControl = true }) {
  const config = cinematicWeddingTemplates[design.variant]
  const storyRef = useRef(null)
  const videoRef = useRef(null)
  const roseRef = useRef(null)
  const reducedMotion = useReducedMotion()
  const allowFilm = useDeferredFilm(reducedMotion)
  useScrollDirection(storyRef, videoRef, roseRef, config, allowFilm, reducedMotion)

  if (!config) return null

  return (
    <div className={`cw-story cw-story--${config.theme}`} data-plan-motion={config.planMotion || 'arc'} data-rose-journey={config.roseJourney?.kind} ref={storyRef}>
      <StoryFilm config={config} videoRef={videoRef} roseRef={roseRef} allowFilm={allowFilm} />
      <div className="cw-story__content">
        <Hero config={config} />
        <InvitationNote config={config} />
        <EventRevealMoment config={config} family="cinematic" />
        <StoryMap config={config} />
        <DayPlan config={config} />
        <VibeList config={config} />
        <RSVP config={config} />
        <Footer config={config} />
      </div>
      {showMusicControl && <AutoplayMusicControl music={config.music} />}
    </div>
  )
}
