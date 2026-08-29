import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import '../event-reveal-moment.css'

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value))

const DEFAULT_SFX = {
  flip: '/audio/sfx/flip-clock.mp3',
  scratch: '/audio/sfx/scratch-card.mp3',
  reveal: '/audio/sfx/reveal-pop.mp3',
}

const SHAPE_POINTS = {
  heart: [[.5, .94], [.08, .54], [.05, .31], [.17, .12], [.36, .1], [.5, .26], [.64, .1], [.83, .12], [.95, .31], [.92, .54]],
  ticket: [[.06, 0], [.94, 0], [1, .12], [1, .88], [.94, 1], [.06, 1], [0, .88], [0, .12]],
  gem: [[.5, 0], [1, .5], [.5, 1], [0, .5]],
  burst: [[.5, 0], [.58, .14], [.72, .04], [.75, .21], [.94, .16], [.86, .34], [1, .43], [.85, .54], [.96, .7], [.76, .72], [.72, .94], [.57, .84], [.46, 1], [.38, .83], [.2, .95], [.2, .74], [0, .7], [.12, .53], [0, .4], [.16, .32], [.08, .14], [.29, .2]],
}

function pointInPolygon(x, y, points) {
  let inside = false
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i]
    const [xj, yj] = points[j]
    const intersects = ((yi > y) !== (yj > y))
      && (x < ((xj - xi) * (y - yi)) / ((yj - yi) || .00001) + xi)
    if (intersects) inside = !inside
  }
  return inside
}

function isInsideShape(shape, x, y) {
  if (SHAPE_POINTS[shape]) return pointInPolygon(x, y, SHAPE_POINTS[shape])
  if (shape === 'seal') return ((x - .5) / .49) ** 2 + ((y - .5) / .49) ** 2 <= 1
  if (shape === 'petal') {
    const turnedX = (x - .5) * .96 + (y - .5) * .18
    const turnedY = (y - .5) * .98 - (x - .5) * .1
    return (turnedX / .48) ** 2 + (turnedY / .46) ** 2 <= 1
  }
  if (shape === 'cloud') {
    const inBase = x > .08 && x < .92 && y > .4 && y < .83
    const left = ((x - .27) / .24) ** 2 + ((y - .48) / .29) ** 2 <= 1
    const middle = ((x - .5) / .3) ** 2 + ((y - .34) / .36) ** 2 <= 1
    const right = ((x - .75) / .23) ** 2 + ((y - .49) / .28) ** 2 <= 1
    return inBase || left || middle || right
  }
  return true
}

function seededRandom(seed) {
  let value = seed >>> 0
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0
    return value / 4294967296
  }
}

function hexToRgba(hex, alpha) {
  const value = hex.replace('#', '')
  const full = value.length === 3 ? value.split('').map((item) => item + item).join('') : value
  const number = Number.parseInt(full, 16)
  return `rgba(${(number >> 16) & 255}, ${(number >> 8) & 255}, ${number & 255}, ${alpha})`
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ))

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(media.matches)
    media.addEventListener?.('change', update)
    return () => media.removeEventListener?.('change', update)
  }, [])

  return reduced
}

function useDocumentVisibility() {
  const [visible, setVisible] = useState(() => (
    typeof document === 'undefined' || document.visibilityState === 'visible'
  ))

  useEffect(() => {
    const update = () => setVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  return visible
}

function useRevealVisibility(sectionRef) {
  const [state, setState] = useState({ near: false, visible: false })

  useEffect(() => {
    const section = sectionRef.current
    if (!section || !('IntersectionObserver' in window)) {
      setState({ near: true, visible: true })
      return undefined
    }

    const observer = new IntersectionObserver(([entry]) => {
      const rect = entry.boundingClientRect
      const visible = entry.isIntersecting
        && rect.top < window.innerHeight * .88
        && rect.bottom > window.innerHeight * .12
      setState((current) => (
        current.near === entry.isIntersecting && current.visible === visible
          ? current
          : { near: current.near || entry.isIntersecting, visible }
      ))
    }, { rootMargin: '360px 0px', threshold: [0, .08, .22] })

    observer.observe(section)
    return () => observer.disconnect()
  }, [sectionRef])

  return state
}

function getRemaining(eventAt) {
  const difference = Math.max(0, new Date(eventAt).getTime() - Date.now())
  const totalSeconds = Math.floor(difference / 1000)
  return {
    complete: difference <= 0,
    days: String(Math.floor(totalSeconds / 86400)).padStart(3, '0'),
    hours: String(Math.floor((totalSeconds % 86400) / 3600)).padStart(2, '0'),
    minutes: String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0'),
    seconds: String(totalSeconds % 60).padStart(2, '0'),
  }
}

function FlipUnit({ value, label, reducedMotion }) {
  return (
    <li className="er-flip__unit">
      <span className={`er-flip__card${reducedMotion ? ' is-still' : ''}`} key={value}>
        <span>{value}</span>
        <i aria-hidden="true" />
      </span>
      <small>{label}</small>
    </li>
  )
}

function FlipCountdown({ eventAt, active, soundEnabled, tickAudioRef, reducedMotion }) {
  const [remaining, setRemaining] = useState(() => getRemaining(eventAt))
  const lastTick = useRef(remaining.seconds)

  useEffect(() => {
    if (!active || remaining.complete) return undefined
    let timeout = 0
    const update = () => {
      setRemaining(getRemaining(eventAt))
      timeout = window.setTimeout(update, 1000 - (Date.now() % 1000) + 8)
    }
    timeout = window.setTimeout(update, 1000 - (Date.now() % 1000) + 8)
    return () => window.clearTimeout(timeout)
  }, [active, eventAt, remaining.complete])

  useEffect(() => {
    if (lastTick.current === remaining.seconds) return
    lastTick.current = remaining.seconds
    const audio = tickAudioRef.current
    if (!active || !soundEnabled || !audio) return
    audio.currentTime = 0
    audio.volume = .12
    audio.play().catch(() => {})
  }, [active, remaining.seconds, soundEnabled, tickAudioRef])

  if (remaining.complete) {
    return <p className="er-flip__complete" role="timer">Today is the day.</p>
  }

  return (
    <ol className="er-flip" role="timer" aria-label={`${remaining.days} days, ${remaining.hours} hours, ${remaining.minutes} minutes and ${remaining.seconds} seconds until the celebration`}>
      <FlipUnit value={remaining.days} label="Days" reducedMotion={reducedMotion} />
      <FlipUnit value={remaining.hours} label="Hours" reducedMotion={reducedMotion} />
      <FlipUnit value={remaining.minutes} label="Mins" reducedMotion={reducedMotion} />
      <FlipUnit value={remaining.seconds} label="Secs" reducedMotion={reducedMotion} />
    </ol>
  )
}

function ScratchSurface({ reveal, date, onScratchStart, onScratchMove, onScratchEnd, onReveal }) {
  const canvasRef = useRef(null)
  const shapeRef = useRef(null)
  const drawingRef = useRef(false)
  const lastPointRef = useRef(null)
  const lastCoverageRef = useRef(0)
  const gridRef = useRef({ cells: new Uint8Array(1), active: new Uint8Array(1), activeCount: 1, scratched: 0 })
  const strokesRef = useRef([])
  const [progress, setProgress] = useState(0)
  const [revealed, setRevealed] = useState(false)

  const eraseLine = useCallback((from, to, storeStroke = true) => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const brush = clamp(rect.width * .078, 27, 43)
    context.save()
    context.globalCompositeOperation = 'destination-out'
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.lineWidth = brush * scaleX
    context.beginPath()
    context.moveTo(from.x * scaleX, from.y * scaleY)
    context.lineTo(to.x * scaleX, to.y * scaleY)
    context.stroke()
    context.restore()

    if (storeStroke) {
      strokesRef.current.push({
        from: { x: from.x / rect.width, y: from.y / rect.height },
        to: { x: to.x / rect.width, y: to.y / rect.height },
      })
    }

    const grid = gridRef.current
    const columns = 34
    const rows = 22
    const normalizedBrush = brush / Math.min(rect.width, rect.height)
    const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / (brush * .3)))
    for (let step = 0; step <= steps; step += 1) {
      const amount = step / steps
      const nx = (from.x + (to.x - from.x) * amount) / rect.width
      const ny = (from.y + (to.y - from.y) * amount) / rect.height
      const minColumn = Math.max(0, Math.floor((nx - normalizedBrush) * columns))
      const maxColumn = Math.min(columns - 1, Math.ceil((nx + normalizedBrush) * columns))
      const minRow = Math.max(0, Math.floor((ny - normalizedBrush) * rows))
      const maxRow = Math.min(rows - 1, Math.ceil((ny + normalizedBrush) * rows))
      for (let row = minRow; row <= maxRow; row += 1) {
        for (let column = minColumn; column <= maxColumn; column += 1) {
          const index = row * columns + column
          if (!grid.active[index] || grid.cells[index]) continue
          const cellX = (column + .5) / columns
          const cellY = (row + .5) / rows
          if (Math.hypot(cellX - nx, cellY - ny) <= normalizedBrush * 1.05) {
            grid.cells[index] = 1
            grid.scratched += 1
          }
        }
      }
    }
  }, [])

  const finishReveal = useCallback(() => {
    if (revealed) return
    drawingRef.current = false
    setProgress(1)
    setRevealed(true)
    onScratchEnd()
    onReveal()
  }, [onReveal, onScratchEnd, revealed])

  const measureCoverage = useCallback(() => {
    const now = performance.now()
    if (now - lastCoverageRef.current < 125) return
    lastCoverageRef.current = now
    const grid = gridRef.current
    const amount = grid.activeCount ? grid.scratched / grid.activeCount : 0
    setProgress(amount)
    if (amount >= .56) finishReveal()
  }, [finishReveal])

  const paint = useCallback(() => {
    const canvas = canvasRef.current
    const shape = shapeRef.current
    if (!canvas || !shape || revealed) return
    const rect = shape.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(rect.width * ratio)
    canvas.height = Math.round(rect.height * ratio)
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`
    const context = canvas.getContext('2d')
    const [base = '#b8c4cc', light = '#f3f6f7', fleck = '#5c6670'] = reveal.foil || []
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, base)
    gradient.addColorStop(.38, light)
    gradient.addColorStop(.56, base)
    gradient.addColorStop(1, fleck)
    context.globalCompositeOperation = 'source-over'
    context.fillStyle = gradient
    context.fillRect(0, 0, canvas.width, canvas.height)

    const random = seededRandom(reveal.shape.split('').reduce((sum, letter) => sum + letter.charCodeAt(0), 947))
    const flecks = Math.round(clamp(rect.width * rect.height / 105, 680, 1500))
    for (let index = 0; index < flecks; index += 1) {
      const x = random() * canvas.width
      const y = random() * canvas.height
      const radius = (.3 + random() * 1.25) * ratio
      context.fillStyle = random() > .42 ? hexToRgba(light, .24 + random() * .58) : hexToRgba(fleck, .12 + random() * .38)
      context.beginPath()
      context.ellipse(x, y, radius * (1 + random()), radius, random() * Math.PI, 0, Math.PI * 2)
      context.fill()
    }

    context.strokeStyle = hexToRgba(light, .13)
    context.lineWidth = ratio
    for (let line = -canvas.height; line < canvas.width; line += 32 * ratio) {
      context.beginPath()
      context.moveTo(line, 0)
      context.lineTo(line + canvas.height, canvas.height)
      context.stroke()
    }

    context.fillStyle = hexToRgba(fleck, .82)
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.font = `800 ${Math.max(11, rect.width * .027) * ratio}px Inter, sans-serif`
    context.fillText('SCRATCH TO OPEN', canvas.width / 2, canvas.height / 2)

    const columns = 34
    const rows = 22
    const active = new Uint8Array(columns * rows)
    let activeCount = 0
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const index = row * columns + column
        if (isInsideShape(reveal.shape, (column + .5) / columns, (row + .5) / rows)) {
          active[index] = 1
          activeCount += 1
        }
      }
    }
    gridRef.current = { cells: new Uint8Array(columns * rows), active, activeCount, scratched: 0 }

    const savedStrokes = [...strokesRef.current]
    strokesRef.current = []
    savedStrokes.forEach((stroke) => {
      eraseLine(
        { x: stroke.from.x * rect.width, y: stroke.from.y * rect.height },
        { x: stroke.to.x * rect.width, y: stroke.to.y * rect.height },
      )
    })
    strokesRef.current = savedStrokes
  }, [eraseLine, reveal.foil, reveal.shape, revealed])

  useEffect(() => {
    paint()
    const observer = 'ResizeObserver' in window ? new ResizeObserver(paint) : null
    if (shapeRef.current) observer?.observe(shapeRef.current)
    return () => observer?.disconnect()
  }, [paint])

  useEffect(() => {
    const stop = () => {
      if (!drawingRef.current) return
      drawingRef.current = false
      lastPointRef.current = null
      onScratchEnd()
    }
    document.addEventListener('visibilitychange', stop)
    return () => document.removeEventListener('visibilitychange', stop)
  }, [onScratchEnd])

  const getPoint = (event) => {
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top, time: event.timeStamp }
  }

  const pointerDown = (event) => {
    if (revealed) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drawingRef.current = true
    const point = getPoint(event)
    lastPointRef.current = point
    eraseLine(point, point)
    measureCoverage()
    onScratchStart()
  }

  const pointerMove = (event) => {
    if (!drawingRef.current || revealed) return
    const events = event.getCoalescedEvents?.() || [event]
    events.forEach((coalescedEvent) => {
      const point = getPoint(coalescedEvent)
      const previous = lastPointRef.current || point
      eraseLine(previous, point)
      const distance = Math.hypot(point.x - previous.x, point.y - previous.y)
      const elapsed = Math.max(1, point.time - previous.time)
      onScratchMove(distance / elapsed)
      lastPointRef.current = point
    })
    measureCoverage()
  }

  const pointerEnd = (event) => {
    if (!drawingRef.current) return
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    drawingRef.current = false
    lastPointRef.current = null
    measureCoverage()
    onScratchEnd()
  }

  const keyboardReveal = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onScratchStart()
    finishReveal()
  }

  return (
    <div className={`er-scratch er-scratch--${reveal.shape}${revealed ? ' is-revealed' : ''}`}>
      <div
        className="er-scratch__shape"
        ref={shapeRef}
        role="button"
        tabIndex={revealed ? -1 : 0}
        aria-label={revealed ? reveal.message : 'Scratch to reveal your invitation. Press Enter to reveal without scratching.'}
        onKeyDown={keyboardReveal}
      >
        <div className="er-scratch__message" aria-hidden={!revealed}>
          <small>It’s official</small>
          <strong>{reveal.message}</strong>
          <span>{date}</span>
        </div>
        <canvas
          className="er-scratch__canvas"
          ref={canvasRef}
          aria-hidden="true"
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={pointerEnd}
          onPointerCancel={pointerEnd}
          onLostPointerCapture={pointerEnd}
        />
      </div>
      <div className="er-scratch__status" aria-hidden="true">
        <span>{revealed ? 'OPEN' : `${Math.round(progress * 100)}%`}</span>
        <i><b style={{ transform: `scaleX(${progress})` }} /></i>
      </div>
      {!revealed && (
        <button className="er-scratch__fallback" type="button" onClick={() => { onScratchStart(); finishReveal() }}>
          Reveal without scratching
        </button>
      )}
      <p className="sr-only" role="status" aria-live="polite">{revealed ? reveal.message : ''}</p>
    </div>
  )
}

function SoundIcon({ enabled }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 10v4h4l5 4V6L8 10H4Z" />
      {enabled ? <path d="M16 9c1.4 1.6 1.4 4.4 0 6M19 6c3 3.2 3 8.8 0 12" /> : <path d="m17 9 5 6M22 9l-5 6" />}
    </svg>
  )
}

function CelebrationBurst({ colors, reducedMotion }) {
  const pieces = useMemo(() => Array.from({ length: reducedMotion ? 0 : 36 }, (_, index) => {
    const angle = (index / 36) * Math.PI * 2 + (index % 4) * .08
    const distance = 150 + (index % 7) * 24
    return {
      id: index,
      color: colors[index % colors.length],
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance - 70 - (index % 5) * 18,
      rotate: 220 + index * 47,
      delay: (index % 6) * 16,
      round: index % 5 === 0,
    }
  }), [colors, reducedMotion])

  return (
    <div className="er-confetti" aria-hidden="true">
      {pieces.map((piece) => (
        <i
          className={piece.round ? 'is-round' : ''}
          key={piece.id}
          style={{
            '--er-piece-color': piece.color,
            '--er-piece-x': `${piece.x}px`,
            '--er-piece-y': `${piece.y}px`,
            '--er-piece-r': `${piece.rotate}deg`,
            '--er-piece-delay': `${piece.delay}ms`,
          }}
        />
      ))}
    </div>
  )
}

export default function EventRevealMoment({ config, family }) {
  const sectionRef = useRef(null)
  const tickAudioRef = useRef(null)
  const scratchAudioRef = useRef(null)
  const revealAudioRef = useRef(null)
  const scratchReleaseRef = useRef(0)
  const [soundState, setSoundState] = useState('ready')
  const [bursting, setBursting] = useState(false)
  const reducedMotion = useReducedMotion()
  const documentVisible = useDocumentVisibility()
  const { near, visible } = useRevealVisibility(sectionRef)
  const reveal = config.reveal
  const sfx = { ...DEFAULT_SFX, ...reveal?.sfx }

  const playOneShot = useCallback((audio, volume = .2) => {
    if (!audio || soundState === 'off') return
    audio.currentTime = 0
    audio.volume = volume
    audio.play().catch(() => {})
  }, [soundState])

  const startScratch = useCallback(() => {
    if (soundState === 'off') return
    setSoundState('on')
    const audio = scratchAudioRef.current
    if (!audio) return
    window.clearTimeout(scratchReleaseRef.current)
    audio.loop = true
    audio.volume = .11
    audio.playbackRate = .94
    audio.play().catch(() => {})
  }, [soundState])

  const moveScratch = useCallback((velocity) => {
    const audio = scratchAudioRef.current
    if (!audio || audio.paused || soundState === 'off') return
    audio.volume = clamp(.07 + velocity * .15, .07, .19)
    audio.playbackRate = clamp(.86 + velocity * .22, .86, 1.14)
  }, [soundState])

  const stopScratch = useCallback(() => {
    const audio = scratchAudioRef.current
    if (!audio) return
    window.clearTimeout(scratchReleaseRef.current)
    scratchReleaseRef.current = window.setTimeout(() => {
      audio.pause()
    }, 75)
  }, [])

  const revealInvitation = useCallback(() => {
    const scratch = scratchAudioRef.current
    if (scratch) scratch.pause()
    setBursting(true)
    playOneShot(revealAudioRef.current, .28)
    window.setTimeout(() => setBursting(false), reducedMotion ? 250 : 1800)
  }, [playOneShot, reducedMotion])

  const toggleSound = () => {
    if (soundState === 'on') {
      setSoundState('off')
      scratchAudioRef.current?.pause()
      return
    }
    setSoundState('on')
    const audio = tickAudioRef.current
    if (audio) {
      audio.currentTime = 0
      audio.volume = .12
      audio.play().catch(() => {})
    }
  }

  useEffect(() => () => {
    window.clearTimeout(scratchReleaseRef.current)
    ;[tickAudioRef, scratchAudioRef, revealAudioRef].forEach((ref) => ref.current?.pause())
  }, [])

  if (!reveal || !config.eventAt) return null

  return (
    <section
      className={`er-moment er-moment--${family}`}
      data-er-theme={reveal.theme || config.theme || config.id}
      data-er-visible={visible ? 'true' : 'false'}
      data-er-reduced={reducedMotion ? 'true' : 'false'}
      ref={sectionRef}
      aria-labelledby={`${config.id}-reveal-title`}
    >
      <div className="er-moment__glow" aria-hidden="true" />
      <div className="er-moment__inner">
        <header className="er-moment__header">
          <div>
            <span>{reveal.eyebrow}</span>
            <h2 id={`${config.id}-reveal-title`}>{reveal.prompt}</h2>
          </div>
          <button className={`er-sound er-sound--${soundState}`} type="button" onClick={toggleSound} aria-pressed={soundState === 'on'}>
            <SoundIcon enabled={soundState === 'on'} />
            <span>{soundState === 'on' ? 'Sound on' : soundState === 'off' ? 'Sound off' : 'Sound ready'}</span>
          </button>
        </header>

        <div className="er-moment__layout">
          <div className="er-countdown">
            <p>Until we say “we do”</p>
            <FlipCountdown
              eventAt={config.eventAt}
              active={visible && documentVisible}
              soundEnabled={soundState === 'on'}
              tickAudioRef={tickAudioRef}
              reducedMotion={reducedMotion}
            />
            <span>{config.date} · {config.city}</span>
          </div>
          <ScratchSurface
            reveal={reveal}
            date={config.date}
            onScratchStart={startScratch}
            onScratchMove={moveScratch}
            onScratchEnd={stopScratch}
            onReveal={revealInvitation}
          />
        </div>
      </div>

      {bursting && <CelebrationBurst colors={reveal.confetti} reducedMotion={reducedMotion} />}
      <audio ref={tickAudioRef} src={near ? sfx.flip : undefined} preload={near ? 'auto' : 'none'} />
      <audio ref={scratchAudioRef} src={near ? sfx.scratch : undefined} preload={near ? 'auto' : 'none'} />
      <audio ref={revealAudioRef} src={near ? sfx.reveal : undefined} preload={near ? 'auto' : 'none'} />
    </section>
  )
}
