import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { submitRsvp } from '../utils/submitRsvp.js'
import '../sande-signature-story.css'

const FALLBACK_DATE = '2027-10-16T15:00:00+03:00'
const FALLBACK_VENUE = 'The Acacia Garden, Nairobi'

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h13M14 7l5 5-5 5" />
    </svg>
  )
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m10 6-6 6 6 6M5 12h15" />
    </svg>
  )
}

function MusicIcon({ playing }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 17.5V6.8l9-2v10.1" />
      <circle cx="6.7" cy="17.5" r="2.7" />
      <circle cx="15.7" cy="14.9" r="2.7" />
      {playing && <path className="ss-music-pulse" d="M21 8.4c1 1 1 2.4 0 3.4M22.8 6.1c2.3 2.4 2.3 5.9 0 8.2" />}
    </svg>
  )
}

function WeaveMark({ compact = false }) {
  return (
    <svg className={compact ? 'ss-weave-mark ss-weave-mark--compact' : 'ss-weave-mark'} viewBox="0 0 186 64" aria-hidden="true">
      <path d="m4 32 22-22 22 22 22-22 23 22 22-22 22 22 23-22 22 22" />
      <path d="m4 32 22 22 22-22 22 22 23-22 22 22 22-22 23 22 22-22" />
      <circle cx="93" cy="32" r="6" />
    </svg>
  )
}

function AbstractPortrait({ person, side }) {
  const isLeft = side === 'left'

  return (
    <figure className={`ss-portrait ss-portrait--${side}`}>
      <div className="ss-portrait__canvas" aria-hidden="true">
        <svg viewBox="0 0 520 650" role="img">
          <title>An abstract portrait of {person}</title>
          <rect className="ss-portrait__ground" width="520" height="650" rx="210" />
          <path className="ss-portrait__sun" d={isLeft ? 'M-18 80h240v240H-18z' : 'M298 48h250v250H298z'} />
          <path
            className="ss-portrait__shoulders"
            d={isLeft
              ? 'M66 650c5-154 75-232 193-232 122 0 191 78 195 232H66Z'
              : 'M47 650c6-154 75-232 194-232 121 0 190 78 194 232H47Z'}
          />
          <path
            className="ss-portrait__neck"
            d={isLeft ? 'M208 358h100v115H208z' : 'M190 351h101v122H190z'}
          />
          <ellipse className="ss-portrait__face" cx={isLeft ? 258 : 241} cy="280" rx="103" ry="132" />
          <path
            className="ss-portrait__hair"
            d={isLeft
              ? 'M151 288c-3-107 33-170 110-174 89-4 129 70 103 184-23-84-80-110-170-78-7 31-21 54-43 68Z'
              : 'M139 289c0-117 48-178 115-175 81 3 122 76 92 192-18-79-70-119-154-92-7 36-24 61-53 75Z'}
          />
          <path className="ss-portrait__profile" d={isLeft ? 'M207 294c19 15 47 17 73 5M236 345c18 9 37 9 55 0' : 'M194 295c22 14 48 15 74 3M220 344c18 10 37 10 55 0'} />
          <path className="ss-portrait__fabric" d="M83 590 223 445l60 72 63-72 91 126M120 650l149-151 143 151M58 622h401" />
          <path className="ss-portrait__thread" d="m105 74 35 35 35-35 35 35 35-35M318 548l31 31 31-31 31 31 31-31" />
        </svg>
        <span className="ss-portrait__initial">{person.charAt(0)}</span>
      </div>
      <figcaption>
        <span>Meet</span>
        <strong>{person}</strong>
        <p>{isLeft ? 'I keep the plan, the playlist and a backup charger.' : 'I say five minutes and mean a full Nairobi hour.'}</p>
      </figcaption>
    </figure>
  )
}

function getCountdown(targetDate) {
  const distance = Math.max(0, targetDate.getTime() - Date.now())
  return {
    days: Math.floor(distance / 86400000),
    hours: Math.floor((distance / 3600000) % 24),
    minutes: Math.floor((distance / 60000) % 60),
    seconds: Math.floor((distance / 1000) % 60),
  }
}

function FlipUnit({ value, label, wide = false }) {
  const displayValue = String(value).padStart(wide ? 3 : 2, '0')

  return (
    <div className="ss-flip-unit">
      <div className={`ss-flip-card${wide ? ' ss-flip-card--wide' : ''}`} aria-hidden="true">
        <span className="ss-flip-card__static">{displayValue}</span>
        <span key={displayValue} className="ss-flip-card__leaf" data-value={displayValue} />
      </div>
      <span className="ss-flip-unit__label">{label}</span>
      <span className="sr-only">{displayValue} {label}</span>
    </div>
  )
}

function Countdown({ date }) {
  const targetDate = useMemo(() => {
    const parsed = new Date(date || FALLBACK_DATE)
    return Number.isNaN(parsed.getTime()) ? new Date(FALLBACK_DATE) : parsed
  }, [date])
  const [remaining, setRemaining] = useState(() => getCountdown(targetDate))

  useEffect(() => {
    setRemaining(getCountdown(targetDate))
    const timer = window.setInterval(() => setRemaining(getCountdown(targetDate)), 1000)
    return () => window.clearInterval(timer)
  }, [targetDate])

  return (
    <div className="ss-countdown" role="timer" aria-live="off" aria-label="Time remaining until the wedding">
      <FlipUnit value={remaining.days} label="days" wide />
      <FlipUnit value={remaining.hours} label="hours" />
      <FlipUnit value={remaining.minutes} label="minutes" />
      <FlipUnit value={remaining.seconds} label="seconds" />
    </div>
  )
}

function RsvpForm({ design, first, second }) {
  const formId = useId()
  const successRef = useRef(null)
  const [attending, setAttending] = useState('')
  const [status, setStatus] = useState('idle')
  const [response, setResponse] = useState(null)

  useEffect(() => {
    if (status === 'success') successRef.current?.focus()
  }, [status])

  async function handleSubmit(event) {
    event.preventDefault()
    if (status === 'sending') return

    const form = event.currentTarget
    const data = new FormData(form)
    const fullName = String(data.get('name') || '').trim()
    if (!fullName) return

    setStatus('sending')
    try {
      const result = await submitRsvp(form, design?.name, {
        name: fullName,
        templateId: design?.slug,
        eventType: design?.eventType || 'Wedding',
      })
      setResponse({
        firstName: fullName.split(/\s+/)[0],
        attending: data.get('attendance') === 'yes',
        demo: result.demo,
      })
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success' && response) {
    return (
      <div className="ss-rsvp-success" role="status" aria-live="polite" ref={successRef} tabIndex={-1}>
        <span aria-hidden="true">✓</span>
        <h3>
          {response.demo
            ? `Preview complete, ${response.firstName}.`
            : response.attending
              ? `You’re on the list, ${response.firstName}.`
              : `We’ll miss you, ${response.firstName}.`}
        </h3>
        <p>
          {response.demo
            ? 'This was a demo response and was not sent.'
            : response.attending
              ? 'Your RSVP was sent. Bring your best shoes — we have plans for the dance floor.'
              : `Your reply was sent. ${first} and ${second} will save you a slice in spirit.`}
        </p>
        <button type="button" onClick={() => { setResponse(null); setStatus('idle') }}>Change response</button>
      </div>
    )
  }

  return (
    <form className="ss-rsvp-form" onSubmit={handleSubmit} aria-busy={status === 'sending'}>
      <label className="ss-rsvp-field" htmlFor={`${formId}-name`}>
        <span>Your name</span>
        <input id={`${formId}-name`} name="name" type="text" autoComplete="name" placeholder="First and last name" required />
      </label>

      <fieldset className="ss-rsvp-attendance">
        <legend>Will you be there?</legend>
        <label className={attending === 'yes' ? 'is-selected' : ''}>
          <input type="radio" name="attendance" value="yes" checked={attending === 'yes'} onChange={() => setAttending('yes')} required />
          <span>Absolutely</span>
        </label>
        <label className={attending === 'no' ? 'is-selected' : ''}>
          <input type="radio" name="attendance" value="no" checked={attending === 'no'} onChange={() => setAttending('no')} required />
          <span>Can’t make it</span>
        </label>
      </fieldset>

      {attending === 'yes' && (
        <>
          <label className="ss-rsvp-field" htmlFor={`${formId}-party-size`}>
            <span>Seats needed <small>(including you)</small></span>
            <select id={`${formId}-party-size`} name="partySize" defaultValue="1" required>
              <option value="1">1 — Just me</option>
              <option value="2">2 guests</option>
              <option value="3">3 guests</option>
              <option value="4">4 guests</option>
              <option value="5">5 guests</option>
              <option value="6+">6 or more</option>
            </select>
          </label>
          <label className="ss-rsvp-field" htmlFor={`${formId}-song`}>
            <span>Song request <small>(optional)</small></span>
            <input id={`${formId}-song`} name="song" placeholder="One dance-floor favourite" />
          </label>
          <label className="ss-rsvp-field ss-rsvp-field--wide" htmlFor={`${formId}-requirements`}>
            <span>Anything we should plan for? <small>(optional)</small></span>
            <textarea
              id={`${formId}-requirements`}
              name="requirements"
              rows="3"
              placeholder="Guest names, children’s ages, dietary or accessibility needs"
            />
          </label>
        </>
      )}

      {attending === 'no' && (
        <label className="ss-rsvp-field ss-rsvp-field--wide" htmlFor={`${formId}-message`}>
          <span>Leave a note <small>(optional)</small></span>
          <textarea id={`${formId}-message`} name="message" rows="3" placeholder="Send a little love from afar" />
        </label>
      )}

      {status === 'error' && (
        <p className="ss-rsvp-error" role="alert">Your RSVP could not be sent. Check your connection and try again.</p>
      )}
      <button className="ss-rsvp-submit" type="submit" disabled={status === 'sending'}>
        <span>{status === 'sending' ? 'Sending RSVP…' : 'Send RSVP'}</span>
        <ArrowIcon />
      </button>
    </form>
  )
}

export default function SandeSignatureStory({
  design,
  onBack,
  onUseDesign,
  isMusicPlaying = false,
  onToggleMusic,
}) {
  const rootRef = useRef(null)
  const [first = 'Zuri', second = 'Kito'] = design?.couple || []
  const eventDate = useMemo(() => {
    const parsed = new Date(design?.eventDate || FALLBACK_DATE)
    return Number.isNaN(parsed.getTime()) ? new Date(FALLBACK_DATE) : parsed
  }, [design?.eventDate])
  const eventDateValue = eventDate.toISOString()
  const venue = design?.venue || FALLBACK_VENUE
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue)}`
  const formattedDate = useMemo(() => new Intl.DateTimeFormat('en-KE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(eventDate), [eventDate])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined

    root.focus({ preventScroll: true })

    const targets = [...root.querySelectorAll('[data-ss-reveal]')]
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    root.classList.add('ss-reveal-ready')

    if (reducedMotion || !('IntersectionObserver' in window)) {
      targets.forEach((target) => target.classList.add('is-visible'))
      return undefined
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' })

    targets.forEach((target) => observer.observe(target))

    let frame = 0
    const updateParallax = () => {
      frame = 0
      const offset = Math.max(-96, Math.min(96, -root.getBoundingClientRect().top * 0.045))
      root.style.setProperty('--ss-parallax-near', `${offset}px`)
      root.style.setProperty('--ss-parallax-far', `${offset * -0.42}px`)
    }
    const handleScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateParallax)
    }

    updateParallax()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', handleScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <main id="main-content" ref={rootRef} className="ss-story" tabIndex={-1}>
      <nav className="ss-floating-nav" aria-label="Invitation preview controls">
        <button className="ss-round-action ss-round-action--back" type="button" onClick={onBack}>
          <BackIcon />
          <span>Designs</span>
        </button>
        <span className="ss-floating-nav__signature" aria-label={`${first} and ${second}`}>
          {first.charAt(0)} + {second.charAt(0)}
        </span>
        <button className="ss-round-action ss-round-action--use" type="button" onClick={() => onUseDesign?.(design)}>
          <span>Use this design</span>
          <ArrowIcon />
        </button>
      </nav>

      <button
        className={`ss-music-button${isMusicPlaying ? ' is-playing' : ''}`}
        type="button"
        onClick={onToggleMusic}
        disabled={!onToggleMusic}
        aria-pressed={isMusicPlaying}
        aria-label={isMusicPlaying ? 'Pause invitation music' : 'Play invitation music'}
      >
        <MusicIcon playing={isMusicPlaying} />
        <span>{isMusicPlaying ? 'Playing' : 'Music'}</span>
      </button>

      <header className="ss-hero">
        <div className="ss-hero__halo ss-parallax-far" aria-hidden="true" />
        <div className="ss-hero__orbit ss-parallax-near" aria-hidden="true" />
        <div className="ss-hero__grain" aria-hidden="true" />
        <div className="ss-hero__photos" aria-hidden="true">
          <figure className="ss-hero-photo ss-hero-photo--top-left">
            <img
              src="/images/wedding-couple.webp"
              alt=""
              width="1067"
              height="1600"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              draggable="false"
            />
          </figure>
          <figure className="ss-hero-photo ss-hero-photo--bottom-right">
            <img
              src="/images/wedding-celebration.webp"
              alt=""
              width="1600"
              height="1067"
              loading="eager"
              decoding="async"
              draggable="false"
            />
          </figure>
        </div>
        <div className="ss-hero__content">
          <WeaveMark />
          <p className="ss-kicker">We have some news from Nairobi</p>
          <h1>
            <span>{first}</span>
            <i>&amp;</i>
            <span>{second}</span>
          </h1>
          <p className="ss-hero__announcement">we’re getting married</p>
          <div className="ss-hero__details">
            <time dateTime={eventDateValue}>{formattedDate}</time>
            <span>{venue}</span>
          </div>
        </div>
        <a className="ss-scroll-cue" href="#meet-the-two">
          <span>Come in</span>
          <i aria-hidden="true" />
        </a>
      </header>

      <section id="meet-the-two" className="ss-meet ss-paper-section">
        <div className="ss-section-heading" data-ss-reveal>
          <p className="ss-kicker">The two of us</p>
          <h2>This is us.<br />One very good plan.</h2>
        </div>
        <div className="ss-meet__grid">
          <div data-ss-reveal><AbstractPortrait person={first} side="left" /></div>
          <div data-ss-reveal><AbstractPortrait person={second} side="right" /></div>
        </div>
      </section>

      <section className="ss-how-we-met">
        <div className="ss-how-we-met__pattern ss-parallax-far" aria-hidden="true"><WeaveMark /></div>
        <div className="ss-how-we-met__copy" data-ss-reveal>
          <p className="ss-kicker">How we met</p>
          <h2>We started with 3% battery.</h2>
          <p>We met when {second} borrowed {first}’s charger at a rooftop party. It came back three days later with coffee and a wildly unconvincing excuse. The charger survived. We did better.</p>
          <span>Our first coffee lasted four hours.</span>
        </div>
      </section>

      <section className="ss-date-section ss-paper-section">
        <div className="ss-date-section__intro" data-ss-reveal>
          <p className="ss-kicker">Keep the date</p>
          <h2>{formattedDate}</h2>
          <p>We’ll handle the food. You handle the dance moves.</p>
        </div>
        <div data-ss-reveal>
          <Countdown date={eventDateValue} />
        </div>
      </section>

      <section className="ss-location">
        <div className="ss-location__map" data-ss-reveal>
          <img
            src="/images/acacia-garden-map.webp"
            alt={`Street map around ${venue}`}
            width="1280"
            height="1024"
            loading="lazy"
            decoding="async"
          />
          <span className="ss-location__pin" aria-hidden="true">
            <i />
            <b>Acacia Garden</b>
          </span>
          <a
            className="ss-location__attribution"
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
          >
            © OpenStreetMap contributors
          </a>
        </div>
        <div className="ss-location__details" data-ss-reveal>
          <p className="ss-kicker">Meet us here</p>
          <h2>{venue}</h2>
          <p>We’ll be there from 2:00 PM. We say our vows at 3:00 PM, then feed you properly and keep the dance floor open late.</p>
          <a href={mapUrl} target="_blank" rel="noreferrer">
            <span>Open in Maps</span>
            <ArrowIcon />
          </a>
        </div>
      </section>

      <section className="ss-journey ss-paper-section">
        <div className="ss-section-heading" data-ss-reveal>
          <p className="ss-kicker">Our route here</p>
          <h2>Three turns worth keeping.</h2>
        </div>
        <div className="ss-journey__track" data-ss-reveal>
          <article>
            <span>Late 2023</span>
            <h3>The rooftop</h3>
            <p>One borrowed charger, two long coffees.</p>
          </article>
          <article>
            <span>Easter 2025</span>
            <h3>The wrong turn</h3>
            <p>Naivasha was not the plan. It became the best weekend.</p>
          </article>
          <article>
            <span>Right now</span>
            <h3>The good bit</h3>
            <p>All our favourite people, in one place.</p>
          </article>
        </div>
      </section>

      <section className="ss-rsvp">
        <div className="ss-rsvp__intro" data-ss-reveal>
          <WeaveMark compact />
          <p className="ss-kicker">Save us a seat count</p>
          <h2>Are you coming?</h2>
          <p>Tell us by 20 September. We promise not to guess the catering numbers.</p>
        </div>
        <div className="ss-rsvp__card" data-ss-reveal>
          <RsvpForm design={design} first={first} second={second} />
        </div>
      </section>

      <footer className="ss-footer">
        <p>We love you all.</p>
        <span>With love, {first} &amp; {second}</span>
      </footer>
    </main>
  )
}
