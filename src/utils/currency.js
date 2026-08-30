export const BASE_CURRENCY = 'KES'
export const CURRENCY_PREFERENCE_STORAGE_KEY = 'tell-and-wed:currency-preference:v1'
export const EXCHANGE_RATE_UPDATED_AT = '2026-08-30'
export const EXCHANGE_RATE_UPDATE_LABEL = 'Indicative rates updated 30 Aug 2026'

// Static browsing estimates. The checkout/invoice amount should remain authoritative in KES.
export const CURRENCY_CATALOG = Object.freeze({
  KES: Object.freeze({ code: 'KES', name: 'Kenyan shilling', locale: 'en-KE', rateFromKes: 1 }),
  UGX: Object.freeze({ code: 'UGX', name: 'Ugandan shilling', locale: 'en-UG', rateFromKes: 27.6 }),
  TZS: Object.freeze({ code: 'TZS', name: 'Tanzanian shilling', locale: 'en-TZ', rateFromKes: 20.1 }),
  RWF: Object.freeze({ code: 'RWF', name: 'Rwandan franc', locale: 'en-RW', rateFromKes: 10.6 }),
  NGN: Object.freeze({ code: 'NGN', name: 'Nigerian naira', locale: 'en-NG', rateFromKes: 11.8 }),
  ZAR: Object.freeze({ code: 'ZAR', name: 'South African rand', locale: 'en-ZA', rateFromKes: 0.136 }),
  USD: Object.freeze({ code: 'USD', name: 'US dollar', locale: 'en-US', rateFromKes: 0.00773 }),
  GBP: Object.freeze({ code: 'GBP', name: 'British pound', locale: 'en-GB', rateFromKes: 0.00572 }),
  EUR: Object.freeze({ code: 'EUR', name: 'Euro', locale: 'en-IE', rateFromKes: 0.00661 }),
  CAD: Object.freeze({ code: 'CAD', name: 'Canadian dollar', locale: 'en-CA', rateFromKes: 0.01065 }),
  AUD: Object.freeze({ code: 'AUD', name: 'Australian dollar', locale: 'en-AU', rateFromKes: 0.0118 }),
  INR: Object.freeze({ code: 'INR', name: 'Indian rupee', locale: 'en-IN', rateFromKes: 0.675 }),
  AED: Object.freeze({ code: 'AED', name: 'UAE dirham', locale: 'en-AE', rateFromKes: 0.0284 }),
})

export const SUPPORTED_CURRENCIES = Object.freeze(Object.values(CURRENCY_CATALOG))

export const EXCHANGE_RATES_FROM_KES = Object.freeze(
  Object.fromEntries(SUPPORTED_CURRENCIES.map((currency) => [currency.code, currency.rateFromKes])),
)

export const SUPPORTED_COUNTRIES = Object.freeze([
  Object.freeze({ code: 'KE', name: 'Kenya', currencyCode: 'KES', locale: 'en-KE' }),
  Object.freeze({ code: 'UG', name: 'Uganda', currencyCode: 'UGX', locale: 'en-UG' }),
  Object.freeze({ code: 'TZ', name: 'Tanzania', currencyCode: 'TZS', locale: 'en-TZ' }),
  Object.freeze({ code: 'RW', name: 'Rwanda', currencyCode: 'RWF', locale: 'en-RW' }),
  Object.freeze({ code: 'NG', name: 'Nigeria', currencyCode: 'NGN', locale: 'en-NG' }),
  Object.freeze({ code: 'ZA', name: 'South Africa', currencyCode: 'ZAR', locale: 'en-ZA' }),
  Object.freeze({ code: 'US', name: 'United States', currencyCode: 'USD', locale: 'en-US' }),
  Object.freeze({ code: 'GB', name: 'United Kingdom', currencyCode: 'GBP', locale: 'en-GB' }),
  Object.freeze({ code: 'AT', name: 'Austria', currencyCode: 'EUR', locale: 'de-AT' }),
  Object.freeze({ code: 'BE', name: 'Belgium', currencyCode: 'EUR', locale: 'nl-BE' }),
  Object.freeze({ code: 'BG', name: 'Bulgaria', currencyCode: 'EUR', locale: 'bg-BG' }),
  Object.freeze({ code: 'HR', name: 'Croatia', currencyCode: 'EUR', locale: 'hr-HR' }),
  Object.freeze({ code: 'CY', name: 'Cyprus', currencyCode: 'EUR', locale: 'el-CY' }),
  Object.freeze({ code: 'EE', name: 'Estonia', currencyCode: 'EUR', locale: 'et-EE' }),
  Object.freeze({ code: 'FI', name: 'Finland', currencyCode: 'EUR', locale: 'fi-FI' }),
  Object.freeze({ code: 'FR', name: 'France', currencyCode: 'EUR', locale: 'fr-FR' }),
  Object.freeze({ code: 'DE', name: 'Germany', currencyCode: 'EUR', locale: 'de-DE' }),
  Object.freeze({ code: 'GR', name: 'Greece', currencyCode: 'EUR', locale: 'el-GR' }),
  Object.freeze({ code: 'IE', name: 'Ireland', currencyCode: 'EUR', locale: 'en-IE' }),
  Object.freeze({ code: 'IT', name: 'Italy', currencyCode: 'EUR', locale: 'it-IT' }),
  Object.freeze({ code: 'LV', name: 'Latvia', currencyCode: 'EUR', locale: 'lv-LV' }),
  Object.freeze({ code: 'LT', name: 'Lithuania', currencyCode: 'EUR', locale: 'lt-LT' }),
  Object.freeze({ code: 'LU', name: 'Luxembourg', currencyCode: 'EUR', locale: 'fr-LU' }),
  Object.freeze({ code: 'MT', name: 'Malta', currencyCode: 'EUR', locale: 'mt-MT' }),
  Object.freeze({ code: 'NL', name: 'Netherlands', currencyCode: 'EUR', locale: 'nl-NL' }),
  Object.freeze({ code: 'PT', name: 'Portugal', currencyCode: 'EUR', locale: 'pt-PT' }),
  Object.freeze({ code: 'SK', name: 'Slovakia', currencyCode: 'EUR', locale: 'sk-SK' }),
  Object.freeze({ code: 'SI', name: 'Slovenia', currencyCode: 'EUR', locale: 'sl-SI' }),
  Object.freeze({ code: 'ES', name: 'Spain', currencyCode: 'EUR', locale: 'es-ES' }),
  Object.freeze({ code: 'CA', name: 'Canada', currencyCode: 'CAD', locale: 'en-CA' }),
  Object.freeze({ code: 'AU', name: 'Australia', currencyCode: 'AUD', locale: 'en-AU' }),
  Object.freeze({ code: 'IN', name: 'India', currencyCode: 'INR', locale: 'en-IN' }),
  Object.freeze({ code: 'AE', name: 'United Arab Emirates', currencyCode: 'AED', locale: 'en-AE' }),
])

const COUNTRY_BY_CODE = new Map(SUPPORTED_COUNTRIES.map((country) => [country.code, country]))

const TIME_ZONE_COUNTRY_CODES = Object.freeze({
  'Africa/Nairobi': 'KE',
  'Africa/Kampala': 'UG',
  'Africa/Dar_es_Salaam': 'TZ',
  'Africa/Kigali': 'RW',
  'Africa/Lagos': 'NG',
  'Africa/Johannesburg': 'ZA',
  'Europe/London': 'GB',
  'Europe/Belfast': 'GB',
  'Europe/Vienna': 'AT',
  'Europe/Brussels': 'BE',
  'Europe/Sofia': 'BG',
  'Europe/Zagreb': 'HR',
  'Asia/Nicosia': 'CY',
  'Europe/Nicosia': 'CY',
  'Europe/Tallinn': 'EE',
  'Europe/Helsinki': 'FI',
  'Europe/Paris': 'FR',
  'Europe/Berlin': 'DE',
  'Europe/Busingen': 'DE',
  'Europe/Athens': 'GR',
  'Europe/Dublin': 'IE',
  'Europe/Rome': 'IT',
  'Europe/Riga': 'LV',
  'Europe/Vilnius': 'LT',
  'Europe/Luxembourg': 'LU',
  'Europe/Malta': 'MT',
  'Europe/Amsterdam': 'NL',
  'Europe/Lisbon': 'PT',
  'Atlantic/Azores': 'PT',
  'Atlantic/Madeira': 'PT',
  'Europe/Bratislava': 'SK',
  'Europe/Ljubljana': 'SI',
  'Europe/Madrid': 'ES',
  'Atlantic/Canary': 'ES',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'America/Edmonton': 'CA',
  'America/Winnipeg': 'CA',
  'America/Halifax': 'CA',
  'America/St_Johns': 'CA',
  'Asia/Kolkata': 'IN',
  'Asia/Calcutta': 'IN',
  'Asia/Dubai': 'AE',
})

const US_TIME_ZONE_PREFIXES = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu']
const AUSTRALIAN_TIME_ZONE_PREFIX = 'Australia/'

function normaliseCode(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : ''
}

function safeBrowserLanguages() {
  if (typeof navigator === 'undefined') return []
  if (Array.isArray(navigator.languages) && navigator.languages.length) return navigator.languages
  return navigator.language ? [navigator.language] : []
}

function safeBrowserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  } catch {
    return ''
  }
}

function regionFromLanguageTag(languageTag) {
  if (typeof languageTag !== 'string' || !languageTag.trim()) return ''
  try {
    return new Intl.Locale(languageTag).region || ''
  } catch {
    const match = languageTag.match(/[-_]([A-Za-z]{2}|\d{3})(?:$|[-_])/)
    return match?.[1]?.toUpperCase() || ''
  }
}

function countryCodeFromRegion(region) {
  const code = normaliseCode(region)
  if (COUNTRY_BY_CODE.has(code)) return code
  return ''
}

function countryCodeFromTimeZone(timeZone) {
  if (!timeZone) return ''
  if (TIME_ZONE_COUNTRY_CODES[timeZone]) return TIME_ZONE_COUNTRY_CODES[timeZone]
  if (US_TIME_ZONE_PREFIXES.includes(timeZone)) return 'US'
  if (timeZone.startsWith(AUSTRALIAN_TIME_ZONE_PREFIX)) return 'AU'
  return ''
}

export function getCountryByCode(countryCode) {
  return COUNTRY_BY_CODE.get(normaliseCode(countryCode)) || null
}

export function getCurrencyByCode(currencyCode) {
  return CURRENCY_CATALOG[normaliseCode(currencyCode)] || null
}

/**
 * Infers a supported country without an IP lookup or geolocation permission.
 * A recognized browser time zone is considered first (it better reflects where
 * someone is now), then language/region. Neither signal leaves the browser.
 */
export function inferCountryCode({ languages, language, timeZone } = {}) {
  const timeZoneCountryCode = countryCodeFromTimeZone(timeZone ?? safeBrowserTimeZone())
  if (timeZoneCountryCode) return timeZoneCountryCode

  const languageCandidates = Array.isArray(languages) && languages.length
    ? languages
    : language
      ? [language]
      : safeBrowserLanguages()

  for (const languageTag of languageCandidates) {
    const countryCode = countryCodeFromRegion(regionFromLanguageTag(languageTag))
    if (countryCode) return countryCode
  }

  return 'KE'
}

export function inferCountry(browserDetails) {
  return getCountryByCode(inferCountryCode(browserDetails)) || SUPPORTED_COUNTRIES[0]
}

export function convertFromKes(amountKes, currencyCode = BASE_CURRENCY) {
  const amount = Number(amountKes)
  const currency = getCurrencyByCode(currencyCode) || CURRENCY_CATALOG[BASE_CURRENCY]
  if (!Number.isFinite(amount)) return 0
  return amount * currency.rateFromKes
}

export function formatCurrencyAmount(amount, currencyCode = BASE_CURRENCY, options = {}) {
  const currency = getCurrencyByCode(currencyCode) || CURRENCY_CATALOG[BASE_CURRENCY]
  const numericAmount = Number(amount)
  const {
    locale = currency.locale,
    currencyDisplay = 'narrowSymbol',
    maximumFractionDigits = 0,
    minimumFractionDigits = 0,
  } = options

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.code,
    currencyDisplay,
    maximumFractionDigits,
    minimumFractionDigits,
  }).format(Number.isFinite(numericAmount) ? numericAmount : 0)
}

export function formatPriceFromKes(amountKes, currencyCode = BASE_CURRENCY, options = {}) {
  return formatCurrencyAmount(convertFromKes(amountKes, currencyCode), currencyCode, options)
}

export function formatPriceRangeFromKes(minimumKes, maximumKes, currencyCode = BASE_CURRENCY, options = {}) {
  const minimum = formatPriceFromKes(minimumKes, currencyCode, options)
  const maximum = formatPriceFromKes(maximumKes, currencyCode, options)
  return `${minimum}–${maximum}`
}

/**
 * Produces a compare-at price that ends in 900 KES, matching the catalog's pricing cadence.
 */
export function calculateCompareAtPriceKes(priceKes, markup = 0.18) {
  const price = Math.max(0, Number(priceKes) || 0)
  const safeMarkup = Number.isFinite(markup) ? Math.max(0, markup) : 0.18
  const candidate = Math.ceil(((price * (1 + safeMarkup)) + 100) / 1000) * 1000 - 100
  return Math.max(price + 1000, candidate)
}

// Short integration-friendly alias; both values are always expressed in base KES.
export function getCompareAtPrice(priceKes, markup) {
  return calculateCompareAtPriceKes(priceKes, markup)
}

function resolveStorage(storage) {
  if (storage) return storage
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

export function readCurrencyPreference(storage) {
  const target = resolveStorage(storage)
  if (!target) return null
  try {
    const parsed = JSON.parse(target.getItem(CURRENCY_PREFERENCE_STORAGE_KEY) || 'null')
    const country = getCountryByCode(parsed?.countryCode)
    if (!country) return null
    return { countryCode: country.code, currencyCode: country.currencyCode, mode: 'manual' }
  } catch {
    return null
  }
}

export function writeCurrencyPreference(preference, storage) {
  const target = resolveStorage(storage)
  if (!target) return false
  const country = getCountryByCode(preference?.countryCode)
  if (!country) return false
  try {
    target.setItem(CURRENCY_PREFERENCE_STORAGE_KEY, JSON.stringify({
      countryCode: country.code,
      updatedAt: new Date().toISOString(),
    }))
    return true
  } catch {
    return false
  }
}

export function clearCurrencyPreference(storage) {
  const target = resolveStorage(storage)
  if (!target) return false
  try {
    target.removeItem(CURRENCY_PREFERENCE_STORAGE_KEY)
    return true
  } catch {
    return false
  }
}
