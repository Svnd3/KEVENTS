import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Check, ChevronDown, Globe2, LocateFixed, X } from 'lucide-react'
import {
  BASE_CURRENCY,
  CURRENCY_CATALOG,
  EXCHANGE_RATE_UPDATED_AT,
  EXCHANGE_RATE_UPDATE_LABEL,
  SUPPORTED_COUNTRIES,
  SUPPORTED_CURRENCIES,
  calculateCompareAtPriceKes,
  clearCurrencyPreference,
  convertFromKes,
  formatCurrencyAmount,
  formatPriceFromKes,
  formatPriceRangeFromKes,
  getCountryByCode,
  getCurrencyByCode,
  inferCountry,
  readCurrencyPreference,
  writeCurrencyPreference,
} from '../utils/currency.js'
import './currency-control.css'

const CurrencyContext = createContext(null)

function getAutomaticPreference() {
  const country = inferCountry()
  return {
    countryCode: country.code,
    currencyCode: country.currencyCode,
    mode: 'automatic',
  }
}

function getInitialPreference() {
  return readCurrencyPreference() || getAutomaticPreference()
}

export function CurrencyProvider({ children }) {
  const [preference, setPreference] = useState(getInitialPreference)

  const country = getCountryByCode(preference.countryCode) || SUPPORTED_COUNTRIES[0]
  const currency = getCurrencyByCode(preference.currencyCode) || CURRENCY_CATALOG[BASE_CURRENCY]

  useEffect(() => {
    if (preference.mode === 'manual') writeCurrencyPreference(preference)
    else clearCurrencyPreference()
  }, [preference])

  const setCountry = useCallback((countryCode) => {
    const nextCountry = getCountryByCode(countryCode)
    if (!nextCountry) return
    setPreference({
      countryCode: nextCountry.code,
      currencyCode: nextCountry.currencyCode,
      mode: 'manual',
    })
  }, [])

  const setCurrency = useCallback((currencyCode) => {
    const nextCurrency = getCurrencyByCode(currencyCode)
    if (!nextCurrency) return
    setPreference((current) => ({
      ...current,
      currencyCode: nextCurrency.code,
      mode: 'manual',
    }))
  }, [])

  const resetToAutomatic = useCallback(() => {
    setPreference(getAutomaticPreference())
  }, [])

  const value = useMemo(() => ({
    country,
    countryCode: country.code,
    currency,
    currencyCode: currency.code,
    isAutomatic: preference.mode === 'automatic',
    rateFromKes: currency.rateFromKes,
    rateUpdatedAt: EXCHANGE_RATE_UPDATED_AT,
    rateUpdateLabel: EXCHANGE_RATE_UPDATE_LABEL,
    setCountry,
    setCurrency,
    resetToAutomatic,
    getCompareAtPrice: calculateCompareAtPriceKes,
    convertPrice: (priceKes) => convertFromKes(priceKes, currency.code),
    formatPrice: (priceKes, options) => formatPriceFromKes(priceKes, currency.code, {
      locale: country.locale,
      ...options,
    }),
    formatRange: (minimumKes, maximumKes, options) => formatPriceRangeFromKes(
      minimumKes,
      maximumKes,
      currency.code,
      { locale: country.locale, ...options },
    ),
  }), [country, currency, preference.mode, resetToAutomatic, setCountry, setCurrency])

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

// Kept beside the provider so consumers need only one pricing module.
// eslint-disable-next-line react-refresh/only-export-components
export function useCurrency() {
  const value = useContext(CurrencyContext)
  if (!value) throw new Error('useCurrency must be used inside a CurrencyProvider')
  return value
}

function countryFlag(countryCode) {
  if (countryCode === 'EU') return '🇪🇺'
  return String.fromCodePoint(...countryCode.split('').map((letter) => letter.charCodeAt(0) + 127397))
}

export function CurrencyControl({ className = '', compact = false }) {
  const {
    country,
    countryCode,
    currencyCode,
    isAutomatic,
    rateFromKes,
    rateUpdateLabel,
    resetToAutomatic,
    setCountry,
    setCurrency,
  } = useCurrency()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const countrySelectRef = useRef(null)
  const panelId = useId()

  const close = useCallback((restoreFocus = false) => {
    setOpen(false)
    if (restoreFocus) window.requestAnimationFrame(() => triggerRef.current?.focus())
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const focusFrame = window.requestAnimationFrame(() => countrySelectRef.current?.focus())
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) close()
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') close(true)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [close, open])

  const rateLabel = currencyCode === BASE_CURRENCY
    ? 'Base currency'
    : `1 KES ≈ ${formatCurrencyAmount(rateFromKes, currencyCode, {
      locale: country.locale,
      maximumFractionDigits: rateFromKes < 0.1 ? 4 : 2,
    })}`

  return (
    <div ref={rootRef} className={`currency-control ${compact ? 'currency-control--compact' : ''} ${className}`.trim()}>
      <button
        ref={triggerRef}
        className="currency-control__trigger"
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
      >
        <Globe2 size={16} aria-hidden="true" />
        <span className="currency-control__flag" aria-hidden="true">{countryFlag(countryCode)}</span>
        <span className="currency-control__trigger-copy">
          <strong>{currencyCode}</strong>
          {!compact && <small>{country.name}</small>}
        </span>
        <ChevronDown className={open ? 'is-open' : ''} size={14} aria-hidden="true" />
      </button>

      {open && (
        <section id={panelId} className="currency-control__panel" role="dialog" aria-label="Country and currency settings">
          <div className="currency-control__heading">
            <div>
              <span className="currency-control__eyebrow">Price settings</span>
              <h2>Prices that feel local</h2>
            </div>
            <button className="currency-control__close" type="button" onClick={() => close(true)} aria-label="Close currency settings">
              <X size={17} />
            </button>
          </div>

          <p className="currency-control__privacy">
            We use only your browser language and time zone. No precise location or IP lookup is used.
          </p>

          <div className="currency-control__fields">
            <label>
              <span>Country or region</span>
              <span className="currency-control__select-wrap">
                <select ref={countrySelectRef} value={countryCode} onChange={(event) => setCountry(event.target.value)}>
                  {SUPPORTED_COUNTRIES.map((option) => (
                    <option key={option.code} value={option.code}>{option.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} aria-hidden="true" />
              </span>
            </label>

            <label>
              <span>Display currency</span>
              <span className="currency-control__select-wrap">
                <select value={currencyCode} onChange={(event) => setCurrency(event.target.value)}>
                  {SUPPORTED_CURRENCIES.map((option) => (
                    <option key={option.code} value={option.code}>{option.code} — {option.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} aria-hidden="true" />
              </span>
            </label>
          </div>

          <div className="currency-control__rate" aria-live="polite">
            <div>
              <span>{rateLabel}</span>
              <small>{rateUpdateLabel}</small>
            </div>
            <span className="currency-control__status"><Check size={12} /> {isAutomatic ? 'Automatic' : 'Saved'}</span>
          </div>

          <button className="currency-control__automatic" type="button" onClick={resetToAutomatic}>
            <LocateFixed size={15} aria-hidden="true" />
            Use my browser settings
          </button>

          <p className="currency-control__footnote">
            Foreign-currency prices are estimates for browsing. Your final quote and invoice confirm the KES amount.
          </p>
        </section>
      )}
    </div>
  )
}

export function PriceDisplay({
  price,
  compareAt,
  priceKes = price,
  compareAtKes = compareAt,
  currentLabel = 'Now',
  showCompareAt = compareAtKes != null,
  suffix = 'One-time',
  compact = false,
  className = '',
}) {
  const { currencyCode, formatPrice, rateUpdateLabel } = useCurrency()
  const hasCompareAt = showCompareAt
    && Number.isFinite(Number(compareAtKes))
    && Number(compareAtKes) > Number(priceKes)
  const currentPrice = formatPrice(priceKes)
  const previousPrice = hasCompareAt ? formatPrice(compareAtKes) : ''
  const approximate = currencyCode !== BASE_CURRENCY
  const accessibleLabel = hasCompareAt
    ? `${currentLabel} ${currentPrice}; was ${previousPrice}${suffix ? `; ${suffix}` : ''}`
    : `${currentPrice}${suffix ? `; ${suffix}` : ''}`

  return (
    <span
      className={`price-display ${compact ? 'price-display--compact' : ''} ${className}`.trim()}
      title={approximate ? rateUpdateLabel : undefined}
      aria-label={accessibleLabel}
    >
      {hasCompareAt && (
        <span className="price-display__was" aria-hidden="true">
          <small>Was</small>
          <del>{previousPrice}</del>
        </span>
      )}
      <span className="price-display__current" aria-hidden="true">
        <small>{hasCompareAt ? currentLabel : suffix}</small>
        <strong>{approximate && <span className="price-display__approx">≈</span>}{currentPrice}</strong>
      </span>
      {hasCompareAt && suffix && <span className="price-display__suffix" aria-hidden="true">{suffix}</span>}
    </span>
  )
}

// Convenience re-export for callers that keep all price UI imports together.
// eslint-disable-next-line react-refresh/only-export-components
export { getCompareAtPrice } from '../utils/currency.js'
