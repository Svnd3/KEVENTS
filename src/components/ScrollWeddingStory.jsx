import { useEffect, useId, useRef, useState } from 'react'
import { scrollWeddingTemplates } from '../data/scrollWeddingTemplates.js'
import '../scroll-wedding-story.css'

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value))

const persistentRosePath = [
  { x: 30, y: -1, turn: 90, scale: .85, mobile: { x: 26.4, y: -1, turn: 90, scale: .82 } },
  { x: -27, y: 8, turn: -4, scale: .7, mobile: { x: -16, y: 8, turn: -4, scale: .67 } },
  { x: -10, y: -5, turn: 45, scale: .66, mobile: { x: -8, y: -5, turn: 45, scale: .63 } },
  { x: 30, y: -6, turn: 90, scale: .72, mobile: { x: 31.5, y: -6, turn: 90, scale: .68 } },
  { x: -28, y: -10, turn: -12, scale: .68, mobile: { x: -16.5, y: -10, turn: -12, scale: .64 } },
  { x: 28, y: -9, turn: 10, scale: .67, mobile: { x: 18, y: -9, turn: 10, scale: .64 } },
  { x: -27, y: 15, turn: 72, scale: .66, mobile: { x: 27, y: -12, turn: 72, scale: .62 } },
  { x: 24, y: -4, turn: 15, scale: .52, mobile: { x: 16, y: -4, turn: 15, scale: .48 } },
]

const smoothStep = (value) => value * value * (3 - 2 * value)

const getDocumentTop = (element) => {
  let top = 0
  let current = element
  while (current) {
    top += current.offsetTop
    current = current.offsetParent
  }
  return top
}

function useReducedMotionPreference() {
  const [reducedMotion, setReducedMotion] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ))

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setReducedMotion(preference.matches)
    preference.addEventListener?.('change', updatePreference)
    if (!preference.addEventListener) preference.addListener(updatePreference)
    updatePreference()
    return () => {
      preference.removeEventListener?.('change', updatePreference)
      if (!preference.removeEventListener) preference.removeListener(updatePreference)
    }
  }, [])

  return reducedMotion
}

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
  const reducedMotion = useReducedMotionPreference()

  useEffect(() => {
    const story = storyRef.current
    const film = filmRef.current
    const world = worldRef.current
    const video = videoRef.current
    if (!story || !film || !world || !video) return undefined

    const words = [...film.querySelectorAll('[data-scroll-word]')]
    const wordValues = words.map(() => '')
    const sceneCounter = film.querySelector('[data-scene-counter]')
    const roseAnchors = config.persistentRose
      ? [
          '.sw-note__copy h2',
          '.sw-map .sw-section-heading h2',
          '.sw-plan .sw-section-heading h2',
          '.sw-vibes > header h2',
          '.sw-rsvp__intro h2',
        ].map((selector) => world.querySelector(selector)).filter(Boolean)
      : []
    const rose = config.persistentRose
      ? story.querySelector('.sw-film-bg__rose')
      : film.querySelector('.sw-film__rose')
    let heroTarget = 0
    let heroCurrent = 0
    let worldTarget = 0
    let worldCurrent = 0
    let frame = 0
    let lastScene = -1
    let worldIsNear = true
    let previousTick = performance.now()
    let lastSeek = 0
    let roseStops = persistentRosePath.map((_, index) => index / (persistentRosePath.length - 1))
    let filmTop = 0
    let filmHeight = 1
    let worldTop = 0
    let worldHeight = 1
    let lastFilmProgress = ''
    let lastPalette = ''
    let lastRoseTransform = ''
    let lastRoseOpacity = ''
    let mobileLayout = window.innerWidth <= 680

    const setPalette = (progress) => {
      const hues = config.id === 'love-bomb'
        ? [338 + progress * 52, 165 + progress * 55, 45 + progress * 35]
        : [194 + progress * 34, 266 + progress * 40, 16 + progress * 30]
      const roundedHues = hues.map(Math.round)
      const palette = roundedHues.join(':')
      if (palette === lastPalette) return

      const [one, two, three] = roundedHues
      if (config.id === 'love-bomb') {
        story.style.setProperty('--line-one', `hsl(${one} 88% 69%)`)
        story.style.setProperty('--line-two', `hsl(${two} 72% 70%)`)
        story.style.setProperty('--line-three', `hsl(${three} 94% 66%)`)
      } else {
        story.style.setProperty('--line-one', `hsl(${one} 64% 78%)`)
        story.style.setProperty('--line-two', `hsl(${two} 58% 84%)`)
        story.style.setProperty('--line-three', `hsl(${three} 78% 84%)`)
      }
      lastPalette = palette
    }

    const paint = (heroProgress, worldProgress, now) => {
      const filmProgress = heroProgress.toFixed(4)
      if (filmProgress !== lastFilmProgress) {
        film.style.setProperty('--film-progress', filmProgress)
        lastFilmProgress = filmProgress
      }
      setPalette(worldProgress)

      const scene = heroProgress < 0.17 ? 0 : heroProgress < 0.35 ? 1 : heroProgress < 0.57 ? 2 : heroProgress < 0.76 ? 3 : 4
      if (scene !== lastScene) {
        film.dataset.scene = String(scene)
        if (sceneCounter) sceneCounter.textContent = String(scene + 1).padStart(2, '0')
        lastScene = scene
      }

      words.forEach((word, index) => {
        const wordProgress = clamp((heroProgress - (0.35 + index * 0.024)) / 0.075)
        const wordValue = wordProgress.toFixed(3)
        if (wordValue === wordValues[index]) return
        word.style.setProperty('--word-reveal', wordValue)
        wordValues[index] = wordValue
      })

      let roseX
      let roseY
      let roseRotation
      let roseScale
      if (config.persistentRose) {
        const matchingStop = roseStops.findIndex((stop) => worldProgress <= stop)
        const toIndex = matchingStop === -1 ? roseStops.length - 1 : Math.max(1, matchingStop)
        const fromIndex = Math.min(toIndex - 1, persistentRosePath.length - 2)
        const segmentStart = roseStops[fromIndex]
        const segmentEnd = roseStops[toIndex] ?? 1
        const segmentProgress = clamp((worldProgress - segmentStart) / Math.max(.0001, segmentEnd - segmentStart))
        const easedProgress = smoothStep(segmentProgress)
        const from = persistentRosePath[fromIndex]
        const to = persistentRosePath[toIndex] ?? persistentRosePath.at(-1)
        const fromPose = mobileLayout ? from.mobile : from
        const toPose = mobileLayout ? to.mobile : to
        const curve = Math.sin(segmentProgress * Math.PI)

        roseX = fromPose.x + (toPose.x - fromPose.x) * easedProgress
        roseY = fromPose.y + (toPose.y - fromPose.y) * easedProgress + curve * 4
        roseRotation = fromPose.turn + (toPose.turn - fromPose.turn) * easedProgress + curve * (toPose.x > fromPose.x ? 4 : -4)
        roseScale = Math.max(.43, fromPose.scale + (toPose.scale - fromPose.scale) * easedProgress - curve * .18)
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
      if (rose) {
        const roseTransform = `translate(-50%, -50%) translate3d(${roseX.toFixed(2)}vw, ${roseY.toFixed(2)}vh, 0) rotate(${roseRotation.toFixed(2)}deg) scale(${roseScale.toFixed(3)})`
        const roseOpacity = config.persistentRose ? '1' : clamp((0.94 - heroProgress) / 0.11).toFixed(3)
        if (roseTransform !== lastRoseTransform) {
          rose.style.transform = roseTransform
          lastRoseTransform = roseTransform
        }
        if (roseOpacity !== lastRoseOpacity) {
          rose.style.opacity = roseOpacity
          lastRoseOpacity = roseOpacity
        }
      }

      if (video.duration && Number.isFinite(video.duration) && video.readyState >= 2) {
        const desiredTime = worldProgress * Math.max(0, video.duration - 0.08)
        const carouselIsActive = config.dayPlanMotion === 'orbit'
          && worldProgress >= (roseStops[4] ?? 0) - .015
          && worldProgress <= (roseStops[5] ?? 1) + .015
        const seekInterval = carouselIsActive && window.innerWidth <= 680 ? 66 : 33
        if (!video.seeking && now - lastSeek >= seekInterval && Math.abs(desiredTime - video.currentTime) > 0.032) {
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

    const updateLayout = () => {
      filmTop = getDocumentTop(film)
      filmHeight = film.offsetHeight
      worldTop = getDocumentTop(world)
      worldHeight = world.offsetHeight
      mobileLayout = window.innerWidth <= 680
      if (config.persistentRose && roseAnchors.length === persistentRosePath.length - 3) {
        const worldDistance = Math.max(1, worldHeight - window.innerHeight)
        const dateStop = clamp((filmTop - worldTop + Math.max(0, filmHeight - window.innerHeight) * .83) / worldDistance)
        const anchorStops = roseAnchors.map((anchor) => (
          clamp((getDocumentTop(anchor) - worldTop - window.innerHeight * .32) / worldDistance)
        ))
        roseStops = [0, dateStop, ...anchorStops, 1]
      }
    }

    const measure = () => {
      const heroDistance = Math.max(1, filmHeight - window.innerHeight)
      const worldDistance = Math.max(1, worldHeight - window.innerHeight)
      heroTarget = clamp((window.scrollY - filmTop) / heroDistance)
      worldTarget = clamp((window.scrollY - worldTop) / worldDistance)
      if (!frame) frame = window.requestAnimationFrame(tick)
    }

    const handleLayoutChange = () => {
      updateLayout()
      measure()
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
      rose?.style.removeProperty('transform')
      rose?.style.removeProperty('opacity')
      words.forEach((word) => word.style.setProperty('--word-reveal', '1'))
      setPalette(0.35)
      const seekPosterFrame = () => {
        if (video.duration && Number.isFinite(video.duration)) video.currentTime = video.duration * 0.45
      }
      video.addEventListener('loadedmetadata', seekPosterFrame, { once: true })
      seekPosterFrame()
      return () => {
        video.removeEventListener('loadedmetadata', seekPosterFrame)
        story.classList.remove('is-reduced-motion')
      }
    }

    if (reducedMotion) return showReducedState()

    story.classList.remove('is-reduced-motion')
    let disposed = false
    const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(handleLayoutChange) : null
    video.load()
    video.addEventListener('seeked', resumeAfterSeek)
    video.addEventListener('loadedmetadata', measure)
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleLayoutChange)
    story.addEventListener('load', handleLayoutChange, true)
    worldObserver?.observe(world)
    resizeObserver?.observe(world)
    document.fonts?.ready.then(() => {
      if (!disposed) handleLayoutChange()
    })
    updateLayout()
    measure()

    return () => {
      disposed = true
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleLayoutChange)
      story.removeEventListener('load', handleLayoutChange, true)
      video.removeEventListener('seeked', resumeAfterSeek)
      video.removeEventListener('loadedmetadata', measure)
      worldObserver?.disconnect()
      resizeObserver?.disconnect()
      window.cancelAnimationFrame(frame)
    }
  }, [config, filmRef, reducedMotion, storyRef, videoRef, worldRef])
}

function useScrollTypography(storyRef) {
  const reducedMotion = useReducedMotionPreference()

  useEffect(() => {
    const story = storyRef.current
    if (!story) return undefined

    const shortLandscape = window.matchMedia('(max-height: 600px) and (orientation: landscape)')
    const reveals = [...story.querySelectorAll('[data-scroll-reveal]')].map((block) => {
      const characters = [...block.querySelectorAll('[data-scroll-char]')]
      return {
        block,
        characters,
        characterValues: characters.map(() => '0.000'),
        progressValue: '0.000',
        exitValue: '1.000',
        top: 0,
        height: 0,
      }
    })
    const motions = [...story.querySelectorAll('[data-scroll-motion]')].map((block) => ({
      block,
      values: {},
      top: 0,
      height: 0,
    }))
    const carousels = [...story.querySelectorAll('[data-day-carousel]')].map((track) => {
      const cards = [...track.querySelectorAll('.sw-venue')].map((card) => ({
        card,
        controls: [...card.querySelectorAll('a, button, input, select, textarea')],
        transform: '',
        opacity: '',
        zIndex: '',
        visibility: '',
      }))
      cards.forEach(({ card, controls }, index) => {
        card.setAttribute('aria-hidden', index === 0 ? 'false' : 'true')
        controls.forEach((control) => { control.tabIndex = index === 0 ? 0 : -1 })
      })
      return { track, cards, activeIndex: 0, simplified: false, progressValue: '', top: 0, height: 0 }
    })
    let frame = 0

    const measureLayout = () => {
      reveals.forEach((item) => {
        item.top = getDocumentTop(item.block)
        item.height = item.block.offsetHeight
      })
      motions.forEach((item) => {
        item.top = getDocumentTop(item.block)
        item.height = item.block.offsetHeight
      })
      carousels.forEach((item) => {
        item.top = getDocumentTop(item.track)
        item.height = item.track.offsetHeight
      })
    }

    const paint = () => {
      const viewport = window.innerHeight
      const viewportWidth = window.innerWidth
      const scrollOffset = window.scrollY

      reveals.forEach((item) => {
        const { block, characters, characterValues } = item
        const top = item.top - scrollOffset
        const bottom = top + item.height
        const progress = reducedMotion ? 1 : clamp((viewport * .88 - top) / Math.max(180, viewport * .44))
        const exit = reducedMotion ? 1 : clamp((bottom - viewport * .08) / Math.max(130, viewport * .27))
        const progressValue = progress.toFixed(3)
        const exitValue = exit.toFixed(3)

        if (progressValue !== item.progressValue) {
          block.style.setProperty('--line-reveal', progressValue)
          item.progressValue = progressValue
          const count = characters.length
          characters.forEach((character, index) => {
            const characterValue = clamp((progress * (count + 5) - index) / 5).toFixed(3)
            if (characterValue === characterValues[index]) return
            character.style.setProperty('--char-reveal', characterValue)
            characterValues[index] = characterValue
          })
        }
        if (exitValue !== item.exitValue) {
          block.style.setProperty('--line-exit', exitValue)
          item.exitValue = exitValue
        }
      })

      motions.forEach((item) => {
        const { block, values } = item
        const top = item.top - scrollOffset
        const bottom = top + item.height
        const enter = reducedMotion ? 1 : clamp((viewport * .93 - top) / Math.max(220, viewport * .58))
        const exit = reducedMotion ? 1 : clamp((bottom - viewport * .06) / Math.max(160, viewport * .34))
        const direction = Number(block.dataset.motionDirection || 0)
        const nextValues = {
          '--motion-enter': enter.toFixed(3),
          '--motion-exit': exit.toFixed(3),
          '--motion-opacity': (enter * exit).toFixed(3),
          '--motion-x': `${(direction * ((1 - enter) * 38 - (1 - exit) * 18)).toFixed(2)}vw`,
          '--motion-y': `${((1 - enter) * 46 - (1 - exit) * 22).toFixed(2)}px`,
          '--motion-scale': (.94 + enter * .06).toFixed(3),
          '--motion-turn': `${(direction * (1 - enter) * -4).toFixed(2)}deg`,
        }
        Object.entries(nextValues).forEach(([property, value]) => {
          if (values[property] === value) return
          block.style.setProperty(property, value)
          values[property] = value
        })
      })

      carousels.forEach((item) => {
        const { track, cards } = item
        const top = item.top - scrollOffset
        const travel = Math.max(1, cards.length - 1)
        const simplifyCarousel = reducedMotion || shortLandscape.matches
        const progress = simplifyCarousel ? 0 : clamp(-top / Math.max(1, item.height - viewport))
        const progressValue = progress.toFixed(3)
        const rawPosition = progress * travel
        const baseIndex = Math.min(cards.length - 2, Math.floor(rawPosition))
        const localProgress = clamp(rawPosition - baseIndex)
        const handoff = smoothStep(clamp((localProgress - .12) / .76))
        const activeIndex = handoff >= .74 ? baseIndex + 1 : baseIndex

        if (item.progressValue !== progressValue) {
          track.style.setProperty('--carousel-progress', progressValue)
          item.progressValue = progressValue
        }

        if (item.activeIndex !== activeIndex || item.simplified !== simplifyCarousel) {
          cards.forEach(({ card, controls }, index) => {
            const isActive = simplifyCarousel || index === activeIndex
            card.setAttribute('aria-hidden', isActive ? 'false' : 'true')
            controls.forEach((control) => { control.tabIndex = isActive ? 0 : -1 })
          })
          item.activeIndex = activeIndex
        }

        if (simplifyCarousel) {
          if (!item.simplified) {
            cards.forEach((cardItem) => {
              const { card } = cardItem
              card.style.removeProperty('transform')
              card.style.removeProperty('opacity')
              card.style.removeProperty('z-index')
              card.style.removeProperty('visibility')
              cardItem.transform = ''
              cardItem.opacity = ''
              cardItem.zIndex = ''
              cardItem.visibility = ''
            })
          }
          item.simplified = true
          return
        }

        item.simplified = false
        const mobile = viewportWidth <= 680
        const outgoingTravel = viewportWidth * (mobile ? .10 : .085)
        const incomingTravel = viewportWidth * (mobile ? .44 : .40)

        cards.forEach((cardItem, index) => {
          const { card } = cardItem
          const isOutgoing = index === baseIndex
          const isIncoming = index === baseIndex + 1
          let horizontal = 0
          let vertical = 0
          let opacity = 0
          let scale = .95
          let rotation = 0

          if (isOutgoing) {
            horizontal = -outgoingTravel * handoff
            vertical = (mobile ? 16 : 22) * handoff
            opacity = 1 - .7 * smoothStep(clamp((handoff - .55) / .45))
            scale = 1 - .035 * handoff
            rotation = (mobile ? -2.4 : -3) * handoff
          } else if (isIncoming) {
            horizontal = incomingTravel * (1 - handoff)
            vertical = (mobile ? 26 : 34) * (1 - handoff)
            opacity = .12 + .88 * smoothStep(clamp(handoff / .42))
            scale = .96 + .04 * handoff
            rotation = (mobile ? 3.4 : 4.5) * (1 - handoff)
          }

          const transform = `translate3d(calc(-50% + ${horizontal.toFixed(1)}px), calc(-50% + ${vertical.toFixed(1)}px), 0) rotate(${rotation.toFixed(2)}deg) scale(${scale.toFixed(3)})`
          const opacityValue = opacity.toFixed(3)
          const zIndex = String(isIncoming ? 22 : isOutgoing ? 20 : 1)
          const visibility = isOutgoing || isIncoming ? 'visible' : 'hidden'

          if (cardItem.transform !== transform) {
            card.style.transform = transform
            cardItem.transform = transform
          }
          if (cardItem.opacity !== opacityValue) {
            card.style.opacity = opacityValue
            cardItem.opacity = opacityValue
          }
          if (cardItem.zIndex !== zIndex) {
            card.style.zIndex = zIndex
            cardItem.zIndex = zIndex
          }
          if (cardItem.visibility !== visibility) {
            card.style.visibility = visibility
            cardItem.visibility = visibility
          }
        })
      })
      frame = 0
    }

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(paint)
    }

    const handleLayoutChange = () => {
      measureLayout()
      schedule()
    }

    let disposed = false
    const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(handleLayoutChange) : null

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', handleLayoutChange)
    story.addEventListener('load', handleLayoutChange, true)
    resizeObserver?.observe(story)
    document.fonts?.ready.then(() => {
      if (!disposed) handleLayoutChange()
    })
    measureLayout()
    schedule()

    return () => {
      disposed = true
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', handleLayoutChange)
      story.removeEventListener('load', handleLayoutChange, true)
      resizeObserver?.disconnect()
      window.cancelAnimationFrame(frame)
    }
  }, [reducedMotion, storyRef])
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
        <img
          src={venue.image}
          alt=""
          loading={config.dayPlanMotion === 'orbit' ? 'eager' : 'lazy'}
          decoding={config.dayPlanMotion === 'orbit' ? 'sync' : 'async'}
        />
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
  const headingId = `${formId}-heading`
  const successRef = useRef(null)
  const [attendance, setAttendance] = useState('yes')
  const [status, setStatus] = useState('idle')
  const endpoint = import.meta.env.VITE_RSVP_ENDPOINT || import.meta.env.VITE_ENQUIRY_ENDPOINT

  useEffect(() => {
    if (status === 'success') successRef.current?.focus()
  }, [status])

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
      <section className="sw-rsvp sw-rsvp--success" aria-live="polite" aria-labelledby={headingId} role="status" ref={successRef} tabIndex={-1}>
        <div className="sw-rsvp__success-card">
          <span className="sw-rsvp__folio">RSVP / RECEIVED</span>
          <HeartIcon />
          <p>You’re on the list</p>
          <h2 id={headingId}>You’re officially part of the plot.</h2>
          <span>Thank you — {config.couple[0]} &amp; {config.couple[1]} can’t wait to celebrate with you.</span>
        </div>
      </section>
    )
  }

  return (
    <section className="sw-rsvp" aria-labelledby={headingId}>
      <div className="sw-rsvp__intro">
        <div className="sw-rsvp__folio"><span>RSVP</span><i aria-hidden="true">01 / 01</i></div>
        <span className="sw-rsvp__deadline">Reply by {config.replyBy}</span>
        <h2 id={headingId}>
          <ScrollLine tone={1}>Are you</ScrollLine>
          <ScrollLine tone={2}>in?</ScrollLine>
        </h2>
        <p>Save your seat, your plate, and your place on the dance floor.</p>
        <div className="sw-rsvp__intro-stamp" aria-hidden="true"><HeartIcon /><span>say yes<br />to the plot</span></div>
      </div>

      <form className="sw-rsvp__form" onSubmit={submit} aria-busy={status === 'sending'}>
        <div className="sw-rsvp__form-head">
          <span>Kindly reply</span>
          <strong>{config.couple[0]} <i>&amp;</i> {config.couple[1]}</strong>
          <small>{config.dateShort} · {config.city}</small>
        </div>

        <div className="sw-rsvp__perforation" aria-hidden="true"><i /><span>✦</span><i /></div>

        <fieldset className="sw-rsvp__choice">
          <legend>Can you make it?</legend>
          <label className={attendance === 'yes' ? 'is-selected' : ''}>
            <input type="radio" name="attendance" value="yes" checked={attendance === 'yes'} onChange={() => setAttendance('yes')} />
            <span>{config.attendance[0]}</span><i aria-hidden="true">✓</i>
          </label>
          <label className={attendance === 'no' ? 'is-selected' : ''}>
            <input type="radio" name="attendance" value="no" checked={attendance === 'no'} onChange={() => setAttendance('no')} />
            <span>{config.attendance[1]}</span><i aria-hidden="true">✓</i>
          </label>
        </fieldset>

        <div className="sw-rsvp__row sw-rsvp__row--identity">
          <label className="sw-rsvp__field" htmlFor={`${formId}-name`}><span>Your full name</span><input id={`${formId}-name`} name="name" autoComplete="name" placeholder="Your name" required /></label>
          <label className="sw-rsvp__field" htmlFor={`${formId}-contact`}><span>Email address</span><input id={`${formId}-contact`} name="contact" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" required /></label>
        </div>

        <div className="sw-rsvp__attendance-panel">
          {attendance === 'yes' ? (
            <div className="sw-rsvp__attending-fields">
            <div className="sw-rsvp__row">
              <label className="sw-rsvp__field" htmlFor={`${formId}-guest`}><span>Plus-one name</span><input id={`${formId}-guest`} name="guest" placeholder="Optional" /></label>
              <label className="sw-rsvp__field" htmlFor={`${formId}-meal`}>
                <span>Meal</span>
                <select id={`${formId}-meal`} name="meal" defaultValue="" required>
                  <option value="" disabled>Choose one</option>
                  <option>Chicken</option><option>Beef</option><option>Vegetarian</option><option>Vegan</option>
                </select>
              </label>
            </div>
            <div className="sw-rsvp__row">
              <label className="sw-rsvp__field" htmlFor={`${formId}-dietary`}><span>Dietary or access needs</span><input id={`${formId}-dietary`} name="dietary" placeholder="Tell us what you need" /></label>
              <label className="sw-rsvp__field" htmlFor={`${formId}-song`}><span>Your dance-floor song</span><input id={`${formId}-song`} name="song" placeholder="One guaranteed hit" /></label>
            </div>
            </div>
          ) : (
            <div className="sw-rsvp__away-note">
              <HeartIcon />
              <div><strong>We’ll raise a glass for you.</strong><span>Leave us a note below and we’ll send some love back.</span></div>
            </div>
          )}
        </div>

        <label className="sw-rsvp__field sw-rsvp__field--note" htmlFor={`${formId}-note`}><span>Leave us a note</span><textarea id={`${formId}-note`} name="note" rows="2" placeholder="Advice, hype, or a tiny love note…" /></label>
        {status === 'error' && <p className="sw-rsvp__error" role="alert">That didn’t send. Please try once more.</p>}
        <button type="submit" disabled={status === 'sending'}>
          <span><strong>{status === 'sending' ? 'Sending…' : config.submitLabel}</strong><small>{attendance === 'yes' ? 'See you on the dance floor' : 'Sending love from afar'}</small></span><ArrowIcon />
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
