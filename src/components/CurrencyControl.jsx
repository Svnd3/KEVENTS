import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { ChevronDown } from 'lucide-react'
import {
  BASE_CURRENCY,
  CURRENCY_CATALOG,
  SUPPORTED_COUNTRIES,
  calculateCompareAtPriceKes,
  clearCurrencyPreference,
  convertFromKes,
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
  const currency = getCurrencyByCode(country.currencyCode) || CURRENCY_CATALOG[BASE_CURRENCY]

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

  const resetToAutomatic = useCallback(() => {
    setPreference(getAutomaticPreference())
  }, [])

  const value = useMemo(() => ({
    country,
    countryCode: country.code,
    currency,
    currencyCode: currency.code,
    isAutomatic: preference.mode === 'automatic',
    setCountry,
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
  }), [country, currency, preference.mode, resetToAutomatic, setCountry])

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
  return String.fromCodePoint(...countryCode.split('').map((letter) => letter.charCodeAt(0) + 127397))
}

export function CurrencyControl({ className = '', compact = false }) {
  const {
    country,
    countryCode,
    resetToAutomatic,
    setCountry,
  } = useCurrency()
  const handleCountryChange = (event) => {
    if (event.target.value === '__automatic__') resetToAutomatic()
    else setCountry(event.target.value)
  }

  return (
    <div className={`currency-control ${compact ? 'currency-control--compact' : ''} ${className}`.trim()}>
      <label className="currency-control__trigger">
        <span className="currency-control__flag" aria-hidden="true">{countryFlag(countryCode)}</span>
        <span className="currency-control__trigger-copy">
          <strong>{country.name}</strong>
        </span>
        <ChevronDown size={14} aria-hidden="true" />
        <select
          aria-label={`Country: ${country.name}`}
          value={countryCode}
          onChange={handleCountryChange}
        >
          <option value="__automatic__">Detect automatically</option>
          {SUPPORTED_COUNTRIES.map((option) => (
            <option key={option.code} value={option.code}>
              {countryFlag(option.code)} {option.name}
            </option>
          ))}
        </select>
      </label>
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
  const { formatPrice } = useCurrency()
  const hasCompareAt = showCompareAt
    && Number.isFinite(Number(compareAtKes))
    && Number(compareAtKes) > Number(priceKes)
  const currentPrice = formatPrice(priceKes)
  const previousPrice = hasCompareAt ? formatPrice(compareAtKes) : ''
  const accessibleLabel = hasCompareAt
    ? `${currentLabel} ${currentPrice}; was ${previousPrice}${suffix ? `; ${suffix}` : ''}`
    : `${currentPrice}${suffix ? `; ${suffix}` : ''}`

  return (
    <span
      className={`price-display ${compact ? 'price-display--compact' : ''} ${className}`.trim()}
      aria-label={accessibleLabel}
    >
      {hasCompareAt && (
        <span className="price-display__was" aria-hidden="true">
          <small>Was</small>
          <del>{previousPrice}</del>
        </span>
      )}
      {hasCompareAt ? (
        <span className="price-display__current" aria-hidden="true">
          <small>{currentLabel}</small>
          <strong>{currentPrice}</strong>
        </span>
      ) : (
        <span className="price-display__current price-display__current--standard" aria-hidden="true">
          <strong>{currentPrice}</strong>
          {suffix && <small>{suffix}</small>}
        </span>
      )}
      {hasCompareAt && suffix && <span className="price-display__suffix" aria-hidden="true">{suffix}</span>}
    </span>
  )
}

// Convenience re-export for callers that keep all price UI imports together.
// eslint-disable-next-line react-refresh/only-export-components
export { getCompareAtPrice } from '../utils/currency.js'
