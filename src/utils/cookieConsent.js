export const COOKIE_CONSENT_KEY = 'tell-and-wed:cookie-consent:v1'
export const COOKIE_CONSENT_VERSION = 1
export const COOKIE_PREFERENCES_EVENT = 'tellandwed:open-cookie-preferences'
export const COOKIE_CONSENT_CHANGED_EVENT = 'tellandwed:cookie-consent-changed'
export const NECESSARY_COOKIE_PREFERENCES = Object.freeze({
  necessary: true,
  analytics: false,
  marketing: false,
})

const CONSENT_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000

export function normaliseCookiePreferences(value) {
  return {
    necessary: true,
    analytics: value?.analytics === true,
    marketing: value?.marketing === true,
  }
}

export function readCookieConsent() {
  if (typeof window === 'undefined') return null

  try {
    const parsed = JSON.parse(window.localStorage.getItem(COOKIE_CONSENT_KEY) || 'null')
    const savedAt = Date.parse(parsed?.updatedAt)
    if (
      parsed?.version !== COOKIE_CONSENT_VERSION
      || !Number.isFinite(savedAt)
      || Date.now() - savedAt > CONSENT_MAX_AGE_MS
    ) return null

    return {
      ...normaliseCookiePreferences(parsed),
      version: parsed.version,
      updatedAt: parsed.updatedAt,
    }
  } catch {
    return null
  }
}

export function saveCookieConsent(preferences) {
  const saved = {
    ...normaliseCookiePreferences(preferences),
    version: COOKIE_CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
  }

  if (typeof window === 'undefined') return saved

  try {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(saved))
  } catch {
    // The in-memory React state still respects this choice for the current page.
  }

  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_CHANGED_EVENT, { detail: saved }))
  return saved
}

export function hasCookieConsent(category) {
  if (category === 'necessary') return true
  const consent = readCookieConsent()
  return consent?.[category] === true
}

/** Opens preferences in any mounted CookieBanner. */
export function openCookiePreferences() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(COOKIE_PREFERENCES_EVENT))
}
