import { useEffect, useId, useRef, useState } from 'react'
import { getExperienceRecipe } from '../data/experienceRecipes.js'
import { submitRsvp } from '../utils/submitRsvp.js'
import '../invitation-story.css'

const venueByCategory = {
  African: 'The Acacia Garden, Nairobi',
  Modern: 'The Glasshouse, Nairobi',
  Cultural: 'The Courtyard, Nairobi',
  Editorial: 'The Conservatory, Nairobi',
  Destination: 'The Ocean House, Diani',
  Floral: 'The Botanical Garden, Nairobi',
  Minimal: 'The Atrium, Nairobi',
  Cinematic: 'The Grand Hall, Nairobi',
}

const destinationVenue = {
  ocean: 'The Ocean House, Diani',
  aegean: 'The Blue House, Santorini',
  vineyard: 'The Vineyard Estate, Limuru',
  stars: 'Mara River Camp, Maasai Mara',
  mist: 'The Lake House, Naivasha',
  spice: 'The Stone House, Zanzibar',
}

const venueBySlug = {
  'lamu-moon': 'The Moon House, Lamu',
  'swahili-nikah': 'The Stone Courtyard, Lamu',
  'cathedral-ivory': 'St. Mary’s Cathedral, Nairobi',
  'garden-in-motion': 'The Botanical Garden, Nairobi',
  'tuscan-hour': 'The Vineyard Estate, Limuru',
  muse: 'The Conservatory, Nairobi',
  'nairobi-noir': 'The Rooftop, Nairobi',
}

const archiveBySlug = {
  'lamu-moon': '/images/lamu-coast-chart-1827.webp',
  'swahili-nikah': '/images/lamu-coast-chart-1827.webp',
  'wildflower-press': '/images/botanical-wattle-fiveash.webp',
  'garden-in-motion': '/images/botanical-wattle-fiveash.webp',
  'society-pages': '/images/ornament-arabian-jones.webp',
}

const modeByCategory = {
  Editorial: 'editorial',
  Cultural: 'palace',
  Destination: 'travel',
  Floral: 'garden',
  Modern: 'kinetic',
  Cinematic: 'cinema',
  African: 'textile',
  Minimal: 'letterpress',
}

const modeBySlug = {
  'lamu-moon': 'travel',
  'swahili-nikah': 'travel',
  'cathedral-ivory': 'letterpress',
  'garden-in-motion': 'garden',
  'tuscan-hour': 'garden',
  muse: 'editorial',
  'nairobi-noir': 'cinema',
}

const celestialVariants = new Set(['cosmos', 'orbit', 'glow', 'stars', 'electric'])
const signatureTextileVariants = new Set(['weave', 'beads', 'tree', 'print'])

const storyProfiles = {
  sunset: ['horizon', 'panorama', 'rise', 'sand', 'landscape'],
  weave: ['loom', 'split', 'unfold', 'cobalt', 'framed'],
  arch: ['coast', 'portal', 'tide', 'moon', 'postcard'],
  beads: ['orbit', 'seal', 'radial', 'coral', 'round'],
  tree: ['botanical', 'rooted', 'grow', 'earth', 'specimen'],
  city: ['nocturne', 'poster', 'cut', 'ink', 'fullbleed'],
  print: ['loom', 'blocks', 'stagger', 'cobalt', 'cutout'],
  mountain: ['horizon', 'summit', 'rise', 'mist', 'landscape'],
  glass: ['construct', 'split', 'slide', 'glass', 'architectural'],
  electric: ['orbit', 'signal', 'radial', 'night', 'neon'],
  blocks: ['construct', 'blocks', 'stagger', 'primary', 'cutout'],
  orbit: ['orbit', 'offset', 'radial', 'silver', 'round'],
  glow: ['orbit', 'halo', 'bloom', 'peach', 'soft'],
  type: ['editorial', 'typewall', 'wipe', 'paper', 'portrait'],
  woven: ['loom', 'offset', 'unfold', 'forest', 'framed'],
  coastal: ['coast', 'portal', 'tide', 'shell', 'postcard'],
  mehndi: ['ceremony', 'courtyard', 'draw', 'henna', 'ornament'],
  textile: ['loom', 'column', 'unfold', 'wine', 'framed'],
  crossweave: ['loom', 'cross', 'stagger', 'gold', 'framed'],
  cathedral: ['ceremony', 'portal', 'draw', 'ivory', 'architectural'],
  magazine: ['editorial', 'cover', 'wipe', 'ivory', 'portrait'],
  newspaper: ['editorial', 'broadsheet', 'wipe', 'newsprint', 'monochrome'],
  editorial: ['editorial', 'spread', 'slide', 'paper', 'landscape'],
  couture: ['editorial', 'portfolio', 'wipe', 'blanc', 'portrait'],
  cover: ['editorial', 'coverline', 'cut', 'white', 'fullbleed'],
  society: ['editorial', 'column', 'slide', 'cream', 'ornament'],
  ocean: ['coast', 'postcard', 'tide', 'aqua', 'landscape'],
  aegean: ['coast', 'split', 'slide', 'blue', 'postcard'],
  vineyard: ['botanical', 'estate', 'grow', 'ochre', 'landscape'],
  stars: ['nocturne', 'horizon', 'radial', 'midnight', 'landscape'],
  mist: ['horizon', 'quiet', 'rise', 'mist', 'landscape'],
  spice: ['coast', 'stamp', 'stagger', 'terracotta', 'postcard'],
  peony: ['botanical', 'silk', 'bloom', 'blush', 'soft'],
  pressed: ['botanical', 'herbarium', 'draw', 'parchment', 'specimen'],
  orchid: ['nocturne', 'oval', 'bloom', 'black', 'portrait'],
  bougainvillea: ['botanical', 'border', 'stagger', 'pink', 'cutout'],
  protea: ['botanical', 'crown', 'grow', 'sage', 'specimen'],
  rose: ['botanical', 'letter', 'bloom', 'rose', 'soft'],
  line: ['stationery', 'hairline', 'draw', 'white', 'minimal'],
  bow: ['stationery', 'formal', 'unfold', 'blacktie', 'minimal'],
  serif: ['stationery', 'quiet', 'rise', 'cream', 'minimal'],
  monogram: ['stationery', 'seal', 'radial', 'blanc', 'round'],
  clay: ['construct', 'poster', 'cut', 'clay', 'cutout'],
  thread: ['stationery', 'thread', 'draw', 'silver', 'minimal'],
  dawn: ['film', 'panorama', 'rise', 'sunrise', 'fullbleed'],
  noir: ['film', 'letterbox', 'cut', 'black', 'monochrome'],
  cosmos: ['orbit', 'chart', 'radial', 'cosmos', 'round'],
  reel: ['film', 'filmstrip', 'wipe', 'sepia', 'fullbleed'],
  blooming: ['botanical', 'theatre', 'bloom', 'garden', 'portrait'],
  nightcity: ['film', 'offset', 'cut', 'cobalt', 'fullbleed'],
}

function getStoryProfile(design) {
  const [family = getMode(design), layout = 'classic', motion = 'rise', surface = 'paper', media = 'framed'] = storyProfiles[design.variant] || []
  const tags = new Set(design.tags || [])
  return {
    family,
    layout,
    motion,
    surface,
    media,
    compact: tags.has('Single Page'),
    photoLed: tags.has('Photo-Led'),
    multiEvent: tags.has('Multi-Event Suite'),
  }
}

const eventPlans = {
  editorial: [
    ['2:30 PM', 'Doors open', 'Welcome drinks in the conservatory'],
    ['3:30 PM', 'The ceremony', 'Please take your seat before the music begins'],
    ['5:30 PM', 'Dinner', 'Toasts first, then the dance floor'],
  ],
  palace: [
    ['Friday · 5:00 PM', 'Family welcome', 'Tea, introductions and an easy first evening'],
    ['Saturday · 2:00 PM', 'Wedding ceremony', 'The courtyard doors open at 1:30 PM'],
    ['Saturday · 6:00 PM', 'Dinner and dancing', 'Supper is served in the garden'],
  ],
  travel: [
    ['Friday evening', 'Arrive and settle in', 'Hotel check-in from 3:00 PM'],
    ['Saturday · 4:30 PM', 'Meet us by the water', 'The ceremony begins before sunset'],
    ['Sunday · 10:00 AM', 'Breakfast', 'One last meal before the journey home'],
  ],
  garden: [
    ['2:30 PM', 'Garden gates open', 'Cold drinks will be waiting'],
    ['3:30 PM', 'Vows beneath the trees', 'Please take your seat by 3:15 PM'],
    ['5:00 PM', 'Supper in the glasshouse', 'Dinner, speeches and plenty of dancing'],
  ],
  kinetic: [
    ['2:30', 'Arrive', 'Welcome drinks'],
    ['3:30', 'Vows', 'The main event'],
    ['5:00', 'Eat', 'Dinner and toasts'],
    ['8:00', 'Dance', 'Until late'],
  ],
  cinema: [
    ['Doors open', '2:30 PM', 'A drink before the ceremony'],
    ['The vows', '3:30 PM', 'Please be seated'],
    ['After dark', '6:00 PM', 'Dinner, speeches and dancing'],
  ],
  celestial: [
    ['Golden hour', '4:30 PM', 'Drinks as the sun goes down'],
    ['First stars', '5:30 PM', 'The ceremony begins'],
    ['Night sky', '7:00 PM', 'Dinner, toasts and dancing'],
  ],
  textile: [
    ['2:00 PM', 'The gathering', 'Family and friends arrive'],
    ['3:00 PM', 'The vows', 'The ceremony begins'],
    ['5:30 PM', 'The celebration', 'Food, music and dancing'],
  ],
  letterpress: [
    ['Arrival', '2:30 PM', 'Drinks in the atrium'],
    ['Ceremony', '3:30 PM', 'Please be seated by 3:15 PM'],
    ['Reception', '5:00 PM', 'Dinner and dancing'],
  ],
}

function getVenue(design) {
  if (venueBySlug[design.slug]) return venueBySlug[design.slug]
  if (design.category === 'Destination') {
    return destinationVenue[design.variant] || venueByCategory.Destination
  }
  return venueByCategory[design.category] || 'The Garden Room, Nairobi'
}

function getMode(design) {
  if (modeBySlug[design.slug]) return modeBySlug[design.slug]
  if (celestialVariants.has(design.variant)) return 'celestial'
  return modeByCategory[design.category] || 'letterpress'
}

function ArrowIcon() {
  return (
    <svg className="is-arrow" viewBox="0 0 20 20" aria-hidden="true">
      <path d="m8 4.5 5.5 5.5L8 15.5M13.2 10H5.5" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 7.5h14M8 4v3M16 4v3M5 5.5h14v14H5z" />
      <path d="M8.5 11h2M13.5 11h2M8.5 15h2M13.5 15h2" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2" />
    </svg>
  )
}

function BotanicalDrawing() {
  return (
    <svg className="is-botanical-drawing" viewBox="0 0 420 640" aria-hidden="true">
      <path d="M196 640C172 470 198 290 302 22" />
      <path d="M217 430c-94-5-150-58-158-157 96 12 153 63 158 157Z" />
      <path d="M250 295c15-112 77-178 170-192-11 106-66 173-170 192Z" />
      <path d="M187 535c87-15 142-72 159-169-88 15-141 71-159 169Z" />
      <path d="M294 127c-48-26-68-67-61-123 52 27 72 68 61 123Z" />
      <circle cx="79" cy="270" r="16" />
      <circle cx="421" cy="97" r="19" />
    </svg>
  )
}

function PalaceDrawing() {
  return (
    <svg className="is-palace-drawing" viewBox="0 0 900 420" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <path d="M18 399h864M75 398V215h92v183M733 398V215h92v183M167 398V171h566v227" />
      <path d="M208 398V238c0-70 51-126 114-126s114 56 114 126v160M464 398V238c0-70 51-126 114-126s114 56 114 126v160" />
      <path d="M137 215V118l-31-34-31 34v97M825 215V118l-31-34-31 34v97M167 171h566M450 171V73l-37-42h74l-37 42" />
      <circle cx="450" cy="94" r="19" />
      <path d="M322 112V77l-21-25h42l-21 25M578 112V77l-21-25h42l-21 25" />
    </svg>
  )
}

function TextileSun() {
  return (
    <svg className="is-textile-sun" viewBox="0 0 640 500" aria-hidden="true">
      <circle cx="320" cy="214" r="118" />
      <path d="M320 11v54M320 365v54M117 214h54M469 214h54M176 70l38 38M426 320l38 38M464 70l-38 38M214 320l-38 38" />
      <path d="M24 429c98-80 196-82 296-6 100-76 198-74 296 6v71H24z" />
      <path d="M293 442h54l-27-126zM320 347c-38 25-64 55-76 91M320 347c38 25 64 55 76 91" />
    </svg>
  )
}

function StarField() {
  return (
    <svg className="is-star-field" viewBox="0 0 900 620" aria-hidden="true">
      <circle cx="92" cy="88" r="2" /><circle cx="202" cy="172" r="3" />
      <circle cx="716" cy="112" r="2" /><circle cx="821" cy="244" r="3" />
      <circle cx="580" cy="68" r="2" /><circle cx="426" cy="203" r="2" />
      <circle cx="105" cy="420" r="2" /><circle cx="752" cy="482" r="2" />
      <path d="M233 100c93 13 172 60 236 140 64 80 137 127 219 140" />
      <path d="M450 88v20M440 98h20M710 326v28M696 340h28M139 275v22M128 286h22" />
    </svg>
  )
}

function CelestialChart() {
  return (
    <svg className="is-celestial-chart" viewBox="0 0 900 900" aria-hidden="true">
      <circle cx="450" cy="450" r="92" />
      <circle cx="450" cy="450" r="206" />
      <circle cx="450" cy="450" r="326" />
      <ellipse cx="450" cy="450" rx="390" ry="180" transform="rotate(-24 450 450)" />
      <ellipse cx="450" cy="450" rx="390" ry="180" transform="rotate(41 450 450)" />
      <path d="M164 214 281 327l128-185 104 196 202-88M192 650l132-117 146 185 111-167 137 106" />
      <circle cx="164" cy="214" r="7" /><circle cx="281" cy="327" r="5" />
      <circle cx="409" cy="142" r="8" /><circle cx="513" cy="338" r="5" />
      <circle cx="715" cy="250" r="7" /><circle cx="192" cy="650" r="5" />
      <circle cx="324" cy="533" r="8" /><circle cx="470" cy="718" r="5" />
      <circle cx="581" cy="551" r="7" /><circle cx="718" cy="657" r="5" />
      <path d="M450 31v44M428 53h44M93 449h36M111 431v36M769 108v50M744 133h50M788 730v44M766 752h44" />
    </svg>
  )
}

function AbstractArt({ design, mode }) {
  const [first, second] = design.couple
  if (mode === 'garden') return <BotanicalDrawing />
  if (mode === 'palace') return <PalaceDrawing />
  if (mode === 'textile') return <TextileSun />
  if (mode === 'cinema') return <StarField />
  if (mode === 'celestial') return <CelestialChart />
  if (mode === 'travel') {
    return (
      <svg className="is-route-drawing" viewBox="0 0 700 520" aria-hidden="true">
        <path d="M64 422C181 343 146 167 318 147c148-18 162 126 319 54" />
        <circle cx="64" cy="422" r="12" /><circle cx="637" cy="201" r="12" />
        <path d="m575 125 75 52-93 20 18-72Z" />
        <path d="M79 86c74-39 145-42 214-9M420 412c77 25 145 20 203-15" />
      </svg>
    )
  }
  return (
    <div className="is-initial-art" aria-hidden="true">
      <span>{first[0]}</span>
      <i>&amp;</i>
      <span>{second[0]}</span>
    </div>
  )
}

function StoryMedia({ design, mode, priority = false, caption }) {
  const source = design.image || archiveBySlug[design.slug]
  return (
    <figure className={`is-media is-media--${source ? 'image' : 'art'}`}>
      {source ? (
        <img
          src={source}
          alt=""
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
        />
      ) : (
        <AbstractArt design={design} mode={mode} />
      )}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}

function RSVP({ design, mode, prompt = 'Can you make it?' }) {
  const fieldId = useId()
  const successRef = useRef(null)
  const [attendance, setAttendance] = useState('')
  const [guestName, setGuestName] = useState('')
  const [status, setStatus] = useState('idle')
  const [submission, setSubmission] = useState(null)

  useEffect(() => {
    if (status === 'success') successRef.current?.focus()
  }, [status])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (status === 'sending') return

    const form = event.currentTarget
    const cleanName = guestName.trim()
    if (!cleanName) {
      const nameInput = form.elements.namedItem('name')
      nameInput.setCustomValidity('Please enter your name.')
      nameInput.reportValidity()
      return
    }

    const data = new FormData(form)
    setStatus('sending')
    try {
      const result = await submitRsvp(form, design?.name, {
        name: cleanName,
        templateId: design?.slug,
        eventType: design?.eventType || 'Wedding',
      })
      setGuestName(cleanName)
      setSubmission({
        attendance,
        demo: result.demo,
        extrasIncluded: ['requirements', 'song', 'message'].some((key) => String(data.get(key) || '').trim()),
      })
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section className={`is-rsvp is-rsvp--${mode}`} data-invite-reveal>
      <div className="is-rsvp__inner">
        <p>RSVP by 20 September 2027</p>
        <h2>{prompt}</h2>
        {status === 'success' ? (
          <div className="is-rsvp__confirmation" role="status" aria-live="polite" ref={successRef} tabIndex={-1}>
            <strong>{submission.demo ? `Preview complete, ${guestName}.` : `Thank you, ${guestName}.`}</strong>
            <span>
              {submission.demo
                ? 'This was a demo response and was not sent.'
                : submission.attendance === 'yes'
                  ? 'Your RSVP was sent. We cannot wait to celebrate with you.'
                  : 'Your reply was sent. We will miss you on the day.'}
            </span>
            {submission.extrasIncluded && (
              <small>{submission.demo ? 'Your extra details were included in the preview.' : 'Your extra details were sent too.'}</small>
            )}
            <button type="button" onClick={() => { setSubmission(null); setStatus('idle') }}>Edit response</button>
          </div>
        ) : (
          <form className="is-rsvp__form" onSubmit={handleSubmit} aria-busy={status === 'sending'}>
            <fieldset>
              <legend>Will you attend?</legend>
              <div className="is-rsvp__choice">
                <label className={attendance === 'yes' ? 'is-selected' : ''}>
                  <input
                    type="radio"
                    name="attendance"
                    value="yes"
                    checked={attendance === 'yes'}
                    onChange={(event) => setAttendance(event.target.value)}
                    required
                  />
                  <span>Joyfully attending</span>
                </label>
                <label className={attendance === 'no' ? 'is-selected' : ''}>
                  <input
                    type="radio"
                    name="attendance"
                    value="no"
                    checked={attendance === 'no'}
                    onChange={(event) => setAttendance(event.target.value)}
                    required
                  />
                  <span>Sorry to miss it</span>
                </label>
              </div>
            </fieldset>
            <label className="is-rsvp__field" htmlFor={`${fieldId}-name`}>
              <span>Your name</span>
              <input
                id={`${fieldId}-name`}
                name="name"
                type="text"
                autoComplete="name"
                value={guestName}
                onChange={(event) => {
                  event.currentTarget.setCustomValidity('')
                  setGuestName(event.target.value)
                }}
                required
              />
            </label>
            {attendance === 'yes' && (
              <div className="is-rsvp__attending">
                <div className="is-rsvp__row">
                  <label className="is-rsvp__field" htmlFor={`${fieldId}-party-size`}>
                    <span>Seats needed <small>(including you)</small></span>
                    <select id={`${fieldId}-party-size`} name="partySize" defaultValue="1" required>
                      <option value="1">1 — Just me</option>
                      <option value="2">2 guests</option>
                      <option value="3">3 guests</option>
                      <option value="4">4 guests</option>
                      <option value="5">5 guests</option>
                      <option value="6+">6 or more</option>
                    </select>
                  </label>
                  <label className="is-rsvp__field" htmlFor={`${fieldId}-song`}>
                    <span>Song request <small>(optional)</small></span>
                    <input id={`${fieldId}-song`} name="song" placeholder="One dance-floor favourite" />
                  </label>
                </div>
                <label className="is-rsvp__field" htmlFor={`${fieldId}-requirements`}>
                  <span>Anything we should plan for? <small>(optional)</small></span>
                  <textarea
                    id={`${fieldId}-requirements`}
                    name="requirements"
                    rows="2"
                    placeholder="Guest names, children’s ages, dietary or accessibility needs"
                  />
                </label>
              </div>
            )}
            {attendance === 'no' && (
              <label className="is-rsvp__field" htmlFor={`${fieldId}-message`}>
                <span>Leave a note <small>(optional)</small></span>
                <textarea id={`${fieldId}-message`} name="message" rows="2" placeholder="Send a little love from afar" />
              </label>
            )}
            {status === 'error' && (
              <p className="is-rsvp__error" role="alert">Your reply could not be sent. Check your connection and try again.</p>
            )}
            <button type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending reply…' : 'Send reply'}
              <ArrowIcon />
            </button>
          </form>
        )}
      </div>
    </section>
  )
}

function StoryFooter({ design, venue }) {
  const [first, second] = design.couple
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue)}`
  return (
    <footer className="is-footer">
      <div>
        <strong>{first} &amp; {second}</strong>
        <span>Saturday, 16 October 2027</span>
      </div>
      <a href={mapUrl} target="_blank" rel="noreferrer" aria-label={`Open ${venue} in Google Maps`}>
        <PinIcon />
        <span>{venue}</span>
      </a>
    </footer>
  )
}

function EditorialStory({ design, venue }) {
  const [first, second] = design.couple
  return (
    <div className="is-layout is-layout--editorial">
      <section className="is-editorial-cover" aria-labelledby={`story-${design.slug}`}>
        <div className="is-editorial-cover__masthead">The Wedding Edit</div>
        <StoryMedia design={design} mode="editorial" priority />
        <div className="is-editorial-cover__headline">
          <p>Saturday, 16 October 2027</p>
          <h1 id={`story-${design.slug}`}>{first}<br />&amp; {second}</h1>
          <span>Please join us in Nairobi</span>
        </div>
        <p className="is-editorial-cover__side">Celebration, dinner and dancing at {venue}</p>
      </section>

      <section className="is-editorial-note" data-invite-reveal>
        <p className="is-kicker">The invitation</p>
        <h2>We would love you to be there.</h2>
        <div>
          <p><b>W</b>e are getting married, and the day would not feel complete without our favourite people in the room.</p>
          <p>Come for the vows. Stay for dinner, the speeches and a very full dance floor.</p>
        </div>
      </section>

      <section className="is-editorial-run" data-invite-reveal>
        <header>
          <p className="is-kicker">Saturday’s running order</p>
          <h2>A good day,<br />well planned.</h2>
        </header>
        <div className="is-editorial-run__items">
          {eventPlans.editorial.map(([time, title, detail]) => (
            <article key={title}>
              <time>{time}</time>
              <h3>{title}</h3>
              <p>{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="is-editorial-feature" data-invite-reveal>
        <StoryMedia design={design} mode="editorial" caption={`The celebration takes place at ${venue}.`} />
        <aside>
          <p className="is-kicker">Guest notes</p>
          <h2>Wear your best. Bring your moves.</h2>
          <dl>
            <div><dt>Dress</dt><dd>Formal, with colour</dd></div>
            <div><dt>Travel</dt><dd>Shuttle leaves central Nairobi at 1:30 PM</dd></div>
            <div><dt>Gifts</dt><dd>Your company is plenty</dd></div>
          </dl>
        </aside>
      </section>
      <RSVP design={design} mode="editorial" prompt="Will we see you there?" />
      <StoryFooter design={design} venue={venue} />
    </div>
  )
}

function PalaceStory({ design, venue }) {
  const [first, second] = design.couple
  return (
    <div className="is-layout is-layout--palace">
      <section className="is-palace-hero" aria-labelledby={`story-${design.slug}`}>
        <div className="is-palace-hero__pattern" aria-hidden="true" />
        <div className="is-palace-hero__arch">
          <p>We’re getting married</p>
          <h1 id={`story-${design.slug}`}>{first}<span>&amp;</span>{second}</h1>
          <div className="is-palace-hero__date"><span>Saturday</span><strong>16 October 2027</strong><span>Nairobi</span></div>
          <p className="is-palace-hero__welcome">and we’d love you there with us</p>
        </div>
        <PalaceDrawing />
      </section>

      <section className="is-palace-events" data-invite-reveal>
        <header>
          <p className="is-kicker">Three moments, one celebration</p>
          <h2>Join us for the weekend.</h2>
        </header>
        <div className="is-palace-events__cards">
          {eventPlans.palace.map(([time, title, detail]) => (
            <article key={title}>
              <div className="is-palace-events__miniarch" aria-hidden="true" />
              <time>{time}</time>
              <h3>{title}</h3>
              <p>{detail}</p>
              <span>{venue}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="is-palace-scene" data-invite-reveal>
        <div className="is-palace-scene__art">
          <StoryMedia design={design} mode="palace" />
        </div>
        <div className="is-palace-scene__copy">
          <p className="is-kicker">For our guests</p>
          <h2>Come ready to celebrate.</h2>
          <div className="is-palace-notes">
            <p><strong>What to wear</strong><span>Formal dress. Colour is welcome.</span></p>
            <p><strong>Getting there</strong><span>Parking and a city shuttle are available.</span></p>
            <p><strong>Little guests</strong><span>Children named on the invitation are included.</span></p>
          </div>
        </div>
      </section>
      <RSVP design={design} mode="palace" prompt="May we save you a place?" />
      <StoryFooter design={design} venue={venue} />
    </div>
  )
}

function TravelStory({ design, venue }) {
  const [first, second] = design.couple
  const mapSource = archiveBySlug[design.slug]
    || (design.variant === 'ocean' ? '/images/lamu-coast-chart-1827.webp' : null)
  return (
    <div className="is-layout is-layout--travel">
      <section className="is-travel-hero" aria-labelledby={`story-${design.slug}`}>
        {mapSource ? (
          <img className="is-travel-hero__map" src={mapSource} alt="" decoding="async" fetchPriority="high" />
        ) : (
          <div className="is-travel-hero__map is-travel-hero__map--drawn" aria-hidden="true">
            <AbstractArt design={design} mode="travel" />
          </div>
        )}
        <div className="is-travel-hero__postcard">
          <div className="is-travel-postcard__photo"><StoryMedia design={design} mode="travel" priority /></div>
          <div className="is-travel-postcard__copy">
            <span className="is-travel-postcard__stamp">Save<br />the date</span>
            <p>You’re invited</p>
            <h1 id={`story-${design.slug}`}>{first}<small>&amp;</small>{second}</h1>
            <strong>16 October 2027</strong>
            <span>{venue}</span>
          </div>
        </div>
        <p className="is-travel-hero__note">Pack light. We have planned the rest.</p>
      </section>

      <section className="is-travel-weekend" data-invite-reveal>
        <header>
          <span>Your weekend guide</span>
          <h2>Come for the wedding.<br />Stay for the view.</h2>
        </header>
        <div className="is-travel-weekend__route" aria-hidden="true"><AbstractArt design={design} mode="travel" /></div>
        <div className="is-travel-weekend__stops">
          {eventPlans.travel.map(([time, title, detail]) => (
            <article key={title}><time>{time}</time><h3>{title}</h3><p>{detail}</p></article>
          ))}
        </div>
      </section>

      <section className="is-travel-details" data-invite-reveal>
        <div className="is-travel-details__ticket">
          <span>Wedding weekend</span>
          <strong>{first} &amp; {second}</strong>
          <small>{venue}</small>
        </div>
        <div className="is-travel-details__notes">
          <article><PinIcon /><h3>Getting there</h3><p>Transfers from the nearest airport can be added to your RSVP.</p></article>
          <article><CalendarIcon /><h3>Where to stay</h3><p>We have reserved rooms nearby for Friday and Saturday night.</p></article>
          <article><span className="is-weather-icon" aria-hidden="true">☀</span><h3>What to pack</h3><p>Formal clothes, flat shoes and something light for the evening.</p></article>
        </div>
      </section>
      <RSVP design={design} mode="travel" prompt="Are you coming with us?" />
      <StoryFooter design={design} venue={venue} />
    </div>
  )
}

function GardenStory({ design, venue }) {
  const [first, second] = design.couple
  return (
    <div className="is-layout is-layout--garden">
      <section className="is-garden-hero" aria-labelledby={`story-${design.slug}`}>
        <BotanicalDrawing />
        <div className="is-garden-hero__card">
          <p>In the garden</p>
          <h1 id={`story-${design.slug}`}>{first}<span>&amp;</span>{second}</h1>
          <p>are getting married</p>
          <div><strong>16 October 2027</strong><span>{venue}</span></div>
        </div>
        <BotanicalDrawing />
      </section>

      <section className="is-garden-letter" data-invite-reveal>
        <div className="is-garden-letter__specimen"><StoryMedia design={design} mode="garden" /></div>
        <div className="is-garden-letter__copy">
          <p className="is-kicker">A note from us</p>
          <h2>We found our person. Now we want our people there.</h2>
          <p>Please join us for an afternoon under the trees, followed by supper in the glasshouse.</p>
          <strong>{first} &amp; {second}</strong>
        </div>
      </section>

      <section className="is-garden-path" data-invite-reveal>
        <header><p className="is-kicker">The day</p><h2>Follow the garden path.</h2></header>
        <div className="is-garden-path__line" aria-hidden="true" />
        <div className="is-garden-path__events">
          {eventPlans.garden.map(([time, title, detail]) => (
            <article key={title}><span aria-hidden="true" /><time>{time}</time><h3>{title}</h3><p>{detail}</p></article>
          ))}
        </div>
      </section>

      <section className="is-garden-info" data-invite-reveal>
        <BotanicalDrawing />
        <header><p className="is-kicker">Before you come</p><h2>A few useful details.</h2></header>
        <div>
          <article><h3>Dress</h3><p>Garden formal. Please choose shoes that work on grass.</p></article>
          <article><h3>Travel</h3><p>Parking opens at 2:00 PM. Taxis can collect from the main gate.</p></article>
          <article><h3>Weather</h3><p>The ceremony is outdoors. A covered space is ready if it rains.</p></article>
        </div>
      </section>
      <RSVP design={design} mode="garden" prompt="Will you be in the garden?" />
      <StoryFooter design={design} venue={venue} />
    </div>
  )
}

function KineticStory({ design, venue }) {
  const [first, second] = design.couple
  return (
    <div className="is-layout is-layout--kinetic">
      <section className="is-kinetic-hero" aria-labelledby={`story-${design.slug}`}>
        <p className="is-kinetic-hero__top">Wedding invitation · Nairobi · 16 October 2027</p>
        <h1 id={`story-${design.slug}`}><span>{first}</span><b>&amp;</b><span>{second}</span></h1>
        <div className="is-kinetic-hero__ticker" aria-hidden="true">
          <div>WE’RE GETTING MARRIED · DINNER · MUSIC · DANCING · WE’RE GETTING MARRIED · DINNER · MUSIC · DANCING ·</div>
        </div>
        <div className="is-kinetic-hero__footer"><strong>{venue}</strong><span>Scroll for the plan ↓</span></div>
      </section>

      <section className="is-kinetic-plan" data-invite-reveal>
        <header><span>Saturday</span><h2>Here’s<br />the plan.</h2></header>
        <div className="is-kinetic-plan__grid">
          {eventPlans.kinetic.map(([time, title, detail]) => (
            <article key={title}><time>{time}</time><h3>{title}</h3><p>{detail}</p></article>
          ))}
        </div>
      </section>

      <section className="is-kinetic-picture" data-invite-reveal>
        <div className="is-kinetic-picture__word" aria-hidden="true">YES</div>
        <StoryMedia design={design} mode="kinetic" />
        <div className="is-kinetic-picture__copy"><p>One brilliant day with all our favourite people.</p><strong>{first} &amp; {second}</strong></div>
      </section>

      <section className="is-kinetic-info" data-invite-reveal>
        <header><span>Useful things</span><h2>Wear colour.<br />Come hungry.</h2></header>
        <div>
          <article><strong>Dress</strong><p>Formal, but never boring.</p></article>
          <article><strong>Ride</strong><p>City shuttle at 1:30 PM.</p></article>
          <article><strong>Food</strong><p>Add allergies when you RSVP.</p></article>
        </div>
      </section>
      <RSVP design={design} mode="kinetic" prompt="In or out?" />
      <StoryFooter design={design} venue={venue} />
    </div>
  )
}

function CinemaStory({ design, venue }) {
  const [first, second] = design.couple
  return (
    <div className="is-layout is-layout--cinema">
      <section className="is-cinema-hero" aria-labelledby={`story-${design.slug}`}>
        <StoryMedia design={design} mode="cinema" priority />
        <div className="is-cinema-hero__shade" />
        <StarField />
        <div className="is-cinema-hero__copy">
          <p>A wedding film starring</p>
          <h1 id={`story-${design.slug}`}>{first}<span>&amp;</span>{second}</h1>
          <div><strong>16 October 2027</strong><span>{venue}</span></div>
        </div>
        <span className="is-cinema-hero__scroll">The story continues ↓</span>
      </section>

      <section className="is-cinema-letter" data-invite-reveal>
        <p className="is-kicker">Opening scene</p>
        <h2>All our favourite people, in one room.</h2>
        <p>That is the whole plan. We will make our vows, eat well and dance until the lights come up.</p>
      </section>

      <section className="is-cinema-chapters" data-invite-reveal>
        {eventPlans.cinema.map(([title, time, detail]) => (
          <article key={title}>
            <span>{title}</span>
            <div><time>{time}</time><h3>{detail}</h3></div>
          </article>
        ))}
      </section>

      <section className="is-cinema-still" data-invite-reveal>
        <StoryMedia design={design} mode="cinema" />
        <div className="is-cinema-still__caption"><span>Location</span><strong>{venue}</strong><p>Formal dress. Guest transport leaves central Nairobi at 1:30 PM. Please share dietary requirements with your RSVP.</p></div>
      </section>
      <RSVP design={design} mode="cinema" prompt="See you in the final scene?" />
      <StoryFooter design={design} venue={venue} />
    </div>
  )
}

function CelestialStory({ design, venue }) {
  const [first, second] = design.couple
  return (
    <div className="is-layout is-layout--celestial">
      <section className="is-celestial-hero" aria-labelledby={`story-${design.slug}`}>
        <CelestialChart />
        <div className="is-celestial-hero__glow" aria-hidden="true" />
        <div className="is-celestial-hero__copy">
          <p>Under the evening sky</p>
          <h1 id={`story-${design.slug}`}>{first}<span>&amp;</span>{second}</h1>
          <div>
            <strong>16 October 2027</strong>
            <span>{venue}</span>
          </div>
        </div>
        <p className="is-celestial-hero__invite">Please join us for our wedding after sunset.</p>
      </section>

      <section className="is-celestial-note" data-invite-reveal>
        <div className="is-celestial-note__orbit" aria-hidden="true">
          <span /><span /><i />
          <strong>{first[0]}{second[0]}</strong>
        </div>
        <div className="is-celestial-note__copy">
          <p className="is-kicker">A note from us</p>
          <h2>We’re getting married as the sun goes down.</h2>
          <p>Come for the vows, stay for dinner and dance with us beneath the night sky.</p>
        </div>
      </section>

      <section className="is-celestial-plan" data-invite-reveal>
        <header>
          <p className="is-kicker">Saturday evening</p>
          <h2>As the light changes.</h2>
        </header>
        <div className="is-celestial-plan__events">
          {eventPlans.celestial.map(([title, time, detail]) => (
            <article key={title}>
              <div className="is-celestial-plan__planet" aria-hidden="true" />
              <time>{time}</time>
              <h3>{title}</h3>
              <p>{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="is-celestial-scene" data-invite-reveal>
        <StoryMedia design={design} mode="celestial" />
        <div className="is-celestial-scene__copy">
          <p className="is-kicker">The place</p>
          <h2>{venue}</h2>
          <p>The ceremony begins outdoors. Dinner and dancing follow inside.</p>
          <div>
            <span>Dress</span><strong>Formal, with a light layer for later</strong>
            <span>Travel</span><strong>Guest transport leaves Nairobi at 3:00 PM</strong>
            <span>Food</span><strong>Add any dietary needs to your reply</strong>
          </div>
        </div>
      </section>
      <RSVP design={design} mode="celestial" prompt="Will you meet us under the stars?" />
      <StoryFooter design={design} venue={venue} />
    </div>
  )
}

function TextileStory({ design, venue }) {
  const [first, second] = design.couple
  const experience = getExperienceRecipe(design)
  const hasSignatureHero = signatureTextileVariants.has(design.variant)
  return (
    <div className="is-layout is-layout--textile">
      {hasSignatureHero ? (
        <section className={`is-textile-hero is-textile-hero--${design.variant}`} aria-labelledby={`story-${design.slug}`}>
          {design.variant === 'tree' && <StoryMedia design={design} mode="textile" priority />}
          <div className="is-textile-signature__surface" aria-hidden="true">
            <span /><span /><span /><span /><span /><span />
          </div>
          {design.variant === 'beads' && (
            <div className="is-textile-signature__orbit" aria-hidden="true">
              <span /><span /><span /><span />
            </div>
          )}
          <div className="is-textile-signature__copy">
            <p className="is-textile-signature__phrase">{experience.phrase}</p>
            <h1 id={`story-${design.slug}`}>
              <span className="is-textile-signature__first">{first}</span>
              <span className="is-textile-signature__join">&amp;</span>
              <span className="is-textile-signature__second">{second}</span>
            </h1>
            <p className="is-textile-signature__subline">{experience.subline}</p>
          </div>
          <div className="is-textile-signature__meta">
            <time dateTime="2027-10-16">Saturday, 16 October 2027</time>
            <span>{venue}</span>
          </div>
        </section>
      ) : (
        <section className="is-textile-hero" aria-labelledby={`story-${design.slug}`}>
          <div className="is-textile-border" aria-hidden="true" />
          <div className="is-textile-hero__sun"><TextileSun /></div>
          <div className="is-textile-hero__copy">
            <p>Come celebrate with us</p>
            <h1 id={`story-${design.slug}`}>{first}<span>&amp;</span>{second}</h1>
            <strong>Saturday, 16 October 2027</strong>
            <span>{venue}</span>
          </div>
        </section>
      )}

      <section className="is-textile-welcome" data-invite-reveal>
        <div className="is-textile-welcome__pattern" aria-hidden="true" />
        <div><p className="is-kicker">Our wedding day</p><h2>Come celebrate with us.</h2><p>The day begins with our vows and ends with everyone on the dance floor.</p></div>
        <StoryMedia design={design} mode="textile" />
      </section>

      <section className="is-textile-events" data-invite-reveal>
        <header><p className="is-kicker">The celebration</p><h2>What happens when.</h2></header>
        <div>
          {eventPlans.textile.map(([time, title, detail]) => (
            <article key={title}><time>{time}</time><span aria-hidden="true" /><h3>{title}</h3><p>{detail}</p></article>
          ))}
        </div>
      </section>

      <section className="is-textile-info" data-invite-reveal>
        <div className="is-textile-info__landscape"><TextileSun /></div>
        <div className="is-textile-info__copy">
          <p className="is-kicker">Guest information</p>
          <h2>Everything you need.</h2>
          <dl>
            <div><dt>Dress</dt><dd>Formal, bright and comfortable</dd></div>
            <div><dt>Travel</dt><dd>Parking on site, plus a Nairobi shuttle</dd></div>
            <div><dt>Food</dt><dd>Tell us about allergies when you reply</dd></div>
          </dl>
        </div>
      </section>
      <RSVP design={design} mode="textile" prompt="Will you celebrate with us?" />
      <StoryFooter design={design} venue={venue} />
    </div>
  )
}

function LetterpressStory({ design, venue }) {
  const [first, second] = design.couple
  return (
    <div className="is-layout is-layout--letterpress">
      <section className="is-letterpress-hero" aria-labelledby={`story-${design.slug}`}>
        <div className="is-letterpress-hero__sheet">
          <p>We’re getting married</p>
          <h1 id={`story-${design.slug}`}>{first}<span>&amp;</span>{second}</h1>
          <p>and we’d love you to join us</p>
          <div className="is-letterpress-hero__date"><strong>Saturday</strong><span>16 October 2027 · 3:30 PM</span><em>{venue}</em></div>
        </div>
        <div className="is-letterpress-hero__blind" aria-hidden="true">{first[0]}{second[0]}</div>
      </section>

      <section className="is-letterpress-note" data-invite-reveal>
        <span>A note from us</span>
        <div><h2>We hope you can join us.</h2><p>The ceremony will be followed by dinner, speeches and dancing. Please arrive by 2:30 PM so everyone can be seated in good time.</p></div>
      </section>

      <section className="is-letterpress-plan" data-invite-reveal>
        <header><p>The order of the day</p><h2>Saturday,<br />simply.</h2></header>
        <div>
          {eventPlans.letterpress.map(([title, time, detail]) => (
            <article key={title}><span>{title}</span><time>{time}</time><p>{detail}</p></article>
          ))}
        </div>
      </section>

      <section className="is-letterpress-image" data-invite-reveal>
        <StoryMedia design={design} mode="letterpress" caption="A seat is waiting for you." />
      </section>

      <section className="is-letterpress-info" data-invite-reveal>
        <header><span>Guest notes</span><h2>Before the day.</h2></header>
        <div>
          <article><h3>Dress</h3><p>Formal. Wear something you can dance in.</p></article>
          <article><h3>Travel</h3><p>Parking is available at the venue from 2:00 PM.</p></article>
          <article><h3>Gifts</h3><p>No gift is expected. Your presence matters most.</p></article>
        </div>
      </section>
      <RSVP design={design} mode="letterpress" prompt="Will you join us?" />
      <StoryFooter design={design} venue={venue} />
    </div>
  )
}

export default function InvitationStory({ design }) {
  const storyRoot = useRef(null)
  const dragState = useRef({ active: false })
  const inertiaFrame = useRef(null)
  const parallaxFrame = useRef(null)

  useEffect(() => () => {
    if (inertiaFrame.current) window.cancelAnimationFrame(inertiaFrame.current)
    if (parallaxFrame.current) window.cancelAnimationFrame(parallaxFrame.current)
  }, [])

  useEffect(() => {
    const root = storyRoot.current
    if (!root || root.dataset.pannable !== 'true') return undefined
    const rail = root.querySelector('.is-layout')
    if (!rail) return undefined

    const handleRailWheel = (event) => {
      if (event.target.closest('input, textarea, select')) return
      if (rail.scrollWidth <= rail.clientWidth) return

      const verticalPanel = event.target.closest('.is-layout > section, .is-layout > footer')
      const verticalIntent = Math.abs(event.deltaY) > Math.abs(event.deltaX)
      if (verticalIntent && verticalPanel && verticalPanel.scrollHeight > verticalPanel.clientHeight + 2) {
        const panelCanMoveUp = event.deltaY < 0 && verticalPanel.scrollTop > 1
        const panelCanMoveDown = event.deltaY > 0
          && verticalPanel.scrollTop + verticalPanel.clientHeight < verticalPanel.scrollHeight - 1
        if (panelCanMoveUp || panelCanMoveDown) return
      }

      const movement = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX
      const atStart = rail.scrollLeft <= 1 && movement < 0
      const atEnd = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 1 && movement > 0
      if (atStart || atEnd) {
        if (verticalIntent && event.deltaY) {
          event.preventDefault()
          const page = document.scrollingElement
          if (page) page.scrollTop += event.deltaY
        }
        return
      }

      event.preventDefault()
      rail.scrollLeft += movement
    }

    root.addEventListener('wheel', handleRailWheel, { passive: false })
    return () => root.removeEventListener('wheel', handleRailWheel)
  }, [design?.slug])

  if (!design) return null

  const mode = getMode(design)
  const profile = getStoryProfile(design)
  const experience = getExperienceRecipe(design)
  const venue = getVenue(design)
  const [base = '#f3f1eb', , accent = '#315bea', accentTwo = '#141514'] = design.palette || []
  const style = {
    '--is-base': base,
    '--is-accent': accent,
    '--is-accent-two': accentTwo,
    '--experience-accent': experience.accent,
    '--experience-backdrop': experience.backdrop,
  }
  const props = { design, venue }
  const Story = {
    editorial: EditorialStory,
    palace: PalaceStory,
    travel: TravelStory,
    garden: GardenStory,
    kinetic: KineticStory,
    cinema: CinemaStory,
    celestial: CelestialStory,
    textile: TextileStory,
    letterpress: LetterpressStory,
  }[mode]

  const usesStoryRail = ['horizontal', 'carousel', 'filmstrip'].includes(experience.storyLayout)

  const getStoryRail = () => storyRoot.current?.querySelector('.is-layout')

  const stopRailInertia = () => {
    if (!inertiaFrame.current) return
    window.cancelAnimationFrame(inertiaFrame.current)
    inertiaFrame.current = null
  }

  const updateStoryParallax = (rail) => {
    const root = storyRoot.current
    if (!root || !rail) return
    const maximum = Math.max(1, rail.scrollWidth - rail.clientWidth)
    const progress = Math.min(1, Math.max(0, rail.scrollLeft / maximum))
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const travel = reduceMotion ? 0 : (progress - 0.5) * 112
    root.style.setProperty('--story-pan-progress', progress.toFixed(4))
    root.style.setProperty('--story-parallax-near', `${travel * -0.23}px`)
    root.style.setProperty('--story-parallax-far', `${travel * 0.12}px`)
  }

  const scheduleStoryParallax = (rail) => {
    if (parallaxFrame.current) return
    parallaxFrame.current = window.requestAnimationFrame(() => {
      parallaxFrame.current = null
      updateStoryParallax(rail)
    })
  }

  const moveStoryRail = (direction) => {
    const rail = getStoryRail()
    if (!rail) return
    stopRailInertia()
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    rail.scrollBy({ left: direction * rail.clientWidth * 0.72, behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  const handleStoryScroll = (event) => {
    if (!usesStoryRail || event.target !== getStoryRail()) return
    scheduleStoryParallax(event.target)
  }

  const handleStoryPointerDown = (event) => {
    if (!usesStoryRail || event.pointerType === 'touch' || event.button !== 0) return
    if (event.target.closest('a, button, input, textarea, select, label, [contenteditable="true"]')) return
    const rail = event.target.closest('.is-layout')
    if (!rail || rail !== getStoryRail()) return
    stopRailInertia()
    dragState.current = {
      active: true,
      dragged: false,
      pointerId: event.pointerId,
      rail,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastTime: performance.now(),
      velocity: 0,
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const handleStoryPointerMove = (event) => {
    const drag = dragState.current
    if (!drag.active || drag.pointerId !== event.pointerId) return
    const totalX = event.clientX - drag.startX
    const totalY = event.clientY - drag.startY
    if (!drag.dragged) {
      if (Math.max(Math.abs(totalX), Math.abs(totalY)) < 7) return
      if (Math.abs(totalY) > Math.abs(totalX) * 1.15) {
        drag.active = false
        if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId)
        }
        return
      }
      drag.dragged = true
      drag.rail.classList.add('is-dragging')
    }

    event.preventDefault()
    const now = performance.now()
    const elapsed = Math.max(8, now - drag.lastTime)
    const movement = drag.lastX - event.clientX
    drag.rail.scrollLeft += movement
    const instantVelocity = movement / elapsed
    drag.velocity = Math.max(-2.4, Math.min(2.4, drag.velocity * 0.7 + instantVelocity * 0.3))
    drag.lastX = event.clientX
    drag.lastTime = now
  }

  const finishStoryDrag = (event, allowInertia = true) => {
    const drag = dragState.current
    if (!drag.active || drag.pointerId !== event.pointerId) return
    drag.active = false
    drag.rail.classList.remove('is-dragging')
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let velocity = drag.velocity || 0
    if (!allowInertia || !drag.dragged || reduceMotion || Math.abs(velocity) < 0.025) return
    let previousTime = performance.now()
    const glide = (time) => {
      const elapsed = Math.min(34, time - previousTime)
      previousTime = time
      const before = drag.rail.scrollLeft
      drag.rail.scrollLeft += velocity * elapsed
      velocity *= Math.pow(0.91, elapsed / 16.67)
      const reachedEdge = Math.abs(drag.rail.scrollLeft - before) < 0.25
      if (Math.abs(velocity) < 0.018 || reachedEdge) {
        inertiaFrame.current = null
        return
      }
      inertiaFrame.current = window.requestAnimationFrame(glide)
    }
    inertiaFrame.current = window.requestAnimationFrame(glide)
  }

  const handleStoryKeyDown = (event) => {
    if (!usesStoryRail || event.target.closest('a, button, input, textarea, select')) return
    const rail = getStoryRail()
    if (!rail) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const behavior = reduceMotion ? 'auto' : 'smooth'
    const keyMovement = {
      ArrowLeft: -rail.clientWidth * 0.24,
      ArrowRight: rail.clientWidth * 0.24,
      PageUp: -rail.clientWidth * 0.78,
      PageDown: rail.clientWidth * 0.78,
    }[event.key]
    if (keyMovement) {
      event.preventDefault()
      stopRailInertia()
      rail.scrollBy({ left: keyMovement, behavior })
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      stopRailInertia()
      rail.scrollTo({ left: event.key === 'Home' ? 0 : rail.scrollWidth, behavior })
    }
  }

  return (
    <div
      ref={storyRoot}
      className={`inv-story inv-story--${mode} inv-story--family-${profile.family} inv-story--mode-${mode} inv-story--variant-${design.variant} inv-story--layout-${profile.layout} inv-story--experience-${experience.storyLayout}${profile.compact ? ' inv-story--compact' : ''}${profile.photoLed ? ' inv-story--photo-led' : ''}${profile.multiEvent ? ' inv-story--multi-event' : ''}`}
      data-motion={profile.motion}
      data-section-motion={experience.sectionMotion}
      data-story-layout={experience.storyLayout}
      data-pannable={usesStoryRail ? 'true' : undefined}
      data-surface={profile.surface}
      data-media={profile.media}
      style={style}
      role={usesStoryRail ? 'region' : undefined}
      aria-label={usesStoryRail ? 'Scrollable invitation story' : undefined}
      tabIndex={usesStoryRail ? 0 : undefined}
      onScrollCapture={handleStoryScroll}
      onPointerDown={handleStoryPointerDown}
      onPointerMove={handleStoryPointerMove}
      onPointerUp={(event) => finishStoryDrag(event)}
      onPointerCancel={(event) => finishStoryDrag(event, false)}
      onKeyDown={handleStoryKeyDown}
      onDragStart={(event) => {
        if (usesStoryRail && event.target.closest('.is-layout')) event.preventDefault()
      }}
    >
      <Story {...props} />
      {usesStoryRail && (
        <nav className="is-story-rail-controls" aria-label="Invitation chapters">
          <button type="button" onClick={() => moveStoryRail(-1)} aria-label="Previous chapter">
            <ArrowIcon />
          </button>
          <span aria-hidden="true" />
          <button type="button" onClick={() => moveStoryRail(1)} aria-label="Next chapter">
            <ArrowIcon />
          </button>
        </nav>
      )}
    </div>
  )
}
