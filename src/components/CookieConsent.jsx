import { ChevronRight, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  COOKIE_CONSENT_KEY,
  COOKIE_PREFERENCES_EVENT,
  NECESSARY_COOKIE_PREFERENCES,
  normaliseCookiePreferences,
  readCookieConsent,
  saveCookieConsent,
} from '../utils/cookieConsent.js'
import '../cookie-consent.css'

function PreferenceRow({
  checked,
  children,
  description,
  disabled = false,
  id,
  onChange,
}) {
  return (
    <div className="tw-consent__preference">
      <div>
        <label htmlFor={id}>{children}</label>
        <p id={`${id}-description`}>{description}</p>
      </div>
      <label className="tw-consent__switch" aria-label={`${children}: ${disabled ? 'always on' : checked ? 'on' : 'off'}`}>
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          aria-describedby={`${id}-description`}
          onChange={(event) => onChange?.(event.target.checked)}
        />
        <span aria-hidden="true"><i /></span>
      </label>
    </div>
  )
}

function CookiePreferencesDialog({
  initialPreferences,
  onClose,
  onNavigatePolicy,
  onSave,
  policyHref,
}) {
  const [preferences, setPreferences] = useState(() => normaliseCookiePreferences(initialPreferences))
  const dialogRef = useRef(null)

  useEffect(() => {
    const previousFocus = window.document.activeElement
    const dialog = dialogRef.current
    const focusableSelector = 'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    window.document.body.classList.add('tw-consent-modal-open')

    const focusFrame = window.requestAnimationFrame(() => {
      dialog?.querySelector('[data-consent-autofocus]')?.focus()
    })

    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab' || !dialog) return

      const focusable = [...dialog.querySelectorAll(focusableSelector)]
      if (!focusable.length) {
        event.preventDefault()
        dialog.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && window.document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && window.document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => {
      window.cancelAnimationFrame(focusFrame)
      window.removeEventListener('keydown', handleKeydown)
      window.document.body.classList.remove('tw-consent-modal-open')
      previousFocus?.focus?.()
    }
  }, [onClose])

  const followPolicy = (event) => {
    if (!onNavigatePolicy) return
    event.preventDefault()
    onNavigatePolicy()
    onClose()
  }

  return (
    <div
      className="tw-consent__backdrop"
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}
    >
      <section
        className="tw-consent__dialog"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tw-cookie-preferences-title"
        aria-describedby="tw-cookie-preferences-description"
        tabIndex={-1}
      >
        <div className="tw-consent__dialog-head">
          <div>
            <h2 id="tw-cookie-preferences-title">Cookie preferences</h2>
          </div>
          <button
            className="tw-consent__close"
            type="button"
            onClick={onClose}
            aria-label="Close cookie preferences"
            data-consent-autofocus
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <p className="tw-consent__dialog-intro" id="tw-cookie-preferences-description">
          Choose which optional categories may be used. Necessary storage keeps requested features
          working and cannot be switched off here.
        </p>

        <div className="tw-consent__preference-list">
          <PreferenceRow
            id="tw-cookie-necessary"
            checked
            disabled
            description="Consent choices, security, sign-in, saved designs and settings you request."
          >
            Necessary
          </PreferenceRow>
          <PreferenceRow
            id="tw-cookie-analytics"
            checked={preferences.analytics}
            onChange={(checked) => setPreferences((current) => ({ ...current, analytics: checked }))}
            description="Helps us understand aggregate visits and improve performance. No analytics tool is loaded by this control itself."
          >
            Analytics
          </PreferenceRow>
          <PreferenceRow
            id="tw-cookie-marketing"
            checked={preferences.marketing}
            onChange={(checked) => setPreferences((current) => ({ ...current, marketing: checked }))}
            description="Allows campaign measurement or relevant advertising if those services are introduced."
          >
            Marketing
          </PreferenceRow>
        </div>

        <a className="tw-consent__policy-link" href={policyHref} onClick={followPolicy}>
          Read the cookie policy <ChevronRight size={14} aria-hidden="true" />
        </a>

        <div className="tw-consent__dialog-actions">
          <button type="button" className="tw-consent__button tw-consent__button--ghost" onClick={() => onSave(NECESSARY_COOKIE_PREFERENCES)}>
            Reject optional
          </button>
          <button type="button" className="tw-consent__button tw-consent__button--primary" onClick={() => onSave(preferences)}>
            Save choices
          </button>
        </div>
      </section>
    </div>
  )
}

export function CookiePreferences({
  open,
  initialPreferences = NECESSARY_COOKIE_PREFERENCES,
  onClose,
  onSave,
  onNavigatePolicy,
  policyHref = '#legal/cookies',
}) {
  if (!open) return null

  return (
    <CookiePreferencesDialog
      initialPreferences={initialPreferences}
      onClose={onClose}
      onSave={onSave}
      onNavigatePolicy={onNavigatePolicy}
      policyHref={policyHref}
    />
  )
}

/**
 * Consent UI only: it stores category choices and emits an event, but intentionally
 * does not load analytics, pixels or any other non-essential script.
 */
export default function CookieBanner({
  onConsentChange,
  onNavigatePolicy,
  onPreferencesOpenChange,
  policyHref = '#legal/cookies',
  preferencesOpen,
}) {
  const [consent, setConsent] = useState(readCookieConsent)
  const [internalOpen, setInternalOpen] = useState(false)
  const controlled = typeof preferencesOpen === 'boolean'
  const dialogOpen = controlled ? preferencesOpen : internalOpen

  const setDialogOpen = useCallback((nextOpen) => {
    if (!controlled) setInternalOpen(nextOpen)
    onPreferencesOpenChange?.(nextOpen)
  }, [controlled, onPreferencesOpenChange])

  useEffect(() => {
    const openPreferences = () => setDialogOpen(true)
    const syncConsent = (event) => {
      if (event.type === 'storage' && event.key !== COOKIE_CONSENT_KEY) return
      setConsent(event.detail || readCookieConsent())
    }

    window.addEventListener(COOKIE_PREFERENCES_EVENT, openPreferences)
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, syncConsent)
    window.addEventListener('storage', syncConsent)
    return () => {
      window.removeEventListener(COOKIE_PREFERENCES_EVENT, openPreferences)
      window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, syncConsent)
      window.removeEventListener('storage', syncConsent)
    }
  }, [setDialogOpen])

  const choose = (preferences) => {
    const saved = saveCookieConsent(preferences)
    setConsent(saved)
    setDialogOpen(false)
    onConsentChange?.(saved)
  }

  const followPolicy = (event) => {
    if (!onNavigatePolicy) return
    event.preventDefault()
    onNavigatePolicy()
  }

  return (
    <>
      {!consent && (
        <aside className="tw-consent__banner" aria-label="Cookie notice" aria-live="polite">
          <div className="tw-consent__banner-copy">
            <strong>Cookie settings</strong>
            <p>
              This site uses necessary browser storage. Analytics and marketing remain off unless
              you allow them. <a href={policyHref} onClick={followPolicy}>Cookie policy</a>
            </p>
          </div>
          <div className="tw-consent__banner-actions">
            <button type="button" className="tw-consent__text-button" onClick={() => choose(NECESSARY_COOKIE_PREFERENCES)}>Reject optional</button>
            <button type="button" className="tw-consent__text-button" onClick={() => setDialogOpen(true)}>Customise</button>
            <button type="button" className="tw-consent__accept" onClick={() => choose({ necessary: true, analytics: true, marketing: true })}>
              Accept all
            </button>
          </div>
        </aside>
      )}

      <CookiePreferences
        open={dialogOpen}
        initialPreferences={consent || NECESSARY_COOKIE_PREFERENCES}
        onClose={() => setDialogOpen(false)}
        onSave={choose}
        onNavigatePolicy={onNavigatePolicy}
        policyHref={policyHref}
      />
    </>
  )
}
