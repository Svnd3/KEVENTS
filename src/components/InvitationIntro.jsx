import { useEffect, useMemo, useRef, useState } from 'react'
import '../invitation-intro.css'

const CELESTIAL_VARIANTS = new Set(['cosmos', 'stars', 'nightcity', 'orbit', 'electric'])

const MECHANIC_BY_SLUG = {
  'lamu-moon': 'destination',
  'swahili-nikah': 'destination',
  'cathedral-ivory': 'envelope',
  'garden-in-motion': 'envelope',
  muse: 'editorial',
  'color-theory': 'editorial',
  glasshouse: 'envelope',
  'nairobi-noir': 'cinematic',
}

const mechanicCopy = {
  envelope: { prompt: 'Open the envelope', label: 'A letter for you' },
  gates: { prompt: 'Open the gates', label: 'Welcome' },
  celestial: { prompt: 'Touch the constellation', label: 'Look up' },
  editorial: { prompt: 'Unfold the invitation', label: 'Wedding edition' },
  destination: { prompt: 'Open the map', label: 'You have mail' },
  cinematic: { prompt: 'Start the film', label: 'Tonight’s feature' },
  textile: { prompt: 'Unwrap the invitation', label: 'Made for you' },
}

function getMechanic(design) {
  if (MECHANIC_BY_SLUG[design.slug]) return MECHANIC_BY_SLUG[design.slug]
  if (CELESTIAL_VARIANTS.has(design.variant)) return 'celestial'
  if (design.category === 'Cultural') return 'gates'
  if (design.category === 'Editorial') return 'editorial'
  if (design.category === 'Destination') return 'destination'
  if (design.category === 'Cinematic') return 'cinematic'
  if (design.category === 'African') return 'textile'
  return 'envelope'
}

function Initials({ design }) {
  return <>{design.couple[0][0]}{design.couple[1][0]}</>
}

function InvitationFace({ design, className = '' }) {
  const [first, second] = design.couple

  return (
    <span className={`ii-card ${className}`}>
      <span className="ii-card__occasion">Together with their families</span>
      <span className="ii-card__names">
        <strong>{first}</strong>
        <b>&amp;</b>
        <strong>{second}</strong>
      </span>
      <span className="ii-card__details">16 October 2027 · Nairobi</span>
    </span>
  )
}

function EnvelopeVisual({ design }) {
  return (
    <span className="ii-object ii-envelope" aria-hidden="true">
      <span className="ii-envelope__shadow" />
      <span className="ii-envelope__back" />
      <InvitationFace design={design} className="ii-envelope__card" />
      <span className="ii-envelope__flap" />
      <span className="ii-envelope__pocket ii-envelope__pocket--left" />
      <span className="ii-envelope__pocket ii-envelope__pocket--right" />
      <span className="ii-envelope__pocket ii-envelope__pocket--bottom" />
      <span className="ii-envelope__garden">
        <i /><i /><i /><i /><i /><i />
      </span>
      <span className="ii-envelope__seal"><Initials design={design} /></span>
    </span>
  )
}

function GateVisual({ design }) {
  return (
    <span className="ii-object ii-palace" aria-hidden="true">
      <span className="ii-palace__sun" />
      <span className="ii-palace__arch">
        <InvitationFace design={design} className="ii-palace__card" />
      </span>
      <span className="ii-palace__gate ii-palace__gate--left">
        <span className="ii-palace__pattern" />
      </span>
      <span className="ii-palace__gate ii-palace__gate--right">
        <span className="ii-palace__pattern" />
      </span>
      <span className="ii-palace__handles" />
    </span>
  )
}

function CelestialVisual({ design }) {
  return (
    <span className="ii-object ii-celestial" aria-hidden="true">
      <span className="ii-celestial__orbit ii-celestial__orbit--outer" />
      <span className="ii-celestial__orbit ii-celestial__orbit--inner" />
      <span className="ii-celestial__stars" />
      <span className="ii-celestial__constellation">
        <i /><i /><i /><i /><i /><i />
      </span>
      <InvitationFace design={design} className="ii-celestial__card" />
      <span className="ii-celestial__disc"><Initials design={design} /></span>
    </span>
  )
}

function EditorialVisual({ design }) {
  const [first, second] = design.couple

  return (
    <span className="ii-object ii-editorial" aria-hidden="true">
      <span className="ii-editorial__shadow" />
      <span className="ii-editorial__sheet">
        <span className="ii-editorial__masthead">The Wedding Edition</span>
        <span className="ii-editorial__headline">{first} &amp; {second}</span>
        <span className="ii-editorial__copy">Nairobi · 16 October 2027</span>
        <span className="ii-editorial__photo"><Initials design={design} /></span>
        <span className="ii-editorial__columns" />
      </span>
      <span className="ii-editorial__fold ii-editorial__fold--left">
        <span>Save the date</span>
      </span>
      <span className="ii-editorial__fold ii-editorial__fold--right">
        <span>{design.name}</span>
      </span>
    </span>
  )
}

function DestinationVisual({ design }) {
  const [first, second] = design.couple

  return (
    <span className="ii-object ii-map" aria-hidden="true">
      <span className="ii-map__shadow" />
      <span className="ii-map__panel ii-map__panel--left">
        <span className="ii-map__coast" />
        <span className="ii-map__place">Nairobi</span>
      </span>
      <span className="ii-map__panel ii-map__panel--middle">
        <span className="ii-map__route" />
        <span className="ii-map__pin" />
        <span className="ii-map__postmark">KE</span>
        <span className="ii-map__names">{first}<b>&amp;</b>{second}</span>
      </span>
      <span className="ii-map__panel ii-map__panel--right">
        <span className="ii-map__stamp"><Initials design={design} /></span>
        <span className="ii-map__date">16.10.27</span>
      </span>
    </span>
  )
}

function CinematicVisual({ design }) {
  const [first, second] = design.couple

  return (
    <span className="ii-object ii-cinema" aria-hidden="true">
      <span className="ii-cinema__screen">
        <span className="ii-cinema__grain" />
        <span className="ii-cinema__title">
          <small>{design.name}</small>
          <strong>{first} &amp; {second}</strong>
          <span>16 October 2027</span>
        </span>
        <span className="ii-cinema__play">▶</span>
        <span className="ii-cinema__curtain ii-cinema__curtain--left" />
        <span className="ii-cinema__curtain ii-cinema__curtain--right" />
      </span>
      <span className="ii-cinema__sprockets ii-cinema__sprockets--top" />
      <span className="ii-cinema__sprockets ii-cinema__sprockets--bottom" />
    </span>
  )
}

function TextileVisual({ design }) {
  return (
    <span className="ii-object ii-textile" aria-hidden="true">
      <span className="ii-textile__shadow" />
      <InvitationFace design={design} className="ii-textile__card" />
      <span className="ii-textile__cloth ii-textile__cloth--left">
        <span className="ii-textile__weave" />
      </span>
      <span className="ii-textile__cloth ii-textile__cloth--right">
        <span className="ii-textile__weave" />
      </span>
      <span className="ii-textile__band" />
      <span className="ii-textile__knot"><Initials design={design} /></span>
    </span>
  )
}

const visuals = {
  envelope: EnvelopeVisual,
  gates: GateVisual,
  celestial: CelestialVisual,
  editorial: EditorialVisual,
  destination: DestinationVisual,
  cinematic: CinematicVisual,
  textile: TextileVisual,
}

export default function InvitationIntro({ design, onComplete }) {
  const [phase, setPhase] = useState('closed')
  const timerRef = useRef(null)
  const enterRef = useRef(null)
  const mechanic = useMemo(() => (design ? getMechanic(design) : 'envelope'), [design])
  const Visual = visuals[mechanic]

  useEffect(() => {
    window.clearTimeout(timerRef.current)
    setPhase('closed')
  }, [design?.slug])

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  useEffect(() => {
    if (phase === 'ready') enterRef.current?.focus({ preventScroll: true })
  }, [phase])

  if (!design) return null

  const copy = mechanicCopy[mechanic]
  const [first, second] = design.couple
  const palette = design.palette || []
  const introStyle = {
    '--ii-one': palette[0] || '#d7dce5',
    '--ii-two': palette[1] || '#141619',
    '--ii-three': palette[2] || '#6686a6',
    '--ii-four': palette[3] || '#2f4e68',
  }

  const reveal = () => {
    if (phase !== 'closed') return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setPhase('opening')
    timerRef.current = window.setTimeout(() => setPhase('ready'), reduceMotion ? 30 : 1160)
  }

  const finish = () => {
    window.clearTimeout(timerRef.current)
    setPhase('complete')
    onComplete?.(design)
  }

  return (
    <section
      className={`invitation-intro ii-type-${mechanic} ii-is-${phase}`}
      data-variant={design.variant}
      style={introStyle}
      aria-label={`${design.name} invitation opening`}
    >
      <span className="ii-ambient" aria-hidden="true" />

      <header className="ii-topbar">
        <span className="ii-topbar__monogram" aria-hidden="true"><Initials design={design} /></span>
        <span className="ii-topbar__label">Private invitation</span>
        <button type="button" onClick={finish}>Skip intro</button>
      </header>

      <div className="ii-stage">
        <div className="ii-heading">
          <p>{copy.label}</p>
          <h1>{first} <span>&amp;</span> {second}</h1>
        </div>

        <div className="ii-mechanic">
          <Visual design={design} />
          <button
            className="ii-gesture"
            type="button"
            onClick={reveal}
            disabled={phase !== 'closed'}
            aria-label={`${copy.prompt} for ${first} and ${second}`}
          >
            <span className="ii-gesture__label">
              <i aria-hidden="true" />
              {copy.prompt}
            </span>
          </button>
        </div>

        <div className="ii-actions">
          <p aria-live="polite">
            {phase === 'closed' ? copy.prompt : phase === 'opening' ? 'Opening' : 'Ready for you'}
          </p>
          <button
            ref={enterRef}
            className="ii-enter"
            type="button"
            onClick={finish}
            disabled={phase !== 'ready'}
          >
            Enter invitation
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <p className="ii-design-name">{design.name}</p>
    </section>
  )
}
