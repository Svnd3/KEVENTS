import { useEffect, useId, useRef, useState } from 'react'
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck, X } from 'lucide-react'
import BrandLogo from '../components/BrandLogo.jsx'
import { AuthError, createAccount, signIn } from './authClient.js'
import useAccessibleDialog from './useAccessibleDialog.js'
import './account-ui.css'

const EMPTY_FORM = {
  displayName: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptedTerms: false,
  marketing: false,
}

function normaliseMode(mode) {
  return mode === 'sign-up' || mode === 'signup' ? 'sign-up' : 'sign-in'
}

function FieldError({ id, children }) {
  if (!children) return null
  return <span className="tw-field-error" id={id} role="alert">{children}</span>
}

export default function AuthDialog({
  open,
  mode = 'sign-in',
  onClose,
  onAuthenticated,
}) {
  const dialogRef = useRef(null)
  const titleId = useId()
  const descriptionId = useId()
  const idPrefix = useId()
  const [activeMode, setActiveMode] = useState(() => normaliseMode(mode))
  const [form, setForm] = useState(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useAccessibleDialog(open, dialogRef, onClose)

  useEffect(() => {
    setForm(EMPTY_FORM)
    setFieldErrors({})
    setFormError('')
    setNotice('')
    setShowPassword(false)
    if (open) setActiveMode(normaliseMode(mode))
  }, [mode, open])

  if (!open) return null

  const signingUp = activeMode === 'sign-up'

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: '' }))
    setFormError('')
  }

  const switchMode = () => {
    setActiveMode((current) => current === 'sign-in' ? 'sign-up' : 'sign-in')
    setFieldErrors({})
    setFormError('')
    setNotice('')
    setShowPassword(false)
  }

  const submit = async (event) => {
    event.preventDefault()
    setFormError('')
    setNotice('')
    if (signingUp && form.password !== form.confirmPassword) {
      setFieldErrors((current) => ({ ...current, confirmPassword: 'The passwords do not match.' }))
      return
    }

    setSubmitting(true)
    try {
      const result = signingUp ? await createAccount(form) : await signIn(form)
      setForm(EMPTY_FORM)
      onAuthenticated?.(result)
    } catch (error) {
      if (error instanceof AuthError) {
        setFieldErrors(error.fields || {})
        setFormError(error.message)
      } else {
        setFormError('Something went wrong in this browser. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const emailErrorId = `${idPrefix}-email-error`
  const passwordErrorId = `${idPrefix}-password-error`
  const nameErrorId = `${idPrefix}-name-error`
  const confirmErrorId = `${idPrefix}-confirm-error`
  const termsErrorId = `${idPrefix}-terms-error`

  return (
    <div
      className="tw-dialog-shell"
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.() }}
    >
      <section
        className="tw-auth-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        ref={dialogRef}
        tabIndex={-1}
      >
        <button className="tw-dialog-close" type="button" onClick={onClose} aria-label="Close account dialog">
          <X size={19} aria-hidden="true" />
        </button>

        <div className="tw-auth-dialog__brand"><BrandLogo /></div>
        <div className="tw-auth-dialog__intro">
          <span className="tw-kicker">{signingUp ? 'Create your space' : 'Welcome back'}</span>
          <h2 id={titleId}>{signingUp ? <>Keep every detail<br /><em>close.</em></> : <>Pick up where<br /><em>you left off.</em></>}</h2>
          <p id={descriptionId}>
            {signingUp
              ? 'Save your planning details and keep your invitation shortlist together on this device.'
              : 'Sign in to see your profile, preferences and planning details.'}
          </p>
        </div>

        <form className="tw-auth-form" onSubmit={submit} noValidate>
          {signingUp && (
            <label className="tw-form-field">
              <span>Your name</span>
              <input
                type="text"
                name="displayName"
                autoComplete="name"
                value={form.displayName}
                onChange={(event) => updateField('displayName', event.target.value)}
                aria-invalid={Boolean(fieldErrors.displayName)}
                aria-describedby={fieldErrors.displayName ? nameErrorId : undefined}
                placeholder="Njeri"
                maxLength={80}
                data-dialog-autofocus
              />
              <FieldError id={nameErrorId}>{fieldErrors.displayName}</FieldError>
            </label>
          )}

          <label className="tw-form-field">
            <span>Email address</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? emailErrorId : undefined}
              placeholder="you@example.com"
              maxLength={254}
              data-dialog-autofocus={!signingUp ? true : undefined}
            />
            <FieldError id={emailErrorId}>{fieldErrors.email}</FieldError>
          </label>

          <div className="tw-form-field">
            <label htmlFor={`${idPrefix}-password`}>Password</label>
            <span className="tw-password-field">
              <input
                id={`${idPrefix}-password`}
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete={signingUp ? 'new-password' : 'current-password'}
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? passwordErrorId : signingUp ? `${idPrefix}-password-hint` : undefined}
                maxLength={128}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </span>
            {signingUp && !fieldErrors.password && <small id={`${idPrefix}-password-hint`}>10+ characters, including a letter and number.</small>}
            <FieldError id={passwordErrorId}>{fieldErrors.password}</FieldError>
          </div>

          {signingUp && (
            <label className="tw-form-field">
              <span>Confirm password</span>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(event) => updateField('confirmPassword', event.target.value)}
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                aria-describedby={fieldErrors.confirmPassword ? confirmErrorId : undefined}
                maxLength={128}
              />
              <FieldError id={confirmErrorId}>{fieldErrors.confirmPassword}</FieldError>
            </label>
          )}

          {signingUp ? (
            <div className="tw-auth-form__checks">
              <div className="tw-check-field">
                <input
                  id={`${idPrefix}-terms`}
                  type="checkbox"
                  checked={form.acceptedTerms}
                  onChange={(event) => updateField('acceptedTerms', event.target.checked)}
                  aria-invalid={Boolean(fieldErrors.acceptedTerms)}
                  aria-describedby={fieldErrors.acceptedTerms ? termsErrorId : undefined}
                  aria-label="I agree to the Terms of Service and acknowledge the Privacy Notice"
                />
                <span><label htmlFor={`${idPrefix}-terms`}>I agree to the </label><a href="#terms" target="_blank" rel="noreferrer">Terms</a><span> and acknowledge the </span><a href="#privacy" target="_blank" rel="noreferrer">Privacy Notice</a><span>. Links open in a new tab.</span></span>
              </div>
              <FieldError id={termsErrorId}>{fieldErrors.acceptedTerms}</FieldError>
              <label className="tw-check-field">
                <input
                  type="checkbox"
                  checked={form.marketing}
                  onChange={(event) => updateField('marketing', event.target.checked)}
                />
                <span>Send me occasional design inspiration. Optional.</span>
              </label>
            </div>
          ) : (
            <button
              className="tw-auth-form__help"
              type="button"
              onClick={() => setNotice('Password recovery requires the production email service. In this local demo, create a different account or contact Tell & Wed.')}
            >
              Forgot your password?
            </button>
          )}

          {notice && <p className="tw-form-notice" role="status">{notice}</p>}
          {formError && <p className="tw-form-alert" role="alert">{formError}</p>}

          <button className="tw-primary-action" type="submit" disabled={submitting}>
            <span>{submitting ? 'Please wait…' : signingUp ? 'Create account' : 'Sign in'}</span>
            {!submitting && <ArrowRight size={17} aria-hidden="true" />}
          </button>
        </form>

        <p className="tw-auth-switch">
          {signingUp ? 'Already have an account?' : 'New to Tell & Wed?'}{' '}
          <button type="button" onClick={switchMode}>{signingUp ? 'Sign in' : 'Create one'}</button>
        </p>

        <div className="tw-demo-note">
          <ShieldCheck size={17} aria-hidden="true" />
          <p><strong>Private preview</strong><span>This demo stays in this browser. Your password is saved only as a salted verifier—not readable text. Production launch should use server authentication.</span></p>
          <LockKeyhole size={15} aria-hidden="true" />
        </div>
      </section>
    </div>
  )
}
