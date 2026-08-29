import { useEffect, useMemo, useRef } from 'react'

const rosePaths = {
  stem: [
    { x: 37, y: 21, turn: 76, scale: .72 },
    { x: -36, y: 13, turn: -10, scale: .64 },
    { x: 31, y: -17, turn: 48, scale: .68 },
    { x: -34, y: -10, turn: -28, scale: .61 },
    { x: 36, y: 8, turn: 82, scale: .58 },
    { x: -32, y: 18, turn: 12, scale: .54 },
  ],
  bloom: [
    { x: 39, y: 20, turn: -15, scale: .78 },
    { x: -39, y: 10, turn: 52, scale: .69 },
    { x: 34, y: -18, turn: 126, scale: .72 },
    { x: -37, y: -8, turn: 202, scale: .66 },
    { x: 38, y: 9, turn: 278, scale: .62 },
    { x: -34, y: 18, turn: 352, scale: .57 },
  ],
}

const clamp = (value) => Math.min(1, Math.max(0, value))
const smoothStep = (value) => value * value * (3 - 2 * value)

export default function RoseJourney({ design }) {
  const roseRef = useRef(null)
  const kind = useMemo(() => (
    ['Floral', 'Cultural'].includes(design.category) || design.id % 3 === 0 ? 'bloom' : 'stem'
  ), [design.category, design.id])
  const mirrored = design.id % 2 === 0

  useEffect(() => {
    const rose = roseRef.current
    if (!rose) return undefined

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (media.matches) return undefined

    const path = rosePaths[kind]
    let frame = 0
    let idleTimer = 0

    const render = () => {
      const distance = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      const progress = clamp(window.scrollY / distance)
      const pathPosition = progress * (path.length - 1)
      const fromIndex = Math.floor(pathPosition)
      const toIndex = Math.min(path.length - 1, fromIndex + 1)
      const amount = smoothStep(pathPosition - fromIndex)
      const from = path[fromIndex]
      const to = path[toIndex]
      const direction = mirrored ? -1 : 1
      const x = (from.x + (to.x - from.x) * amount) * direction
      const y = from.y + (to.y - from.y) * amount - Math.sin(amount * Math.PI) * 3
      const turn = (from.turn + (to.turn - from.turn) * amount) * direction
      const scale = from.scale + (to.scale - from.scale) * amount

      rose.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(2)}vw, ${y.toFixed(2)}vh, 0) rotate(${turn.toFixed(2)}deg) scale(${scale.toFixed(3)})`
      frame = 0
    }

    const queueRender = () => {
      rose.classList.add('is-moving')
      window.clearTimeout(idleTimer)
      idleTimer = window.setTimeout(() => rose.classList.remove('is-moving'), 180)
      if (!frame) frame = window.requestAnimationFrame(render)
    }

    render()
    window.addEventListener('scroll', queueRender, { passive: true })
    window.addEventListener('resize', queueRender)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(idleTimer)
      window.removeEventListener('scroll', queueRender)
      window.removeEventListener('resize', queueRender)
    }
  }, [kind, mirrored])

  return (
    <img
      ref={roseRef}
      className={`tp-rose-journey tp-rose-journey--${kind}`}
      src={`/images/rose-${kind === 'bloom' ? 'bloom' : 'stem'}-cutout.webp`}
      alt=""
      aria-hidden="true"
      decoding="async"
      draggable="false"
    />
  )
}
