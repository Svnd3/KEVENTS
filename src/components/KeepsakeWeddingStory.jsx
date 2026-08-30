import { useEffect, useId, useRef, useState } from 'react'
import { submitRsvp } from '../utils/submitRsvp.js'
import '../keepsake-wedding-story.css'

const WEDDING_START = new Date('2027-09-18T16:00:00+03:00')
const RSVP_DEADLINE = '1 August 2027'
const DIRECTIONS_URL = 'https://www.google.com/maps/search/?api=1&query=Diani+Beach+Kenya'

const weekendEvents = [
  {
    day: 'Friday',
    time: '5:30 PM',
    title: 'Golden-hour hello',
    note: 'Barefoot drinks and something small from the grill.',
  },
  {
    day: 'Saturday',
    time: '4:00 PM',
    title: 'The ceremony',
    note: 'Please find your seat by 3:45 PM. Supper follows.',
  },
  {
    day: 'Sunday',
    time: '10:30 AM',
    title: 'One last sea view',
    note: 'Coffee, fruit, and a slow goodbye by the water.',
  },
]

const faqItems = [
  ['Can I bring a guest?', 'Your invitation will note the seats reserved for your household. If anything looks off, please send us a message.'],
  ['Are children invited?', 'We love your little ones. The Saturday reception is an adults-only evening, while Friday and Sunday are family-friendly.'],
  ['What should I wear?', 'Coastal formal: light tailoring, soft colour, and shoes that are happy on lawn and sand.'],
  ['Where should I stay?', 'We have held rooms at The Tide House and two nearby guesthouses. Mention “Amara & Theo” when booking.'],
]

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h13M14 7l5 5-5 5" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 7.5h14v12H5zM8 4v6M16 4v6M5 11h14" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2" />
    </svg>
  )
}

function MusicIcon({ playing }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 18V7l9-2v10" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="15.5" cy="15" r="2.5" />
      {playing && <path className="kw-icon-wave" d="M21 7c1.6 1.5 1.6 4.5 0 6" />}
    </svg>
  )
}

function ReplyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6.5h16v11H4zM4 7l8 6 8-6" />
    </svg>
  )
}

function WaveMark() {
  return (
    <svg className="kw-wave-mark" viewBox="0 0 240 54" aria-hidden="true">
      <path d="M1 27c20-19 40-19 60 0s40 19 60 0 40-19 60 0 40 19 60 0" />
      <path d="M1 39c20-19 40-19 60 0s40 19 60 0 40-19 60 0 40 19 60 0" />
    </svg>
  )
}

function RouteSketch() {
  return (
    <svg className="kw-route" viewBox="0 0 520 270" aria-hidden="true">
      <path className="kw-route__coast" d="M382-12c-56 47-54 98-10 139 42 40 36 97-18 155" />
      <path className="kw-route__road" d="M61 221c67-18 72-73 137-82 70-10 86 45 151 16 30-14 48-41 61-79" />
      <circle cx="61" cy="221" r="7" />
      <circle cx="410" cy="76" r="9" />
      <path className="kw-route__plane" d="m190 124 34-24-12 40-9-11-13-5Z" />
      <text x="38" y="251">MOMBASA</text>
      <text x="377" y="51">DIANI</text>
    </svg>
  )
}

function getCountdown() {
  const remaining = Math.max(0, WEDDING_START.getTime() - Date.now())
  const minutes = Math.floor(remaining / 60000)
  return {
    days: Math.floor(minutes / 1440),
    hours: Math.floor((minutes % 1440) / 60),
    minutes: minutes % 60,
  }
}

function scrollToInvitationSection(id) {
  const target = document.getElementById(id)
  if (!target) return
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  window.requestAnimationFrame(() => {
    const focusTarget = target.querySelector('[data-scroll-focus]') || target
    focusTarget.focus({ preventScroll: true })
  })
}

function downloadCalendar() {
  const calendar = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tell & Wed//A Letter from the Tide//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    'UID:amara-theo-20270918@tellandwed.com',
    'DTSTAMP:20260830T090000Z',
    'DTSTART:20270918T130000Z',
    'DTEND:20270918T210000Z',
    'SUMMARY:Amara & Theo’s Wedding',
    'LOCATION:The Tide House\\, Diani Beach\\, Kenya',
    'DESCRIPTION:Ceremony at 4:00 PM. Dinner and dancing follow.',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([calendar], { type: 'text/calendar;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'amara-and-theo-wedding.ics'
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

function Countdown() {
  const [remaining, setRemaining] = useState(getCountdown)

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(getCountdown()), 60000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div
      className="kw-countdown"
      aria-label={`${remaining.days} days, ${remaining.hours} hours, and ${remaining.minutes} minutes until the wedding`}
    >
      {Object.entries(remaining).map(([label, value]) => (
        <span key={label} aria-hidden="true">
          <strong>{String(value).padStart(2, '0')}</strong>
          <small>{label}</small>
        </span>
      ))}
    </div>
  )
}

function RsvpCard({ design, onSuccess }) {
  const fieldPrefix = useId()
  const resultRef = useRef(null)
  const [attendance, setAttendance] = useState('')
  const [guestName, setGuestName] = useState('')
  const [status, setStatus] = useState('idle')
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    if (status === 'success' || status === 'error') resultRef.current?.focus()
  }, [status])

  const submit = async (event) => {
    event.preventDefault()
    if (status === 'sending') return

    const form = event.currentTarget
    if (form.elements.website.value) {
      setStatus('success')
      return
    }

    setStatus('sending')
    try {
      const payload = new FormData(form)
      const requirements = [
        payload.get('guestNames') && `Party: ${payload.get('guestNames')}`,
        payload.get('dietaryNotes') && `Dietary: ${payload.get('dietaryNotes')}`,
        payload.get('accessibilityNeeds') && `Accessibility: ${payload.get('accessibilityNeeds')}`,
      ].filter(Boolean).join('\n')
      const response = await submitRsvp(form, design.name, {
        templateId: design.slug,
        eventDate: '2027-09-18',
        price: design.price,
        requirements,
      })
      setIsDemo(Boolean(response.demo))
      setStatus('success')
      onSuccess?.()
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="kw-rsvp-success" ref={resultRef} tabIndex={-1} role="status">
        <span className="kw-rsvp-success__postmark" aria-hidden="true">RECEIVED<br />DIANI · 2027</span>
        <p className="kw-label">Reply received</p>
        <h3>{attendance === 'no' ? 'Thank you for letting us know.' : `You’re on the list${guestName.trim() ? `, ${guestName.trim().split(' ')[0]}` : ''}.`}</h3>
        <p>
          {attendance === 'no'
            ? 'We’ll miss you and are grateful you replied.'
            : 'We cannot wait to celebrate with you by the sea.'}
        </p>
        {isDemo && <small>This is a preview confirmation. Connect the RSVP endpoint to collect live replies.</small>}
        <button className="kw-button kw-button--ink" type="button" onClick={downloadCalendar}>
          <CalendarIcon /> Add the weekend to your calendar
        </button>
      </div>
    )
  }

  return (
    <form className="kw-rsvp-form" onSubmit={submit}>
      <div className="kw-form-grid">
        <label className="kw-field">
          <span>Your name</span>
          <input name="name" value={guestName} onChange={(event) => setGuestName(event.target.value)} autoComplete="name" required />
        </label>
        <label className="kw-field">
          <span>Email</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>
      </div>

      <fieldset className="kw-attendance">
        <legend>Will you be joining us?</legend>
        <label>
          <input type="radio" name="attendance" value="yes" checked={attendance === 'yes'} onChange={() => setAttendance('yes')} required />
          <span><b>Joyfully accepts</b><small>Save me a seat by the sea</small></span>
        </label>
        <label>
          <input type="radio" name="attendance" value="no" checked={attendance === 'no'} onChange={() => setAttendance('no')} required />
          <span><b>Regretfully declines</b><small>Celebrating you from afar</small></span>
        </label>
      </fieldset>

      {attendance === 'yes' && (
        <div className="kw-form-conditional">
          <label className="kw-field kw-field--full">
            <span>Names in your party</span>
            <textarea name="guestNames" rows="2" placeholder="Exactly as you’d like them on the place cards" />
          </label>

          <fieldset className="kw-event-picks">
            <legend>Which moments should we expect you at?</legend>
            {weekendEvents.map((item) => (
              <label key={item.day}>
                <input type="checkbox" name="eventSelections" value={`${item.day}: ${item.title}`} defaultChecked={item.day === 'Saturday'} />
                <span>{item.day}<small>{item.title}</small></span>
              </label>
            ))}
          </fieldset>

          <div className="kw-form-grid">
            <label className="kw-field">
              <span>Party size</span>
              <select name="partySize" defaultValue="" required>
                <option value="" disabled>Select total guests</option>
                <option value="1">1 guest</option>
                <option value="2">2 guests</option>
                <option value="3">3 guests</option>
                <option value="4">4 guests</option>
                <option value="5">5 guests</option>
                <option value="6">6 guests</option>
              </select>
            </label>
            <label className="kw-field">
              <span>Shuttle seats</span>
              <select name="shuttleSeats" defaultValue="0">
                <option value="0">None needed</option>
                <option value="1">1 seat</option>
                <option value="2">2 seats</option>
                <option value="3">3 seats</option>
                <option value="4">4 seats</option>
              </select>
            </label>
          </div>

          <label className="kw-field kw-field--full">
            <span>Dietary notes</span>
            <input name="dietaryNotes" placeholder="Allergies or preferences" />
          </label>
          <label className="kw-field kw-field--full">
            <span>Accessibility needs</span>
            <input name="accessibilityNeeds" placeholder="Anything that will make the weekend easier" />
          </label>
          <label className="kw-field kw-field--full">
            <span>A song for the dance floor</span>
            <input name="song" placeholder="Artist — song" />
          </label>
        </div>
      )}

      {attendance === 'no' && (
        <label className="kw-field kw-field--full">
          <span>Leave us a note <small>(optional)</small></span>
          <textarea name="message" rows="4" placeholder="We’ll read every word" />
        </label>
      )}

      <label className="kw-honeypot" htmlFor={`${fieldPrefix}-website`} aria-hidden="true">
        Website
        <input id={`${fieldPrefix}-website`} name="website" tabIndex={-1} autoComplete="off" />
      </label>

      {status === 'error' && (
        <p className="kw-form-error" ref={resultRef} tabIndex={-1} role="alert">
          Your reply didn’t go through, but nothing you entered has been lost. Please try again.
        </p>
      )}

      <div className="kw-form-submit">
        <p>One response per household. Your details are used only for this celebration.</p>
        <button className="kw-button kw-button--ink" type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending your reply…' : 'Send our reply'} <ArrowIcon />
        </button>
      </div>
    </form>
  )
}

export default function KeepsakeWeddingStory({ design, isMusicPlaying, onToggleMusic }) {
  const [storyOpen, setStoryOpen] = useState(false)
  const [replyReceived, setReplyReceived] = useState(false)
  const [first = 'Amara', second = 'Theo'] = design?.couple || []

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      document.getElementById('main-content')?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  return (
    <article className="kw" style={{ '--kw-ivory': design.palette?.[0], '--kw-ink': design.palette?.[1], '--kw-gold': design.palette?.[2], '--kw-coral': design.palette?.[3] }}>
      <section className="kw-hero" aria-labelledby="kw-title">
        <div className="kw-hero__topline">
          <span>A private invitation</span>
          <span>Diani · Kenya</span>
          <span>Est. 18.09.27</span>
        </div>

        <div className="kw-hero__stage">
          <figure className="kw-polaroid kw-polaroid--couple" aria-label="Amara and Theo on the coast">
            <img src="/images/wedding-couple.webp" alt="A newlywed couple standing together by the sea" width="1200" height="800" fetchPriority="high" />
            <figcaption>the coast, lately <span>♡</span></figcaption>
          </figure>

          <article className="kw-invitation-card">
            <span className="kw-card-corners" aria-hidden="true" />
            <p>With full hearts and the blessing of our families</p>
            <h1 id="kw-title"><span>{first}</span><i>&amp;</i><span>{second}</span></h1>
            <p>invite you to share in the day we begin our marriage</p>
            <div className="kw-invitation-card__date">
              <span>Saturday</span><strong>18</strong><span>September · 2027</span>
            </div>
            <p className="kw-invitation-card__place">The Tide House · Diani Coast</p>
          </article>

          <button
            className={`kw-record${isMusicPlaying ? ' is-playing' : ''}`}
            type="button"
            onClick={onToggleMusic}
            aria-pressed={isMusicPlaying}
            aria-label={`${isMusicPlaying ? 'Pause' : 'Play'} Coming Home by Sauti Sol`}
          >
            <span className="kw-record__disc" aria-hidden="true">
              <span>OUR SONG<small>{isMusicPlaying ? 'NOW PLAYING' : 'CLICK TO PLAY'}</small></span>
            </span>
          </button>

          <button className={`kw-story-photo${storyOpen ? ' is-open' : ''}`} type="button" onClick={() => setStoryOpen((open) => !open)} aria-expanded={storyOpen} aria-controls="kw-story-note">
            <span className="kw-story-photo__image">
              <img src="/images/wedding-dance.webp" alt="The couple sharing a quiet moment in evening light" width="1200" height="800" />
            </span>
            <span className="kw-story-photo__label">Our story <small>{storyOpen ? 'close note' : 'lift to read'}</small></span>
          </button>

          <aside id="kw-story-note" className={`kw-story-note${storyOpen ? ' is-open' : ''}`} aria-hidden={!storyOpen}>
            <span className="kw-story-note__tape" aria-hidden="true" />
            <p>We met on a Tuesday neither of us had planned particularly well. Coffee became dinner—and the room disappeared around us.</p>
            <button type="button" onClick={() => scrollToInvitationSection('our-story')}>Read the longer version <ArrowIcon /></button>
          </aside>

          <div className="kw-postmark" aria-hidden="true">
            <span>A<span>&amp;</span>T</span>
            <small>Diani · 2027</small>
          </div>

          <img className="kw-hero__botanical" src="/images/botanical-wattle-fiveash.webp" alt="" width="731" height="1024" />
        </div>

        <div className="kw-hero__after">
          <p>Until we meet by the sea</p>
          <Countdown />
          <button type="button" onClick={() => scrollToInvitationSection('our-story')}>Open the keepsake <ArrowIcon /></button>
        </div>
      </section>

      <section id="our-story" className="kw-section kw-letter" aria-labelledby="kw-story-heading" data-invite-reveal>
        <div className="kw-section-heading">
          <p className="kw-label">No. 01 · The letter</p>
          <h2 id="kw-story-heading" tabIndex={-1} data-scroll-focus>A little story,<br /><em>before the big day.</em></h2>
        </div>

        <div className="kw-letter__layout">
          <div className="kw-letter__copy">
            <p className="kw-letter__salutation">Dear friends &amp; family,</p>
            <p>We met on a Tuesday neither of us had planned particularly well. Coffee became dinner, and dinner became the kind of conversation that makes the room disappear.</p>
            <p>Since then: three homes, countless Sunday walks, and a thousand small reasons to choose each other. We would love for you to be there when we make that choice out loud.</p>
            <p>The true story is longer, funnier, and best told over dinner.</p>
            <p className="kw-letter__signoff">With love,<br /><span>{first} &amp; {second}</span></p>
          </div>

          <div className="kw-photo-stack" aria-label="A few frames from our story">
            <figure>
              <img src="/images/wedding-celebration.webp" alt="A couple walking together on a dramatic beach" width="1200" height="800" loading="lazy" />
              <figcaption>Somewhere between then and forever</figcaption>
            </figure>
            <figure>
              <img src="/images/wedding-field.webp" alt="A couple celebrating beneath a bright sky" width="1200" height="800" loading="lazy" />
              <figcaption>The easiest yes</figcaption>
            </figure>
            <span className="kw-photo-stack__date">03 · 11 · 26</span>
          </div>
        </div>
      </section>

      <section id="details" className="kw-section kw-weekend" data-invite-reveal>
        <div className="kw-section-heading kw-section-heading--center">
          <p className="kw-label">No. 02 · The weekend</p>
          <h2>Three days.<br /><em>One very good reason.</em></h2>
          <p>Come for the vows. Stay for the late-night stories and Sunday coffee.</p>
        </div>

        <div className="kw-itinerary">
          {weekendEvents.map((item, index) => (
            <article key={item.day} className="kw-itinerary-card">
              <span className="kw-itinerary-card__number">0{index + 1}</span>
              <p>{item.day}</p>
              <time>{item.time}</time>
              <h3>{item.title}</h3>
              <span>{item.note}</span>
            </article>
          ))}
        </div>

        <aside className="kw-dress-note">
          <div>
            <p className="kw-label">A note on dress</p>
            <h3>Coastal formal,<br />comfort encouraged.</h3>
          </div>
          <p>Light fabrics, block heels or flats will be happiest here. The palette is inspiration, not instruction.</p>
          <div className="kw-swatches" aria-label="Suggested palette: sea glass, butter, shell, coral, and espresso">
            <span title="Sea glass" /><span title="Butter" /><span title="Shell" /><span title="Faded coral" /><span title="Espresso" />
          </div>
        </aside>
      </section>

      <section id="travel" className="kw-section kw-travel" data-invite-reveal>
        <div className="kw-travel__postcard">
          <div className="kw-travel__image">
            <img src="/images/venue-hotel-pool.webp" alt="A quiet coastal hotel overlooking a swimming pool" width="1200" height="800" loading="lazy" />
            <span>Wish you were here</span>
          </div>
          <div className="kw-travel__address">
            <p className="kw-label">No. 03 · Meet us here</p>
            <h2>The Tide House</h2>
            <p>Diani Beach Road<br />Kwale County, Kenya</p>
            <dl>
              <div><dt>From Ukunda</dt><dd>12 minutes</dd></div>
              <div><dt>From Mombasa</dt><dd>1 hr 35 min</dd></div>
              <div><dt>Saturday shuttle</dt><dd>2:45 &amp; 3:15 PM</dd></div>
            </dl>
            <div className="kw-button-row">
              <a className="kw-button kw-button--ink" href={DIRECTIONS_URL} target="_blank" rel="noreferrer"><PinIcon /> Get directions</a>
              <button className="kw-button kw-button--paper" type="button" onClick={downloadCalendar}><CalendarIcon /> Save the date</button>
            </div>
          </div>
          <RouteSketch />
        </div>

        <div className="kw-travel-notes">
          <article><span>01</span><h3>Getting there</h3><p>Fly into Ukunda for the shortest ride, or make a road trip of it from Mombasa. We’ll coordinate shared transfers.</p></article>
          <article><span>02</span><h3>Staying close</h3><p>Our room block runs Friday through Monday. Quote “Amara &amp; Theo” when contacting the hotel.</p></article>
          <article><span>03</span><h3>Pack kindly</h3><p>September is warm and breezy. Bring sun protection and a light layer for the evening terrace.</p></article>
        </div>
      </section>

      <section className="kw-section kw-faq" data-invite-reveal>
        <div className="kw-section-heading">
          <p className="kw-label">The useful bits</p>
          <h2>Before you<br /><em>pack your bags.</em></h2>
        </div>
        <div className="kw-faq__items">
          {faqItems.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}<span aria-hidden="true">+</span></summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="rsvp" className="kw-section kw-rsvp" aria-labelledby="kw-rsvp-heading" data-invite-reveal>
        <div className="kw-rsvp__intro">
          <p className="kw-label">No. 04 · The reply card</p>
          <h2 id="kw-rsvp-heading" tabIndex={-1} data-scroll-focus>Will we see you<br /><em>by the sea?</em></h2>
          <p>Please reply by {RSVP_DEADLINE}.<br />One response per household.</p>
          <WaveMark />
        </div>
        <RsvpCard design={design} onSuccess={() => setReplyReceived(true)} />
      </section>

      <footer className="kw-footer">
        <div className="kw-footer__monogram">A<span>&amp;</span>T</div>
        <p>Thank you for being part of our story.</p>
        <small>Diani · Kenya · 18 September 2027</small>
      </footer>

      <nav className="kw-dock" aria-label="Invitation shortcuts">
        <button type="button" onClick={onToggleMusic} aria-pressed={isMusicPlaying}>
          <MusicIcon playing={isMusicPlaying} /><span>{isMusicPlaying ? 'Pause' : 'Our song'}</span>
        </button>
        <button type="button" onClick={downloadCalendar}>
          <CalendarIcon /><span>Date</span>
        </button>
        <a href={DIRECTIONS_URL} target="_blank" rel="noreferrer">
          <PinIcon /><span>Map</span>
        </a>
        <button className={replyReceived ? 'is-complete' : ''} type="button" onClick={() => scrollToInvitationSection('rsvp')}>
          <ReplyIcon /><span>{replyReceived ? 'Received' : 'RSVP'}</span>
        </button>
      </nav>
    </article>
  )
}
