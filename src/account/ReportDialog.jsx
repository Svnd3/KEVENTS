import { useEffect, useId, useRef, useState } from 'react'
import { CheckCircle2, Send, ShieldAlert, X } from 'lucide-react'
import useAccessibleDialog from './useAccessibleDialog.js'
import './account-ui.css'

const REPORT_CATEGORIES = [
  ['broken', 'Something is not working'],
  ['content', 'Incorrect or unclear information'],
  ['accessibility', 'Accessibility problem'],
  ['privacy', 'Privacy or safety concern'],
  ['account', 'Account or sign-in problem'],
  ['order', 'Order or enquiry problem'],
  ['other', 'Something else'],
]

function clean(value, maximum) {
  return String(value || '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .trim()
    .slice(0, maximum)
}

function initialPage() {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}${window.location.pathname}${window.location.hash}`.slice(0, 500)
}

function initialForm(user) {
  return {
    category: 'broken',
    summary: '',
    details: '',
    page: initialPage(),
    email: clean(user?.email, 254),
    includeDiagnostics: false,
    website: '',
  }
}

function receiptId() {
  const suffix = globalThis.crypto?.randomUUID?.().split('-')[0]
    || Date.now().toString(36).toUpperCase()
  return `TW-${suffix.toUpperCase()}`
}

function validEmail(value) {
  return !value || (value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(value))
}

export default function ReportDialog({ open, onClose, user, source = 'website', onSubmitted }) {
  const dialogRef = useRef(null)
  const titleId = useId()
  const descriptionId = useId()
  const idPrefix = useId()
  const [form, setForm] = useState(() => initialForm(user))
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [receipt, setReceipt] = useState(null)
  const endpoint = import.meta.env.VITE_REPORT_ENDPOINT
  const userEmail = user?.email || ''

  useAccessibleDialog(open, dialogRef, onClose)

  useEffect(() => {
    setForm(initialForm({ email: userEmail }))
    setErrors({})
    setSubmitError('')
    setReceipt(null)
  }, [open, userEmail])

  if (!open) return null

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setSubmitError('')
  }

  const submit = async (event) => {
    event.preventDefault()
    if (form.website) return

    const summary = clean(form.summary, 120)
    const details = clean(form.details, 2_000)
    const email = clean(form.email, 254).toLocaleLowerCase('en')
    const nextErrors = {}
    if (summary.length < 5) nextErrors.summary = 'Add a short, descriptive summary.'
    if (details.length < 10) nextErrors.details = 'Tell us a little more so we can investigate.'
    if (!validEmail(email)) nextErrors.email = 'Enter a valid email or leave this blank.'
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    setSubmitting(true)
    setSubmitError('')
    const id = receiptId()
    const payload = {
      schema: 'tell-and-wed-report-v1',
      receipt: id,
      category: REPORT_CATEGORIES.some(([value]) => value === form.category) ? form.category : 'other',
      summary,
      details,
      page: clean(form.page, 500),
      contactEmail: email || null,
      accountId: user?.id || null,
      source: clean(source, 80) || 'website',
      submittedAt: new Date().toISOString(),
      diagnostics: form.includeDiagnostics
        ? {
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            language: navigator.language,
            userAgent: navigator.userAgent.slice(0, 300),
          }
        : null,
    }

    try {
      if (endpoint) {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!response.ok) throw new Error(`Report endpoint returned ${response.status}`)
      }
      const result = { id, demo: !endpoint, submittedAt: payload.submittedAt }
      setReceipt(result)
      onSubmitted?.({ ...result, payload })
    } catch {
      setSubmitError('We could not send the report. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="tw-dialog-shell tw-dialog-shell--report"
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.() }}
    >
      <section
        className="tw-report-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        ref={dialogRef}
        tabIndex={-1}
      >
        <button className="tw-dialog-close" type="button" onClick={onClose} aria-label="Close report form">
          <X size={19} aria-hidden="true" />
        </button>

        {receipt ? (
          <div className="tw-report-success">
            <span className="tw-report-success__icon"><CheckCircle2 size={27} aria-hidden="true" /></span>
            <span className="tw-kicker">Report</span>
            <h2 id={titleId}>{receipt.demo ? 'Demo report created' : 'Report received'}</h2>
            <p id={descriptionId}>
              {receipt.demo
                ? 'No report was sent because a report endpoint has not been connected yet.'
                : 'Keep this reference in case you need to follow up with us.'}
            </p>
            <div className="tw-report-receipt"><span>Reference</span><strong>{receipt.id}</strong></div>
            <button className="tw-primary-action" type="button" onClick={onClose} data-dialog-autofocus>
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="tw-report-dialog__intro">
              <span className="tw-kicker">Support</span>
              <h2 id={titleId}>Report a problem</h2>
              <p id={descriptionId}>Tell us what went wrong so we can investigate.</p>
            </div>

            <form className="tw-report-form" onSubmit={submit} noValidate>
              <label className="tw-form-field">
                <span>What kind of issue is this?</span>
                <select
                  value={form.category}
                  onChange={(event) => updateField('category', event.target.value)}
                  data-dialog-autofocus
                >
                  {REPORT_CATEGORIES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                </select>
              </label>

              <label className="tw-form-field">
                <span>Short summary</span>
                <input
                  value={form.summary}
                  onChange={(event) => updateField('summary', event.target.value)}
                  maxLength={120}
                  placeholder="The preview button does not open"
                  aria-invalid={Boolean(errors.summary)}
                  aria-describedby={errors.summary ? `${idPrefix}-summary-error` : undefined}
                />
                <span className="tw-field-meta"><span>{errors.summary && <span className="tw-field-error" id={`${idPrefix}-summary-error`} role="alert">{errors.summary}</span>}</span><small>{form.summary.length}/120</small></span>
              </label>

              <label className="tw-form-field">
                <span>What happened?</span>
                <textarea
                  value={form.details}
                  onChange={(event) => updateField('details', event.target.value)}
                  rows={5}
                  maxLength={2_000}
                  placeholder="What did you expect, and what happened instead?"
                  aria-invalid={Boolean(errors.details)}
                  aria-describedby={errors.details ? `${idPrefix}-details-error` : undefined}
                />
                <span className="tw-field-meta"><span>{errors.details && <span className="tw-field-error" id={`${idPrefix}-details-error`} role="alert">{errors.details}</span>}</span><small>{form.details.length}/2000</small></span>
              </label>

              <label className="tw-form-field">
                <span>Page or invitation</span>
                <input value={form.page} onChange={(event) => updateField('page', event.target.value)} maxLength={500} />
              </label>

              <label className="tw-form-field">
                <span>Reply email <small>Optional</small></span>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  maxLength={254}
                  placeholder="you@example.com"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? `${idPrefix}-email-error` : undefined}
                />
                {errors.email && <span className="tw-field-error" id={`${idPrefix}-email-error`} role="alert">{errors.email}</span>}
              </label>

              <label className="tw-check-field tw-check-field--boxed">
                <input
                  type="checkbox"
                  checked={form.includeDiagnostics}
                  onChange={(event) => updateField('includeDiagnostics', event.target.checked)}
                />
                <span><strong>Include browser details</strong><small>Adds browser, language and screen size—never passwords or form content.</small></span>
              </label>

              <label className="tw-honeypot" aria-hidden="true">
                Website<input value={form.website} onChange={(event) => updateField('website', event.target.value)} tabIndex={-1} autoComplete="off" />
              </label>

              {submitError && <p className="tw-form-alert" role="alert">{submitError}</p>}
              {!endpoint && <p className="tw-form-notice"><ShieldAlert size={15} aria-hidden="true" /> Preview mode: submitting creates a receipt, but does not send the report.</p>}

              <button className="tw-primary-action" type="submit" disabled={submitting}>
                <span>{submitting ? 'Sending…' : endpoint ? 'Send report' : 'Create demo receipt'}</span>
                {!submitting && <Send size={16} aria-hidden="true" />}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  )
}

export { REPORT_CATEGORIES }
