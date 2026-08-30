import { useCallback, useEffect, useId, useRef, useState } from 'react'
import '../keepsake-envelope-intro.css'

const OPEN_DURATION = 1760
const REDUCED_DURATION = 180
const SKIP_DURATION = 140

function BackArrow() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="m11.8 4.5-5.4 5.5 5.4 5.5M6.7 10h7" />
    </svg>
  )
}

function TideLines() {
  return (
    <svg className="kei__tide-lines" viewBox="0 0 760 300" preserveAspectRatio="none" aria-hidden="true">
      <path d="M-24 62c95-38 156 34 251 0s161-31 252 2 166 28 305-12" />
      <path d="M-34 124c114-44 174 36 273 1s166-25 254 7 166 24 300-16" />
      <path d="M-38 190c106-38 174 31 271-2s165-23 255 6 170 21 309-21" />
    </svg>
  )
}

function getCouple(design) {
  if (!Array.isArray(design?.couple)) return []
  return design.couple.filter((name) => typeof name === 'string' && name.trim())
}

function getInitials(couple, fallback = '') {
  const initials = couple.slice(0, 2).map((name) => name.trim().charAt(0)).join('')
  return initials || fallback.trim().charAt(0) || 'K'
}

export default function KeepsakeEnvelopeIntro({
  design,
  onBack,
  onComplete,
  onUserGesture,
}) {
  const [phase, setPhase] = useState('sealed')
  const dialogRef = useRef(null)
  const openerRef = useRef(null)
  const skipRef = useRef(null)
  const timerRef = useRef(null)
  const startedRef = useRef(false)
  const finishedRef = useRef(false)
  const titleId = useId()
  const descriptionId = useId()
  const couple = getCouple(design)
  const first = couple[0] || ''
  const second = couple[1] || ''
  const names = couple.length ? couple.join(' & ') : design?.name || 'Keepsake invitation'
  const initials = getInitials(couple, design?.name)

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const finish = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    clearTimer()
    setPhase('complete')
    onComplete?.(design)
  }, [clearTimer, design, onComplete])

  const primeExperience = useCallback(() => {
    if (startedRef.current) return
    startedRef.current = true
    onUserGesture?.(design)
  }, [design, onUserGesture])

  const openInvitation = useCallback(() => {
    if (phase !== 'sealed' || startedRef.current || finishedRef.current) return
    primeExperience()
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    setPhase('opening')
    timerRef.current = window.setTimeout(finish, reducedMotion ? REDUCED_DURATION : OPEN_DURATION)
  }, [finish, phase, primeExperience])

  const skipInvitation = useCallback(() => {
    if (finishedRef.current) return
    primeExperience()
    clearTimer()
    setPhase('skipping')
    timerRef.current = window.setTimeout(finish, SKIP_DURATION)
  }, [clearTimer, finish, primeExperience])

  const leavePreview = useCallback(() => {
    clearTimer()
    onBack?.()
  }, [clearTimer, onBack])

  useEffect(() => {
    const bodyOverflow = document.body.style.overflow
    const htmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    const focusFrame = window.requestAnimationFrame(() => {
      openerRef.current?.focus({ preventScroll: true })
    })

    return () => {
      window.cancelAnimationFrame(focusFrame)
      clearTimer()
      document.body.style.overflow = bodyOverflow
      document.documentElement.style.overflow = htmlOverflow
    }
  }, [clearTimer])

  useEffect(() => {
    if (phase === 'opening') skipRef.current?.focus({ preventScroll: true })
  }, [phase])

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      if (onBack) leavePreview()
      else skipInvitation()
      return
    }

    if (event.key !== 'Tab') return
    const controls = [...(dialogRef.current?.querySelectorAll('button:not(:disabled)') || [])]
      .filter((control) => {
        const styles = window.getComputedStyle(control)
        return styles.display !== 'none' && styles.visibility !== 'hidden'
      })
    if (!controls.length) return

    const firstControl = controls[0]
    const lastControl = controls.at(-1)
    if (event.shiftKey && document.activeElement === firstControl) {
      event.preventDefault()
      lastControl.focus()
    } else if (!event.shiftKey && document.activeElement === lastControl) {
      event.preventDefault()
      firstControl.focus()
    }
  }

  return (
    <div
      ref={dialogRef}
      className={`keepsake-envelope-intro kei-is-${phase}`}
      data-design={design?.slug || 'coastal-keepsake'}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-busy={phase === 'opening'}
      onKeyDown={handleKeyDown}
    >
      <div className="kei__atmosphere" aria-hidden="true">
        <span className="kei__sun" />
        <span className="kei__glass kei__glass--one" />
        <span className="kei__glass kei__glass--two" />
        <TideLines />
        <span className="kei__grain" />
      </div>

      <header className="kei__toolbar">
        {onBack ? (
          <button className="kei__utility kei__utility--back" type="button" onClick={leavePreview}>
            <BackArrow />
            <span>All designs</span>
          </button>
        ) : <span />}
        <span className="kei__folio" aria-hidden="true">Tell &amp; Wed · No. 01</span>
        <button
          ref={skipRef}
          className="kei__utility kei__utility--skip"
          type="button"
          onClick={skipInvitation}
          disabled={phase === 'skipping' || phase === 'complete'}
        >
          Skip introduction
        </button>
      </header>

      <main className="kei__layout">
        <section className="kei__copy">
          <span className="kei__eyebrow">A piece of coastal correspondence</span>
          <h1 id={titleId}>Something beautiful<br />has arrived.</h1>
          <p id={descriptionId}>
            A keepsake invitation for {names}, sealed for you and best opened slowly.
          </p>
          <button
            ref={openerRef}
            className="kei__open"
            type="button"
            onClick={openInvitation}
            disabled={phase !== 'sealed'}
            aria-label={`Break the seal on ${names}'s invitation`}
          >
            <span className="kei__open-seal" aria-hidden="true">{initials}</span>
            <span>Break the seal</span>
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11m-4.5-4.5L15 10l-4.5 4.5" /></svg>
          </button>
        </section>

        <section className="kei__scene" aria-hidden="true">
          <span className="kei__scene-caption">Private correspondence · by the sea</span>
          <div className="kei__envelope-shadow" />
          <div className="kei__envelope">
            <span className="kei__envelope-back" />

            <article className="kei__card">
              <span className="kei__card-rule" />
              <span className="kei__card-kicker">Together with their families</span>
              <span className="kei__card-monogram">{initials}</span>
              <span className="kei__card-names">
                {first ? <i>{first}</i> : <i>{design?.name || 'Keepsake'}</i>}
                {second && <><b>&amp;</b><i>{second}</i></>}
              </span>
              <span className="kei__card-note">request the pleasure of your company</span>
              <span className="kei__card-place">A celebration by the sea</span>
              <span className="kei__stamp">
                <b>Air mail</b>
                <i>With love</i>
              </span>
            </article>

            <span className="kei__flap">
              <span className="kei__flap-lining" />
            </span>
            <span className="kei__fold kei__fold--left" />
            <span className="kei__fold kei__fold--right" />
            <span className="kei__pocket" />
            <span className="kei__wax-seal">
              <b>{initials}</b>
              <i />
            </span>
          </div>
          <span className="kei__postmark">
            <b>Special delivery</b>
            <i>Diani · with love</i>
          </span>
        </section>
      </main>

      <p className="kei__status" aria-live="polite" aria-atomic="true">
        {phase === 'sealed' ? 'Invitation ready. Press Enter to break the seal.' : 'Opening the invitation.'}
      </p>
    </div>
  )
}
