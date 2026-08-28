import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getExperienceRecipe } from '../data/experienceRecipes.js'
import '../invitation-intro.css'

const INTRO_RECIPES = {
  sunset: { family: 'textile', skin: 'fiber-warm', motif: 'horizon', motion: 'part' },
  weave: { family: 'textile', skin: 'fiber-cobalt', motif: 'chevron', motion: 'unlace' },
  beads: { family: 'textile', skin: 'fiber-jewel', motif: 'rings', motion: 'unlace' },
  tree: { family: 'textile', skin: 'fiber-earth', motif: 'branches', motion: 'rise' },
  print: { family: 'textile', skin: 'fiber-cobalt', motif: 'ankara', motion: 'part' },
  mountain: { family: 'textile', skin: 'fiber-cool', motif: 'peaks', motion: 'rise' },

  arch: { family: 'destination', skin: 'map-coast', motif: 'arch', motion: 'unfold' },
  coastal: { family: 'destination', skin: 'map-coast', motif: 'lattice', motion: 'breeze' },
  ocean: { family: 'destination', skin: 'map-blue', motif: 'wave', motion: 'unfold' },
  aegean: { family: 'destination', skin: 'map-blue', motif: 'steps', motion: 'fan' },
  vineyard: { family: 'destination', skin: 'map-warm', motif: 'vine', motion: 'fan' },
  mist: { family: 'destination', skin: 'map-mist', motif: 'ripple', motion: 'drift' },
  spice: { family: 'destination', skin: 'map-warm', motif: 'compass', motion: 'unfold' },

  city: { family: 'cinematic', skin: 'film-city', motif: 'skyline', motion: 'curtain' },
  dawn: { family: 'cinematic', skin: 'film-dawn', motif: 'sunrise', motion: 'iris' },
  noir: { family: 'cinematic', skin: 'film-noir', motif: 'frame', motion: 'shutter' },
  reel: { family: 'cinematic', skin: 'film-warm', motif: 'reel', motion: 'curtain' },

  glass: { family: 'envelope', skin: 'paper-glass', motif: 'prism', motion: 'float' },
  glow: { family: 'envelope', skin: 'paper-glow', motif: 'halo', motion: 'float' },
  cathedral: { family: 'envelope', skin: 'paper-ivory', motif: 'arch', motion: 'hinge' },
  peony: { family: 'envelope', skin: 'paper-blush', motif: 'peony', motion: 'bloom' },
  pressed: { family: 'envelope', skin: 'paper-botanical', motif: 'pressed', motion: 'lift' },
  orchid: { family: 'envelope', skin: 'paper-noir', motif: 'orchid', motion: 'bloom' },
  bougainvillea: { family: 'envelope', skin: 'paper-vivid', motif: 'bougainvillea', motion: 'scatter' },
  protea: { family: 'envelope', skin: 'paper-botanical', motif: 'protea', motion: 'bloom' },
  rose: { family: 'envelope', skin: 'paper-blush', motif: 'rose', motion: 'float' },
  line: { family: 'envelope', skin: 'paper-quiet', motif: 'single-line', motion: 'lift' },
  bow: { family: 'envelope', skin: 'paper-formal', motif: 'bow', motion: 'untie' },
  serif: { family: 'envelope', skin: 'paper-quiet', motif: 'serif', motion: 'lift' },
  monogram: { family: 'envelope', skin: 'paper-metal', motif: 'monogram', motion: 'seal' },
  clay: { family: 'envelope', skin: 'paper-clay', motif: 'blocks', motion: 'slide' },
  thread: { family: 'envelope', skin: 'paper-metal', motif: 'thread', motion: 'stitch' },
  blooming: { family: 'envelope', skin: 'paper-garden', motif: 'garden', motion: 'bloom' },

  electric: { family: 'celestial', skin: 'sky-electric', motif: 'monogram', motion: 'pulse' },
  orbit: { family: 'celestial', skin: 'sky-silver', motif: 'orbit', motion: 'orbit' },
  stars: { family: 'celestial', skin: 'sky-earth', motif: 'starfield', motion: 'expand' },
  cosmos: { family: 'celestial', skin: 'sky-violet', motif: 'constellation', motion: 'expand' },
  nightcity: { family: 'celestial', skin: 'sky-city', motif: 'skyline', motion: 'rise' },

  blocks: { family: 'editorial', skin: 'press-primary', motif: 'blocks', motion: 'fold' },
  type: { family: 'editorial', skin: 'press-type', motif: 'letter', motion: 'slide' },
  magazine: { family: 'editorial', skin: 'press-ivory', motif: 'rule', motion: 'fold' },
  newspaper: { family: 'editorial', skin: 'press-news', motif: 'columns', motion: 'press' },
  editorial: { family: 'editorial', skin: 'press-sage', motif: 'grid', motion: 'fold' },
  couture: { family: 'editorial', skin: 'press-couture', motif: 'stitch', motion: 'drape' },
  cover: { family: 'editorial', skin: 'press-cover', motif: 'frame', motion: 'reveal' },
  society: { family: 'editorial', skin: 'press-society', motif: 'crest', motion: 'fold' },

  woven: { family: 'gates', skin: 'gate-forest', motif: 'weave', motion: 'swing' },
  mehndi: { family: 'gates', skin: 'gate-clay', motif: 'lace', motion: 'bloom' },
  textile: { family: 'gates', skin: 'gate-royal', motif: 'stripe', motion: 'swing' },
  crossweave: { family: 'gates', skin: 'gate-gold', motif: 'cross', motion: 'rise' },
}

const DEFAULT_INTRO_RECIPE = {
  family: 'envelope',
  skin: 'paper-quiet',
  motif: 'single-line',
  motion: 'lift',
}

function getIntroRecipe(design) {
  return INTRO_RECIPES[design.variant] || DEFAULT_INTRO_RECIPE
}

const TRANSITION_FAMILIES = [
  ['handwrite', /handwrite|line-draw|neon-trace/],
  ['typewriter', /typewriter|serif-type|letterpress|newsprint/],
  ['ripple', /ripple|wave|tide|watercolor|mist/],
  ['orbit', /orbit|star|constellation|celestial/],
  ['shutter', /shutter|flash|iris|exposure|film-burn|reel/],
  ['weave', /weave|loom|thread|stitch|bow|drape|lace/],
  ['bloom', /bloom|flower|garden|petal|silk|ink|glow/],
  ['stamp', /stamp|emboss|press|print|clay|crown/],
  ['split', /split|slide|page-turn|fold|peel|unfurl|glass/],
  ['wipe', /wipe|wash|sweep|sunrise|skyline|dawn|light/],
]

function getTransitionFamily(transition = '') {
  return TRANSITION_FAMILIES.find(([, matcher]) => matcher.test(transition))?.[0] || 'kinetic'
}

function contrastInk(hex = '') {
  const value = hex.replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(value)) return '#f7f4ef'
  const channels = [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16) / 255)
  const luminance = channels.reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0)
  return luminance > 0.62 ? '#151719' : '#f8f5ef'
}

function AnimatedPhrase({ text }) {
  let characterIndex = 0

  return (
    <span className="ii-transition__words" aria-hidden="true">
      {text.split(' ').map((word, wordIndex) => (
        <span
          className="ii-transition__word"
          key={`${word}-${wordIndex}`}
          style={{ '--ii-word-index': wordIndex }}
        >
          {word.split('').map((character, localIndex) => {
            const index = characterIndex
            characterIndex += 1
            return (
              <span
                className="ii-transition__character"
                key={`${character}-${localIndex}`}
                style={{ '--ii-character-index': index }}
              >
                {character}
              </span>
            )
          })}
        </span>
      ))}
    </span>
  )
}

function TransitionInterlude({ experience, visible }) {
  const transitionFamily = getTransitionFamily(experience.transition)

  return (
    <div
      className="ii-transition"
      data-transition={experience.transition}
      data-transition-family={transitionFamily}
      aria-hidden={!visible}
    >
      <span className="ii-transition__texture" aria-hidden="true" />
      <span className="ii-transition__ornament" aria-hidden="true">
        <i /><i /><i /><i />
      </span>
      <div className="ii-transition__copy">
        <h2 aria-label={experience.phrase}>
          <AnimatedPhrase text={experience.phrase} />
        </h2>
        <p>{experience.subline}</p>
      </div>
    </div>
  )
}

function Initials({ design }) {
  return <>{design.couple[0][0]}{design.couple[1][0]}</>
}

function VariantMotif() {
  return <span className="ii-variant-motif" aria-hidden="true" />
}

const FALLBACK_ARTWORK = {
  textile: '/images/wedding-celebration.webp',
  envelope: '/images/wedding-flowers.webp',
  editorial: '/images/wedding-couple.webp',
  destination: '/images/ocean.webp',
  cinematic: '/images/wedding-dance.webp',
  gates: '/images/wedding-flowers.webp',
  celestial: '/images/city-night.webp',
}

function artworkStyle(design) {
  const family = getIntroRecipe(design).family
  const artwork = design.image || FALLBACK_ARTWORK[family]
  return artwork ? { '--ii-art': `url("${artwork}")` } : undefined
}

function InvitationFace({ design, className = '' }) {
  const [first, second] = design.couple

  return (
    <span className={`ii-card ${className}`}>
      <span className="ii-card__art" aria-hidden="true" />
      <span className="ii-card__occasion">We’re getting married</span>
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
    <span className="ii-object ii-envelope" style={artworkStyle(design)} aria-hidden="true">
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
      <VariantMotif />
      <span className="ii-envelope__seal"><Initials design={design} /></span>
    </span>
  )
}

function GateVisual({ design }) {
  return (
    <span className="ii-object ii-palace" style={artworkStyle(design)} aria-hidden="true">
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
      <VariantMotif />
      <span className="ii-palace__handles" />
    </span>
  )
}

function CelestialVisual({ design }) {
  return (
    <span className="ii-object ii-celestial" style={artworkStyle(design)} aria-hidden="true">
      <span className="ii-celestial__orbit ii-celestial__orbit--outer" />
      <span className="ii-celestial__orbit ii-celestial__orbit--inner" />
      <span className="ii-celestial__stars" />
      <span className="ii-celestial__constellation">
        <i /><i /><i /><i /><i /><i />
      </span>
      <InvitationFace design={design} className="ii-celestial__card" />
      <VariantMotif />
      <span className="ii-celestial__disc"><Initials design={design} /></span>
    </span>
  )
}

function EditorialVisual({ design }) {
  const [first, second] = design.couple

  return (
    <span className="ii-object ii-editorial" style={artworkStyle(design)} aria-hidden="true">
      <span className="ii-editorial__shadow" />
      <span className="ii-editorial__sheet">
        <span className="ii-editorial__masthead">The Wedding Edition</span>
        <span className="ii-editorial__headline">{first} &amp; {second}</span>
        <span className="ii-editorial__copy">Nairobi · 16 October 2027</span>
        <span className="ii-editorial__photo"><Initials design={design} /></span>
        <span className="ii-editorial__columns" />
      </span>
      <span className="ii-editorial__fold ii-editorial__fold--left">
        <span>Invitation</span>
      </span>
      <span className="ii-editorial__fold ii-editorial__fold--right">
        <span>Save the date</span>
      </span>
      <VariantMotif />
    </span>
  )
}

function DestinationVisual({ design }) {
  const [first, second] = design.couple

  return (
    <span className="ii-object ii-map" style={artworkStyle(design)} aria-hidden="true">
      <span className="ii-map__shadow" />
      <span className="ii-map__panel ii-map__panel--left">
        <span className="ii-map__photo" />
        <span className="ii-map__coast" />
        <span className="ii-map__place">Nairobi</span>
      </span>
      <span className="ii-map__panel ii-map__panel--middle">
        <span className="ii-map__route" />
        <span className="ii-map__pin" />
        <span className="ii-map__postmark">KE</span>
        <span className="ii-map__invite">
          <small>Save the date</small>
          <span className="ii-map__names">{first}<b>&amp;</b>{second}</span>
          <span>16 October 2027 · Nairobi</span>
        </span>
      </span>
      <span className="ii-map__panel ii-map__panel--right">
        <span className="ii-map__stamp"><Initials design={design} /></span>
        <span className="ii-map__note">Meet us there</span>
        <span className="ii-map__date">16.10.27</span>
      </span>
      <VariantMotif />
      <span className="ii-map__cover">
        <span className="ii-map__cover-back" />
        <span className="ii-map__cover-flap" />
        <span className="ii-map__cover-pocket ii-map__cover-pocket--left" />
        <span className="ii-map__cover-pocket ii-map__cover-pocket--right" />
        <span className="ii-map__cover-pocket ii-map__cover-pocket--bottom" />
        <span className="ii-map__cover-seal"><i /><i /><i /></span>
      </span>
    </span>
  )
}

function CinematicVisual({ design }) {
  const [first, second] = design.couple

  return (
    <span className="ii-object ii-cinema" style={artworkStyle(design)} aria-hidden="true">
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
      <VariantMotif />
    </span>
  )
}

function TextileVisual({ design }) {
  return (
    <span className="ii-object ii-textile" style={artworkStyle(design)} aria-hidden="true">
      <span className="ii-textile__shadow" />
      <InvitationFace design={design} className="ii-textile__card" />
      <span className="ii-textile__cloth ii-textile__cloth--left">
        <span className="ii-textile__weave" />
      </span>
      <span className="ii-textile__cloth ii-textile__cloth--right">
        <span className="ii-textile__weave" />
      </span>
      <VariantMotif />
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

export default function InvitationIntro({ design, onComplete, onUserGesture }) {
  const [phase, setPhase] = useState('closed')
  const timersRef = useRef([])
  const gestureRef = useRef(null)
  const activatedRef = useRef(false)
  const completedRef = useRef(false)
  const recipe = useMemo(() => (design ? getIntroRecipe(design) : DEFAULT_INTRO_RECIPE), [design])
  const experience = useMemo(() => getExperienceRecipe(design), [design])
  const mechanic = recipe.family
  const Visual = visuals[mechanic]

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current = []
  }, [])

  useEffect(() => {
    clearTimers()
    activatedRef.current = false
    completedRef.current = false
    setPhase('closed')
    requestAnimationFrame(() => gestureRef.current?.focus({ preventScroll: true }))
  }, [clearTimers, design?.slug])

  useEffect(() => clearTimers, [clearTimers])

  const finish = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    clearTimers()
    setPhase('complete')
    onComplete?.(design)
  }, [clearTimers, design, onComplete])

  if (!design) return null

  const palette = design.palette || []
  const introStyle = {
    '--ii-one': palette[0] || '#d7dce5',
    '--ii-two': palette[1] || '#141619',
    '--ii-three': palette[2] || '#6686a6',
    '--ii-four': palette[3] || '#2f4e68',
    '--ii-transition-accent': experience.accent,
    '--ii-transition-bg': experience.backdrop,
    '--ii-transition-ink': contrastInk(experience.backdrop),
  }

  const reveal = () => {
    if (phase !== 'closed' || activatedRef.current) return
    activatedRef.current = true
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    onUserGesture?.(design)
    setPhase('opening')
    const openingTimer = window.setTimeout(() => {
      setPhase('transition')
      const transitionTimer = window.setTimeout(finish, reduceMotion ? 700 : 2600)
      timersRef.current.push(transitionTimer)
    }, reduceMotion ? 40 : 1080)
    timersRef.current.push(openingTimer)
  }

  const phaseClass = phase === 'transition'
    ? 'ii-is-ready ii-is-transition'
    : `ii-is-${phase}`

  return (
    <section
      className={`invitation-intro ii-type-${mechanic} ${phaseClass}`}
      data-variant={design.variant}
      data-skin={recipe.skin}
      data-motif={recipe.motif}
      data-motion={recipe.motion}
      data-transition={experience.transition}
      data-transition-family={getTransitionFamily(experience.transition)}
      style={introStyle}
      aria-label="Invitation opening"
    >
      <span className="ii-ambient" aria-hidden="true" />

      <div className="ii-stage">
        <div className="ii-mechanic">
          <Visual design={design} />
          <button
            ref={gestureRef}
            className="ii-gesture"
            type="button"
            onClick={reveal}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return
              event.preventDefault()
              reveal()
            }}
            disabled={phase !== 'closed'}
            aria-label="Open invitation"
          >
          </button>
        </div>
      </div>

      <TransitionInterlude experience={experience} visible={phase === 'transition'} />
      <p className="ii-status" aria-live="polite">
        {phase === 'opening' ? 'Opening invitation' : phase === 'transition' ? experience.phrase : ''}
      </p>
    </section>
  )
}
