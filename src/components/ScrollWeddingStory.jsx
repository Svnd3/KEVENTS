import { useEffect, useId, useRef, useState } from 'react'
import { scrollWeddingTemplates } from '../data/scrollWeddingTemplates.js'
import '../scroll-wedding-story.css'

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value))

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h13M13 6l6 6-6 6" />
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

function HeartIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 27S4 20.1 4 11.2C4 7.5 6.7 5 10.1 5c2.4 0 4.6 1.4 5.9 3.5C17.3 6.4 19.5 5 21.9 5 25.3 5 28 7.5 28 11.2 28 20.1 16 27 16 27Z" />
    </svg>
  )
}

function useScrollFilm(storyRef, filmRef, worldRef, videoRef, config) {
  useEffect(() => {
    const story = storyRef.current
    const film = filmRef.current
    const world = worldRef.current
    const video = videoRef.current
    if (!story || !film || !world || !video) return undefined

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches || navigator.connection?.saveData
    const words = [...film.querySelectorAll('[data-scroll-word]')]
    const sceneCounter = film.querySelector('[data-scene-counter]')
    let heroTarget = 0
    let heroCurrent = 0
    let worldTarget = 0
    let worldCurrent = 0
    let frame = 0
    let lastScene = -1
    let worldIsNear = true
    let previousTick = performance.now()
    let lastSeek = 0

    const setPalette = (progress) => {
      if (config.id === 'love-bomb') {
        story.style.setProperty('--line-one', `hsl(${338 + progress * 52} 88% 69%)`)
        story.style.setProperty('--line-two', `hsl(${165 + progress * 55} 72% 70%)`)
        story.style.setProperty('--line-three', `hsl(${45 + progress * 35} 94% 66%)`)
      } else {
        story.style.setProperty('--line-one', `hsl(${194 + progress * 34} 64% 78%)`)
        story.style.setProperty('--line-two', `hsl(${266 + progress * 40} 58% 84%)`)
        story.style.setProperty('--line-three', `hsl(${16 + progress * 30} 78% 84%)`)
      }
    }

    const paint = (heroProgress, worldProgress, now) => {
      story.style.setProperty('--film-progress', heroProgress.toFixed(4))
      story.style.setProperty('--world-progress', worldProgress.toFixed(4))
      setPalette(worldProgress)

      const scene = heroProgress < 0.17 ? 0 : heroProgress < 0.35 ? 1 : heroProgress < 0.57 ? 2 : heroProgress < 0.76 ? 3 : 4
      if (scene !== lastScene) {
        film.dataset.scene = String(scene)
        if (sceneCounter) sceneCounter.textContent = String(scene + 1).padStart(2, '0')
        lastScene = scene
      }

      words.forEach((word, index) => {
        const wordProgress = clamp((heroProgress - (0.35 + index * 0.024)) / 0.075)
        word.style.setProperty('--word-reveal', wordProgress.toFixed(3))
      })

      let roseX
      let roseY
      let roseRotation
      let roseScale
      if (config.persistentRose) {
        const orbit = worldProgress * Math.PI * 6
        roseX = 37 * Math.cos(orbit)
        roseY = 6 + 19 * Math.sin(orbit + .55)
        roseRotation = 6 + 26 * Math.cos(orbit)
        roseScale = .54 + Math.sin(orbit + .8) * .035
      } else if (config.roseKind === 'stem') {
        roseX = -54 + heroProgress * 111
        roseY = 34 - heroProgress * 69 + Math.sin(heroProgress * Math.PI) * 8
        roseRotation = -12 + heroProgress * 31
        roseScale = 1.02 - heroProgress * 0.22
      } else {
        roseX = -42 + heroProgress * 86
        roseY = 32 - Math.sin(heroProgress * Math.PI) * 42 - heroProgress * 21
        roseRotation = -24 + heroProgress * 224
        roseScale = 1.08 - heroProgress * 0.43
      }
      story.style.setProperty('--rose-x', `${roseX.toFixed(2)}vw`)
      story.style.setProperty('--rose-y', `${roseY.toFixed(2)}vh`)
      story.style.setProperty('--rose-turn', `${roseRotation.toFixed(2)}deg`)
      story.style.setProperty('--rose-scale', roseScale.toFixed(3))
      story.style.setProperty('--rose-opacity', config.persistentRose ? '.84' : clamp((0.94 - heroProgress) / 0.11).toFixed(3))

      if (video.duration && Number.isFinite(video.duration) && video.readyState >= 2) {
        const desiredTime = worldProgress * Math.max(0, video.duration - 0.08)
        if (!video.seeking && now - lastSeek >= 33 && Math.abs(desiredTime - video.currentTime) > 0.032) {
          video.currentTime = desiredTime
          lastSeek = now
        }
      }
    }

    const tick = (now) => {
      const heroDelta = heroTarget - heroCurrent
      const worldDelta = worldTarget - worldCurrent
      const elapsed = Math.min(80, Math.max(0, now - previousTick))
      const heroDamping = 1 - Math.exp(-elapsed / 92)
      const worldDamping = 1 - Math.exp(-elapsed / 118)
      previousTick = now
      heroCurrent = Math.abs(heroDelta) < 0.0005 ? heroTarget : heroCurrent + heroDelta * heroDamping
      worldCurrent = Math.abs(worldDelta) < 0.0005 ? worldTarget : worldCurrent + worldDelta * worldDamping
      paint(heroCurrent, worldCurrent, now)
      if (Math.abs(heroTarget - heroCurrent) > 0.0005 || Math.abs(worldTarget - worldCurrent) > 0.0005) {
        frame = window.requestAnimationFrame(tick)
      } else {
        frame = 0
      }
    }

    const measure = () => {
      const filmRect = film.getBoundingClientRect()
      const worldRect = world.getBoundingClientRect()
      const heroDistance = Math.max(1, filmRect.height - window.innerHeight)
      const worldDistance = Math.max(1, worldRect.height - window.innerHeight)
      heroTarget = clamp(-filmRect.top / heroDistance)
      worldTarget = clamp(-worldRect.top / worldDistance)
      if (!frame) frame = window.requestAnimationFrame(tick)
    }

    const resumeAfterSeek = () => {
      if (!frame) frame = window.requestAnimationFrame(tick)
    }

    const handleScroll = () => {
      if (worldIsNear) measure()
    }

    const worldObserver = 'IntersectionObserver' in window
      ? new IntersectionObserver(([entry]) => {
        worldIsNear = entry.isIntersecting
        if (worldIsNear) measure()
      }, { rootMargin: '80% 0px' })
      : null

    const showReducedState = () => {
      story.classList.add('is-reduced-motion')
      film.dataset.scene = '0'
      words.forEach((word) => word.style.setProperty('--word-reveal', '1'))
      setPalette(0.35)
      const seekPosterFrame = () => {
        if (video.duration && Number.isFinite(video.duration)) video.currentTime = video.duration * 0.45
      }
      video.addEventListener('loadedmetadata', seekPosterFrame, { once: true })
      seekPosterFrame()
      return () => video.removeEventListener('loadedmetadata', seekPosterFrame)
    }

    if (reduceMotion) return showReducedState()

    video.load()
    video.addEventListener('seeked', resumeAfterSeek)
    video.addEventListener('loadedmetadata', measure)
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', measure)
    worldObserver?.observe(world)
    measure()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', measure)
      video.removeEventListener('seeked', resumeAfterSeek)
      video.removeEventListener('loadedmetadata', measure)
      worldObserver?.disconnect()
      window.cancelAnimationFrame(frame)
    }
  }, [config, filmRef, storyRef, videoRef, worldRef])
}

function useScrollTypography(storyRef) {
  useEffect(() => {
    const story = storyRef.current
    if (!story) return undefined

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const reveals = [...story.querySelectorAll('[data-scroll-reveal]')]
    const motions = [...story.querySelectorAll('[data-scroll-motion]')]
    const carousels = [...story.querySelectorAll('[data-day-carousel]')]
    let frame = 0

    const paint = () => {
      const viewport = window.innerHeight

      reveals.forEach((block) => {
        const rect = block.getBoundingClientRect()
        const progress = reducedMotion ? 1 : clamp((viewport * .88 - rect.top) / Math.max(180, viewport * .44))
        const exit = reducedMotion ? 1 : clamp((rect.bottom - viewport * .08) / Math.max(130, viewport * .27))
        block.style.setProperty('--line-reveal', progress.toFixed(3))
        block.style.setProperty('--line-exit', exit.toFixed(3))

        const characters = block.querySelectorAll('[data-scroll-char]')
        const count = characters.length
        characters.forEach((character, index) => {
          const characterProgress = clamp((progress * (count + 5) - index) / 5)
          character.style.setProperty('--char-reveal', characterProgress.toFixed(3))
        })
      })

      motions.forEach((block) => {
        const rect = block.getBoundingClientRect()
        const enter = reducedMotion ? 1 : clamp((viewport * .93 - rect.top) / Math.max(220, viewport * .58))
        const exit = reducedMotion ? 1 : clamp((rect.bottom - viewport * .06) / Math.max(160, viewport * .34))
        const direction = Number(block.dataset.motionDirection || 0)
        block.style.setProperty('--motion-enter', enter.toFixed(3))
        block.style.setProperty('--motion-exit', exit.toFixed(3))
        block.style.setProperty('--motion-opacity', (enter * exit).toFixed(3))
        block.style.setProperty('--motion-x', `${(direction * ((1 - enter) * 38 - (1 - exit) * 18)).toFixed(2)}vw`)
        block.style.setProperty('--motion-y', `${((1 - enter) * 46 - (1 - exit) * 22).toFixed(2)}px`)
        block.style.setProperty('--motion-scale', (.94 + enter * .06).toFixed(3))
        block.style.setProperty('--motion-turn', `${(direction * (1 - enter) * -4).toFixed(2)}deg`)
      })

      carousels.forEach((track) => {
        const rect = track.getBoundingClientRect()
        const cards = [...track.querySelectorAll('.sw-venue')]
        const travel = Math.max(1, cards.length - 1)
        const simplifyCarousel = reducedMotion || window.matchMedia('(max-height: 600px) and (orientation: landscape)').matches
        const progress = simplifyCarousel ? 0 : clamp(-rect.top / Math.max(1, rect.height - viewport))
        const activeIndex = Math.round(progress * travel)
        track.style.setProperty('--carousel-progress', progress.toFixed(3))

        cards.forEach((card, index) => {
          const phase = simplifyCarousel ? 0 : progress * travel - index
          const distance = Math.min(1.35, Math.abs(phase))
          const horizontal = clamp(-phase, -1.25, 1.25) * 86
          const vertical = Math.pow(distance, 1.55) * 112
          const opacity = simplifyCarousel ? 1 : clamp(1 - Math.max(0, distance - .08) * 1.12)
          const scale = 1 - Math.min(distance, 1) * .12
          const rotation = clamp(-phase * 9, -11, 11)
          const isActive = simplifyCarousel || index === activeIndex

          card.style.setProperty('--card-x', `${horizontal.toFixed(2)}vw`)
          card.style.setProperty('--card-y', `${vertical.toFixed(2)}px`)
          card.style.setProperty('--card-scale', scale.toFixed(3))
          card.style.setProperty('--card-turn', `${rotation.toFixed(2)}deg`)
          card.style.setProperty('--card-opacity', opacity.toFixed(3))
          card.style.setProperty('--card-z', String(20 - Math.round(distance * 10)))
          card.setAttribute('aria-hidden', isActive ? 'false' : 'true')
          card.querySelectorAll('a, button, input, select, textarea').forEach((control) => {
            control.tabIndex = isActive ? 0 : -1
          })
        })
      })
      frame = 0
    }

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(paint)
    }

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    schedule()

    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      window.cancelAnimationFrame(frame)
    }
  }, [storyRef])
}

function ScrollLine({ as: Tag = 'span', children, className = '', tone = 1 }) {
  const text = String(children)
  let characterIndex = 0
  return (
    <Tag className={`sw-scroll-line sw-scroll-line--tone-${tone} ${className}`} data-scroll-reveal>
      <span className="sw-scroll-line__visible" aria-hidden="true">
        {text.split(' ').map((word, wordIndex) => (
          <span className="sw-scroll-line__word" key={`${word}-${wordIndex}`}>
            {[...word].map((character) => {
              const index = characterIndex
              characterIndex += 1
              return <span className="sw-scroll-line__char" data-scroll-char key={`${character}-${index}`}>{character}</span>
            })}
            {wordIndex < text.split(' ').length - 1 ? '\u00a0' : ''}
          </span>
        ))}
      </span>
      <span className="sr-only">{text}</span>
    </Tag>
  )
}

function PersistentFilm({ config, videoRef }) {
  return (
    <div className="sw-film-bg" aria-hidden="true">
      <div className="sw-film-bg__wash" />
      <video
        className="sw-film-bg__video"
        ref={videoRef}
        muted
        playsInline
        preload="auto"
        poster={config.poster}
        tabIndex={-1}
      >
        <source src={config.video} type="video/mp4" />
      </video>
      {config.persistentRose && (
        <img className={`sw-film-bg__rose sw-film__rose sw-film__rose--${config.roseKind}`} src={config.rose} alt="" />
      )}
      <div className="sw-film-bg__scrim" />
      <div className="sw-film-bg__grain" />
    </div>
  )
}

function FilmHero({ config, storyRef, worldRef, videoRef }) {
  const filmRef = useRef(null)
  useScrollFilm(storyRef, filmRef, worldRef, videoRef, config)

  const movePastFilm = () => {
    document.getElementById(`${config.id}-invitation`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className="sw-film" ref={filmRef} aria-label={`${config.couple.join(' and ')} wedding announcement`}>
      <h1 className="sr-only">{config.couple[0]} and {config.couple[1]} are getting married on {config.date}</h1>
      <p className="sr-only">{config.eyebrow}. {config.heroLines.join(' ')} {config.revealWords.join(' ')} {config.sceneLines.join(' ')}</p>
      <div className="sw-film__stage">
        {!config.persistentRose && <img className={`sw-film__rose sw-film__rose--${config.roseKind}`} src={config.rose} alt="" aria-hidden="true" />}

        <div className="sw-film__scenes" aria-hidden="true">
          <div className="sw-film__scene sw-film__scene--0">
            <p>{config.eyebrow}</p>
            <div className="sw-film__names">
              <span className="sw-color-line">{config.couple[0]}</span>
              <i>&amp;</i>
              <span className="sw-color-line">{config.couple[1]}</span>
            </div>
            <small>{config.dateShort} · {config.city}</small>
          </div>

          <div className="sw-film__scene sw-film__scene--1">
            <div className="sw-film__statement">
              <span className="sw-color-line">{config.heroLines[0]}</span>
              <span className="sw-color-line">{config.heroLines[1]}</span>
            </div>
          </div>

          <div className="sw-film__scene sw-film__scene--2">
            <div className="sw-film__word-reveal">
              {config.revealWords.map((word) => <span key={word} data-scroll-word>{word}</span>)}
            </div>
          </div>

          <div className="sw-film__scene sw-film__scene--3">
            <div className="sw-film__vibe-lines">
              {config.sceneLines.map((line, index) => (
                <span className="sw-color-line" key={line} style={{ '--line-number': index }}>{line}</span>
              ))}
            </div>
          </div>

          <div className="sw-film__scene sw-film__scene--4">
            <p className="sw-film__final-kicker">The date is set</p>
            <strong>{config.date}</strong>
            <span>{config.city}</span>
          </div>
        </div>

        <div className="sw-film__reduced-copy" aria-hidden="true">
          <span>{config.eyebrow}</span>
          <strong>{config.couple[0]} &amp; {config.couple[1]}</strong>
          <p>{config.heroLines.join(' ')} {config.revealWords.join(' ')}</p>
          <small>{config.dateShort} · {config.city}</small>
        </div>

        <button className="sw-film__skip" type="button" onClick={movePastFilm}>
          <span>Skip to the invite</span>
          <i aria-hidden="true">↓</i>
        </button>
        <div className="sw-film__counter" aria-hidden="true"><span data-scene-counter>01</span><i /><span>05</span></div>
      </div>
    </section>
  )
}

function InvitationNote({ config }) {
  return (
    <section className="sw-note" id={`${config.id}-invitation`}>
      <div className="sw-note__label"><span>A note from us</span><i /></div>
      <div className="sw-note__copy">
        <h2>
          {config.inviteLines.map((line) => <ScrollLine key={line} tone={0}>{line}</ScrollLine>)}
        </h2>
        <p>
          {config.inviteBodyLines.map((line, index) => <ScrollLine key={line} tone={index === 0 ? 0 : (index % 3) + 1}>{line}</ScrollLine>)}
        </p>
        <ScrollLine as="strong" tone={0}>{config.couple[0]} &amp; {config.couple[1]}</ScrollLine>
      </div>
      <div className="sw-note__stamp" aria-hidden="true"><HeartIcon /><span>with love<br />from Nairobi</span></div>
    </section>
  )
}

function WeddingMap({ config }) {
  const [mapReady, setMapReady] = useState(false)

  return (
    <section className={`sw-map sw-map--${config.mapTone}`}>
      <header className="sw-section-heading">
        <span>Three stops · one very good day</span>
        <h2>
          <ScrollLine tone={1}>Find the</ScrollLine>
          <ScrollLine tone={2}>whole plot.</ScrollLine>
        </h2>
      </header>

      <div className="sw-map__frame">
        <img className="sw-map__fallback" src="/images/acacia-garden-map.webp" alt="" loading="lazy" decoding="async" />
        <iframe
          className={mapReady ? 'is-ready' : ''}
          title={`Map of ${config.city} wedding venues`}
          src={config.mapEmbed}
          loading="lazy"
          onLoad={() => setMapReady(true)}
          referrerPolicy="no-referrer-when-downgrade"
          tabIndex={-1}
        />
        <div className="sw-map__tint" aria-hidden="true" />
        <svg className="sw-map__route" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true">
          <path d="M174 431C308 507 357 254 511 302S703 182 838 129" />
        </svg>
        <span className="sw-map__pin sw-map__pin--one">1</span>
        <span className="sw-map__pin sw-map__pin--two">2</span>
        <span className="sw-map__pin sw-map__pin--three">3</span>
        <div className="sw-map__legend">
          {config.venues.map((venue) => <span key={venue.number}><b>{venue.number}</b>{venue.venue}</span>)}
        </div>
        <a className="sw-map__link" href={config.mapLink} target="_blank" rel="noreferrer">
          Open the full route <ArrowIcon />
        </a>
      </div>
      <p className="sw-map__credit">Map data © OpenStreetMap contributors</p>
    </section>
  )
}

function DayPlan({ config }) {
  const venueCards = config.venues.map((venue, index) => (
    <article
      className="sw-venue"
      data-scroll-motion={config.dayPlanMotion === 'stack' ? '' : undefined}
      key={venue.number}
      style={{ '--venue-color': venue.color, '--venue-index': index }}
    >
      <div className="sw-venue__photo">
        <img src={venue.image} alt="" loading="lazy" decoding="async" />
        <span>{venue.title}</span>
      </div>
      <div className="sw-venue__details">
        <div className="sw-venue__number">{venue.number}</div>
        <time>{venue.time}</time>
        <h3>{venue.venue}</h3>
        <p>{venue.title}</p>
        <small>{venue.note}</small>
        <a href={venue.directions} target="_blank" rel="noreferrer"><PinIcon /> Directions</a>
      </div>
    </article>
  ))

  return (
    <section className="sw-plan">
      <header className="sw-section-heading sw-section-heading--plan">
        <span>{config.date}</span>
        <h2>
          <ScrollLine tone={2}>Here’s how</ScrollLine>
          <ScrollLine tone={3}>the day moves.</ScrollLine>
        </h2>
        <p>Three places. Zero boring bits.</p>
      </header>

      <div className={`sw-plan__stack ${config.dayPlanMotion === 'orbit' ? 'sw-plan__stack--orbit' : ''}`} data-day-carousel={config.dayPlanMotion === 'orbit' ? 'true' : undefined}>
        {config.dayPlanMotion === 'orbit' ? (
          <div className="sw-plan__carousel">
            {venueCards}
            <div className="sw-plan__carousel-index" aria-hidden="true">
              {config.venues.map((venue) => <i key={venue.number} />)}
            </div>
          </div>
        ) : venueCards}
      </div>
    </section>
  )
}

function VibeCheck({ config }) {
  const items = config.id === 'love-bomb'
    ? [['01', 'Big vows', 'Tiny tissues.'], ['02', 'Good food', 'Come hungry.'], ['03', 'Bad dancing', 'Commit anyway.']]
    : [['01', 'Soft tears', 'Waterproof mascara.'], ['02', 'Sharp fits', 'Bring the look.'], ['03', 'Late cake', 'Save some room.']]

  return (
    <section className="sw-vibes">
      <header>
        <span>What’s going down</span>
        <h2>
          <ScrollLine tone={3}>Short</ScrollLine>
          <ScrollLine tone={1}>version.</ScrollLine>
        </h2>
      </header>
      <div className="sw-vibes__beats">
        {items.map(([number, title, copy], index) => (
          <article
            className={`sw-vibes__beat sw-vibes__beat--${index + 1}`}
            data-scroll-motion
            data-motion-direction={index % 2 ? 1 : -1}
            key={number}
            style={{ '--beat-color': config.venues[index].color, '--beat-direction': index % 2 ? 1 : -1 }}
          >
            <span>{number} / 03</span>
            <h3><ScrollLine tone={0}>{title}</ScrollLine></h3>
            <p><ScrollLine tone={0}>{copy}</ScrollLine></p>
          </article>
        ))}
      </div>
    </section>
  )
}

function RSVP({ config }) {
  const formId = useId()
  const [attendance, setAttendance] = useState('yes')
  const [status, setStatus] = useState('idle')
  const endpoint = import.meta.env.VITE_RSVP_ENDPOINT || import.meta.env.VITE_ENQUIRY_ENDPOINT

  const submit = async (event) => {
    event.preventDefault()
    setStatus('sending')
    const form = event.currentTarget
    const payload = new FormData(form)
    payload.set('template', config.label)

    try {
      if (endpoint) {
        const response = await fetch(endpoint, {
          method: 'POST',
          body: payload,
          headers: { Accept: 'application/json' },
        })
        if (!response.ok) throw new Error('RSVP could not be sent')
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, 450))
      }
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <section className="sw-rsvp sw-rsvp--success" aria-live="polite">
        <HeartIcon />
        <p>RSVP received</p>
        <h2>You’re officially part of the plot.</h2>
        <span>{endpoint ? 'We’ll see you there.' : 'Demo complete — connect VITE_RSVP_ENDPOINT to receive guest replies.'}</span>
      </section>
    )
  }

  return (
    <section className="sw-rsvp">
      <div className="sw-rsvp__intro">
        <span>Reply by {config.replyBy}</span>
        <h2>
          <ScrollLine tone={1}>Are you</ScrollLine>
          <ScrollLine tone={2}>in?</ScrollLine>
        </h2>
        <p>Save your seat, your plate, and your place on the dance floor.</p>
      </div>

      <form className="sw-rsvp__form" onSubmit={submit}>
        <fieldset>
          <legend>Can you make it?</legend>
          <label className={attendance === 'yes' ? 'is-selected' : ''}>
            <input type="radio" name="attendance" value="yes" checked={attendance === 'yes'} onChange={() => setAttendance('yes')} />
            <span>{config.attendance[0]}</span><i>Yes</i>
          </label>
          <label className={attendance === 'no' ? 'is-selected' : ''}>
            <input type="radio" name="attendance" value="no" checked={attendance === 'no'} onChange={() => setAttendance('no')} />
            <span>{config.attendance[1]}</span><i>No</i>
          </label>
        </fieldset>

        <label htmlFor={`${formId}-name`}><span>Your full name</span><input id={`${formId}-name`} name="name" autoComplete="name" required /></label>
        <label htmlFor={`${formId}-contact`}><span>Email or phone</span><input id={`${formId}-contact`} name="contact" autoComplete="email" required /></label>

        {attendance === 'yes' && (
          <>
            <div className="sw-rsvp__row">
              <label htmlFor={`${formId}-guest`}><span>Plus-one name</span><input id={`${formId}-guest`} name="guest" /></label>
              <label htmlFor={`${formId}-meal`}>
                <span>Meal</span>
                <select id={`${formId}-meal`} name="meal" defaultValue="">
                  <option value="" disabled>Choose one</option>
                  <option>Chicken</option><option>Beef</option><option>Vegetarian</option><option>Vegan</option>
                </select>
              </label>
            </div>
            <label htmlFor={`${formId}-dietary`}><span>Allergies or accessibility needs</span><input id={`${formId}-dietary`} name="dietary" /></label>
            <label htmlFor={`${formId}-song`}><span>One song that gets you dancing</span><input id={`${formId}-song`} name="song" /></label>
          </>
        )}

        <label htmlFor={`${formId}-note`}><span>Leave us a note</span><textarea id={`${formId}-note`} name="note" rows="3" /></label>
        {status === 'error' && <p className="sw-rsvp__error" role="alert">That didn’t send. Please try once more.</p>}
        <button type="submit" disabled={status === 'sending'}>
          <span>{status === 'sending' ? 'Sending…' : config.submitLabel}</span><ArrowIcon />
        </button>
      </form>
    </section>
  )
}

export default function ScrollWeddingStory({ design }) {
  const config = scrollWeddingTemplates[design.variant]
  const storyRef = useRef(null)
  const worldRef = useRef(null)
  const videoRef = useRef(null)
  useScrollTypography(storyRef)
  if (!config) return null

  return (
    <div className={`sw-story sw-story--${config.id}`} ref={storyRef}>
      <div className="sw-film-world" ref={worldRef}>
        <PersistentFilm config={config} videoRef={videoRef} />
        <div className="sw-film-world__content">
          <FilmHero config={config} storyRef={storyRef} worldRef={worldRef} videoRef={videoRef} />
          <InvitationNote config={config} />
          <WeddingMap config={config} />
          <DayPlan config={config} />
          <VibeCheck config={config} />
          <RSVP config={config} />
        </div>
      </div>
      <footer className="sw-ending">
        <img src={config.rose} alt="" loading="lazy" />
        <p>Come for the vows.<br /><span>Stay for the lore.</span></p>
        <div><strong>{config.couple[0]} &amp; {config.couple[1]}</strong><span>{config.date} · {config.city}</span></div>
      </footer>
    </div>
  )
}
