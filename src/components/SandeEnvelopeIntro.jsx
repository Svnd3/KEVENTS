import { useCallback, useEffect, useRef, useState } from 'react'
import '../sande-envelope-intro.css'

const FULL_SEQUENCE_MS = 6450
const CURTAIN_START_MS = 5680
const REDUCED_SEQUENCE_MS = 420
const REDUCED_CURTAIN_MS = 180

function HandwrittenKaribu() {
  return (
    <svg
      className="sei-handwriting"
      viewBox="0 0 720 240"
      role="img"
      aria-label="Karibu"
    >
      <g className="sei-handwriting__ink" pathLength="1">
        <path
          pathLength="1"
          d="M82 195C87 146 97 83 111 31C117 10 123 8 122 29C120 68 106 126 91 158"
        />
        <path pathLength="1" d="M96 128C122 106 148 79 164 54" />
        <path pathLength="1" d="M119 109C138 125 157 156 177 182" />
        <path
          pathLength="1"
          d="M184 149C193 121 216 103 237 109C253 114 252 137 241 155C230 174 207 182 197 166C187 151 198 124 220 114C232 109 243 112 248 122"
        />
        <path
          pathLength="1"
          d="M246 111C240 136 231 160 238 170C246 181 257 164 265 151"
        />
        <path
          pathLength="1"
          d="M264 112C264 127 260 151 257 170M264 128C277 105 291 106 300 119"
        />
        <path
          pathLength="1"
          d="M306 119C303 137 296 160 302 170C309 180 319 167 326 154"
        />
        <path
          pathLength="1"
          d="M333 159C340 126 348 79 349 44C350 18 340 13 333 33C324 61 325 113 331 145C336 174 349 182 362 168C376 153 378 124 364 115C350 107 338 124 331 143"
        />
        <path
          pathLength="1"
          d="M383 116C379 135 370 159 379 170C390 182 408 159 418 117M422 117C418 136 411 161 420 172C429 181 442 164 451 151"
        />
        <path
          pathLength="1"
          d="M451 116C448 135 440 160 448 170C456 179 468 166 477 152"
        />
        <path
          pathLength="1"
          d="M478 115C475 135 467 158 476 170C487 183 506 158 517 117M520 116C515 136 510 160 519 171C528 180 542 164 551 151"
        />
      </g>
      <g className="sei-handwriting__dots" aria-hidden="true">
        <circle cx="313" cy="88" r="5" />
        <circle cx="458" cy="87" r="5" />
        <circle cx="581" cy="166" r="6" />
      </g>
    </svg>
  )
}

function PetalMark() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 31C19 27 14 17 17 9C27 9 34 17 32 31Z" />
      <path d="M33 31C36 18 45 13 54 16C53 26 45 33 33 31Z" />
      <path d="M32 33C45 36 50 45 47 54C37 54 30 45 32 33Z" />
      <path d="M30 32C27 45 18 50 9 47C10 37 18 30 30 32Z" />
      <circle cx="32" cy="32" r="4" />
    </svg>
  )
}

function HeartbeatMark() {
  return (
    <svg className="sei-seal__heart" viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 54.5 12.2 35.7C1.7 25.7 7.4 9.5 20.5 9.5c5.2 0 9.2 2.8 11.5 6.4 2.3-3.6 6.3-6.4 11.5-6.4 13.1 0 18.8 16.2 8.3 26.2L32 54.5Z" />
    </svg>
  )
}

export default function SandeEnvelopeIntro({ design, onComplete, onUserGesture }) {
  const [phase, setPhase] = useState('sealed')
  const timersRef = useRef([])
  const openerRef = useRef(null)

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current = []
  }, [])

  useEffect(() => {
    clearTimers()
    setPhase('sealed')
    openerRef.current?.focus({ preventScroll: true })
  }, [clearTimers, design?.slug])

  useEffect(() => clearTimers, [clearTimers])

  const finish = useCallback(() => {
    setPhase('complete')
    onComplete?.(design)
  }, [design, onComplete])

  const openInvitation = useCallback(() => {
    if (phase !== 'sealed') return

    onUserGesture?.(design)
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const curtainDelay = reducedMotion ? REDUCED_CURTAIN_MS : CURTAIN_START_MS
    const finishDelay = reducedMotion ? REDUCED_SEQUENCE_MS : FULL_SEQUENCE_MS

    setPhase('opening')
    timersRef.current.push(
      window.setTimeout(() => setPhase('departing'), curtainDelay),
      window.setTimeout(finish, finishDelay),
    )
  }, [design, finish, onUserGesture, phase])

  return (
    <section
      className={`sande-envelope-intro sei-is-${phase}`}
      data-design={design?.slug || 'sande-signature'}
      aria-label="Invitation opener"
    >
      <span className="sei-ambient" aria-hidden="true" />

      <button
        ref={openerRef}
        className="sei-opener"
        type="button"
        onClick={openInvitation}
        aria-label="Open the invitation"
        aria-disabled={phase !== 'sealed'}
      >
        <span className="sei-envelope-scene" aria-hidden="true">
          <span className="sei-envelope-shadow" />
          <span className="sei-envelope">
            <span className="sei-envelope__back" />
            <span className="sei-letter">
              <span className="sei-letter__edge" />
              <span className="sei-letter__mark"><PetalMark /></span>
            </span>
            <span className="sei-envelope__flap">
              <span className="sei-envelope__flap-weave" />
            </span>
            <span className="sei-envelope__side sei-envelope__side--left" />
            <span className="sei-envelope__side sei-envelope__side--right" />
            <span className="sei-envelope__pocket" />
            <span className="sei-envelope__seam sei-envelope__seam--left" />
            <span className="sei-envelope__seam sei-envelope__seam--right" />
            <span className="sei-seal"><HeartbeatMark /></span>
          </span>
        </span>
      </button>

      <div className="sei-paper" aria-hidden="true">
        <span className="sei-paper__fibres" />
        <span className="sei-paper__corner sei-paper__corner--top" />
        <span className="sei-paper__corner sei-paper__corner--bottom" />
        <div className="sei-paper__message">
          <HandwrittenKaribu />
          <p>Come celebrate.</p>
        </div>
      </div>

      <span className="sei-curtain" aria-hidden="true" />
      <p className="sei-status" aria-live="polite">
        {phase === 'sealed' ? 'Invitation ready. Press enter to open.' : 'Opening invitation.'}
      </p>
    </section>
  )
}
