import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CircleUserRound,
  FileText,
  Flag,
  Heart,
  Inbox,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Palette,
  Save,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  UserRound,
  WalletCards,
} from 'lucide-react'
import BrandLogo from '../components/BrandLogo.jsx'
import { AuthError } from './authClient.js'
import useAuthSession from './useAuthSession.js'
import './account-ui.css'

const SAVED_DESIGNS_KEY = 'tell-and-wed:saved-designs:v1'

const ACCOUNT_SECTIONS = [
  ['overview', 'Overview', LayoutDashboard],
  ['profile', 'Your details', UserRound],
  ['preferences', 'Preferences', Settings2],
  ['activity', 'Orders & enquiries', Inbox],
  ['security', 'Security', LockKeyhole],
]

function titleFromSlug(slug) {
  return String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function readDeviceSavedDesigns() {
  if (typeof window === 'undefined') return []
  try {
    const slugs = JSON.parse(window.localStorage.getItem(SAVED_DESIGNS_KEY) || '[]')
    return Array.isArray(slugs)
      ? slugs.filter((slug) => typeof slug === 'string').map((slug) => ({ slug, name: titleFromSlug(slug) }))
      : []
  } catch {
    return []
  }
}

function normaliseSavedDesigns(savedDesigns) {
  const values = savedDesigns === undefined ? readDeviceSavedDesigns() : savedDesigns
  if (!Array.isArray(values)) return []
  return values.map((item, index) => {
    if (typeof item === 'string') return { slug: item, name: titleFromSlug(item) }
    return {
      slug: item?.slug || String(item?.id || index),
      name: item?.name || item?.title || 'Saved design',
      category: item?.category || item?.format || '',
    }
  })
}

function displayCurrency(currencySummary) {
  if (!currencySummary) return { primary: 'Currency follows your location', secondary: 'You can change it from the currency menu.' }
  if (typeof currencySummary === 'string') return { primary: currencySummary, secondary: 'Current display currency' }
  return {
    primary: currencySummary.label || currencySummary.currency || currencySummary.code || 'Location-based currency',
    secondary: currencySummary.country ? `Set for ${currencySummary.country}` : 'Current display currency',
  }
}

function formatShortDate(value) {
  if (!value) return 'Not set'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.valueOf())) return 'Not set'
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

function initials(user) {
  const name = user?.profile?.displayName || user?.email || ''
  return name.split(/[\s@]+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'TW'
}

function EmptyActivity({ icon: Icon, title, copy, action, onAction }) {
  return (
    <div className="tw-account-empty">
      <span><Icon size={20} aria-hidden="true" /></span>
      <div><h4>{title}</h4><p>{copy}</p></div>
      {action && <button type="button" onClick={onAction}>{action}<ArrowRight size={14} aria-hidden="true" /></button>}
    </div>
  )
}

function AccountOverview({ user, saved, currency, onNavigate, onReport, setSection }) {
  const profile = user.profile || {}
  const completed = [profile.displayName, user.email, profile.partnerName, profile.eventDate].filter(Boolean).length
  const progress = Math.round((completed / 4) * 100)

  return (
    <div className="tw-account-overview">
      <section className="tw-account-welcome">
        <div>
          <span className="tw-kicker">Your planning space</span>
          <h1>Welcome, {profile.displayName?.split(' ')[0] || 'there'}.</h1>
          <p>Your favourites saved on this device and planning details are all in one quiet place.</p>
        </div>
        <span className="tw-account-welcome__flourish" aria-hidden="true"><Sparkles size={28} /></span>
      </section>

      <div className="tw-account-metrics" aria-label="Account summary">
        <button type="button" onClick={() => onNavigate?.('saved')}>
          <span><Heart size={17} aria-hidden="true" /></span>
          <strong>{saved.length}</strong>
          <small>Saved {saved.length === 1 ? 'design' : 'designs'}</small>
          <ChevronRight size={16} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => setSection('profile')}>
          <span><CircleUserRound size={17} aria-hidden="true" /></span>
          <strong>{progress}%</strong>
          <small>Profile complete</small>
          <ChevronRight size={16} aria-hidden="true" />
        </button>
        <div>
          <span><WalletCards size={17} aria-hidden="true" /></span>
          <strong>{currency.primary}</strong>
          <small>{currency.secondary}</small>
        </div>
      </div>

      <section className="tw-account-card tw-account-card--saved">
        <div className="tw-account-card__heading">
          <div><span className="tw-kicker">Saved on this device</span><h2>Saved designs</h2></div>
          <button type="button" onClick={() => onNavigate?.(saved.length ? 'saved' : 'collection')}>
            {saved.length ? 'View all' : 'Browse designs'}<ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
        {saved.length ? (
          <div className="tw-saved-summary">
            {saved.slice(0, 3).map((design, index) => (
              <button type="button" key={`${design.slug}-${index}`} onClick={() => onNavigate?.('saved')}>
                <span className="tw-saved-summary__number">{String(index + 1).padStart(2, '0')}</span>
                <span><strong>{design.name}</strong>{design.category && <small>{design.category}</small>}</span>
                <Heart size={16} fill="currentColor" aria-hidden="true" />
              </button>
            ))}
            {saved.length > 3 && <p>+{saved.length - 3} more in your shortlist</p>}
          </div>
        ) : (
          <EmptyActivity icon={Palette} title="Start a shortlist" copy="Save designs as you browse and compare them here." action="Explore the collection" onAction={() => onNavigate?.('collection')} />
        )}
      </section>

      <div className="tw-account-overview__split">
        <section className="tw-account-card">
          <div className="tw-account-card__heading"><div><span className="tw-kicker">Next step</span><h2>Your celebration</h2></div><CalendarDays size={19} aria-hidden="true" /></div>
          <dl className="tw-account-details-list">
            <div><dt>Couple</dt><dd>{[profile.displayName, profile.partnerName].filter(Boolean).join(' & ') || 'Add your names'}</dd></div>
            <div><dt>Event date</dt><dd>{formatShortDate(profile.eventDate)}</dd></div>
            <div><dt>Contact</dt><dd>{user.email}</dd></div>
          </dl>
          <button className="tw-inline-action" type="button" onClick={() => setSection('profile')}>Complete your details <ArrowRight size={14} aria-hidden="true" /></button>
        </section>
        <section className="tw-account-card tw-account-card--help">
          <span><Flag size={18} aria-hidden="true" /></span>
          <h2>Something not quite right?</h2>
          <p>Report a website, account or order issue and keep a reference for follow-up.</p>
          <button className="tw-inline-action" type="button" onClick={onReport}>Report an issue <ArrowRight size={14} aria-hidden="true" /></button>
        </section>
      </div>
    </div>
  )
}

function ProfileSection({ user, onSaved }) {
  const [values, setValues] = useState(() => ({
    displayName: user.profile?.displayName || '',
    partnerName: user.profile?.partnerName || '',
    email: user.email || '',
    phone: user.profile?.phone || '',
    eventDate: user.profile?.eventDate || '',
  }))
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')

  const update = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setMessage('')
  }

  const submit = (event) => {
    event.preventDefault()
    try {
      const result = onSaved(values)
      setValues({
        displayName: result.user.profile.displayName,
        partnerName: result.user.profile.partnerName,
        email: result.user.email,
        phone: result.user.profile.phone,
        eventDate: result.user.profile.eventDate,
      })
      setMessage('Your details were saved on this device.')
    } catch (error) {
      if (error instanceof AuthError) {
        setErrors(error.fields || {})
        setMessage(error.message)
      } else {
        setMessage('We could not save your details. Please try again.')
      }
    }
  }

  return (
    <section className="tw-account-panel" aria-labelledby="tw-profile-heading">
      <div className="tw-account-panel__heading"><span className="tw-kicker">Profile</span><h1 id="tw-profile-heading">Your details</h1><p>These details help prefill future enquiries. You can change them whenever you like.</p></div>
      <form className="tw-profile-form" onSubmit={submit} noValidate>
        <div className="tw-profile-form__pair">
          <label className="tw-form-field"><span>Your name</span><input value={values.displayName} onChange={(event) => update('displayName', event.target.value)} autoComplete="name" maxLength={80} aria-invalid={Boolean(errors.displayName)} />{errors.displayName && <span className="tw-field-error" role="alert">{errors.displayName}</span>}</label>
          <label className="tw-form-field"><span>Partner’s name <small>Optional</small></span><input value={values.partnerName} onChange={(event) => update('partnerName', event.target.value)} autoComplete="off" maxLength={80} /></label>
        </div>
        <div className="tw-profile-form__pair">
          <label className="tw-form-field"><span>Email address</span><input type="email" inputMode="email" value={values.email} onChange={(event) => update('email', event.target.value)} autoComplete="email" maxLength={254} aria-invalid={Boolean(errors.email)} />{errors.email && <span className="tw-field-error" role="alert">{errors.email}</span>}</label>
          <label className="tw-form-field"><span>Phone number <small>Optional</small></span><input type="tel" inputMode="tel" value={values.phone} onChange={(event) => update('phone', event.target.value)} autoComplete="tel" maxLength={40} placeholder="+254 700 000 000" /></label>
        </div>
        <label className="tw-form-field tw-form-field--date"><span>Celebration date <small>Optional</small></span><input type="date" value={values.eventDate} onChange={(event) => update('eventDate', event.target.value)} aria-invalid={Boolean(errors.eventDate)} />{errors.eventDate && <span className="tw-field-error" role="alert">{errors.eventDate}</span>}</label>
        <div className="tw-form-actions"><p role="status">{message}</p><button className="tw-primary-action" type="submit"><Save size={16} aria-hidden="true" />Save details</button></div>
      </form>
    </section>
  )
}

function PreferencesSection({ user, onSaved, currency }) {
  const [values, setValues] = useState(() => ({
    inspirationEmails: Boolean(user.preferences?.inspirationEmails),
    planningReminders: Boolean(user.preferences?.planningReminders),
  }))
  const [message, setMessage] = useState('')

  const toggle = (name) => {
    setValues((current) => ({ ...current, [name]: !current[name] }))
    setMessage('')
  }

  const save = () => {
    try {
      onSaved(values)
      setMessage('Your preferences were saved on this device.')
    } catch {
      setMessage('We could not save your preferences. Please try again.')
    }
  }

  return (
    <section className="tw-account-panel" aria-labelledby="tw-preferences-heading">
      <div className="tw-account-panel__heading"><span className="tw-kicker">Make it yours</span><h1 id="tw-preferences-heading">Preferences</h1><p>Choose how Tell & Wed should support your planning.</p></div>
      <div className="tw-preference-list">
        <label>
          <span className="tw-preference-list__icon"><Sparkles size={18} aria-hidden="true" /></span>
          <span><strong>Design inspiration</strong><small>Occasional new-design and styling notes. Delivery starts only after an email service is connected.</small></span>
          <input className="tw-switch" type="checkbox" checked={values.inspirationEmails} onChange={() => toggle('inspirationEmails')} />
        </label>
        <label>
          <span className="tw-preference-list__icon"><Bell size={18} aria-hidden="true" /></span>
          <span><strong>Planning reminders</strong><small>Remember key invitation milestones in your account. Notifications require the production service.</small></span>
          <input className="tw-switch" type="checkbox" checked={values.planningReminders} onChange={() => toggle('planningReminders')} />
        </label>
        <div>
          <span className="tw-preference-list__icon"><MapPin size={18} aria-hidden="true" /></span>
          <span><strong>Price display</strong><small>{currency.secondary}</small></span>
          <b>{currency.primary}</b>
        </div>
      </div>
      <div className="tw-form-actions"><p role="status">{message}</p><button className="tw-primary-action" type="button" onClick={save}><Check size={16} aria-hidden="true" />Save preferences</button></div>
    </section>
  )
}

function ActivitySection({ orders, enquiries, onNavigate }) {
  return (
    <section className="tw-account-panel" aria-labelledby="tw-activity-heading">
      <div className="tw-account-panel__heading"><span className="tw-kicker">Activity</span><h1 id="tw-activity-heading">Orders & enquiries</h1><p>Once secure checkout and enquiry delivery are connected, their status will appear here.</p></div>
      <div className="tw-activity-grid">
        <article className="tw-account-card">
          <div className="tw-account-card__heading"><div><span className="tw-kicker">Purchases</span><h2>Orders</h2></div><ShoppingBag size={19} aria-hidden="true" /></div>
          {orders.length ? orders.map((order, index) => (
            <div className="tw-activity-row" key={order.id || index}><span><strong>{order.title || `Order ${index + 1}`}</strong><small>{order.date || 'Date unavailable'}</small></span><b>{order.status || 'Received'}</b></div>
          )) : <EmptyActivity icon={ShoppingBag} title="No orders yet" copy="Your purchased invitations will be listed here." action="Browse designs" onAction={() => onNavigate?.('collection')} />}
        </article>
        <article className="tw-account-card">
          <div className="tw-account-card__heading"><div><span className="tw-kicker">Messages</span><h2>Enquiries</h2></div><Mail size={19} aria-hidden="true" /></div>
          {enquiries.length ? enquiries.map((enquiry, index) => (
            <div className="tw-activity-row" key={enquiry.id || index}><span><strong>{enquiry.subject || enquiry.design || `Enquiry ${index + 1}`}</strong><small>{enquiry.date || 'Date unavailable'}</small></span><b>{enquiry.status || 'Sent'}</b></div>
          )) : <EmptyActivity icon={FileText} title="No tracked enquiries" copy="Connected form submissions will show up here." />}
        </article>
      </div>
      <p className="tw-account-clarifier"><ShieldCheck size={15} aria-hidden="true" /> This preview does not invent order or enquiry history. Data appears only when supplied by the production service.</p>
    </section>
  )
}

function SecuritySection({ user, onSignOut, onDelete }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')

  const deleteAccount = () => {
    if (confirmation !== 'DELETE') {
      setMessage('Type DELETE exactly to confirm.')
      return
    }
    try {
      onDelete()
    } catch {
      setMessage('We could not delete this local account. Please try again.')
    }
  }

  return (
    <section className="tw-account-panel" aria-labelledby="tw-security-heading">
      <div className="tw-account-panel__heading"><span className="tw-kicker">Account access</span><h1 id="tw-security-heading">Security</h1><p>Manage the local preview session for {user.email}.</p></div>
      <div className="tw-security-list">
        <div>
          <span><ShieldCheck size={20} aria-hidden="true" /></span>
          <div><h2>Password protection</h2><p>The preview stores a salted password verifier—not your readable password. Because it runs in the browser, it is not a substitute for production server authentication.</p></div>
          <b>Demo</b>
        </div>
        <div>
          <span><LogOut size={20} aria-hidden="true" /></span>
          <div><h2>Sign out on this device</h2><p>Ends this browser session. Your local profile remains so you can sign in again.</p></div>
          <button type="button" onClick={onSignOut}>Sign out</button>
        </div>
        <div className="tw-security-list__danger">
          <span><Trash2 size={20} aria-hidden="true" /></span>
          <div><h2>Delete local account</h2><p>Removes your profile, preferences and password verifier from this browser. Device-saved designs remain available.</p></div>
          {!confirmingDelete && <button type="button" onClick={() => setConfirmingDelete(true)}>Delete account</button>}
        </div>
      </div>
      {confirmingDelete && (
        <div className="tw-delete-confirmation">
          <div><strong>This cannot be undone on this device.</strong><p>Type <b>DELETE</b> to confirm.</p></div>
          <label><span className="tw-sr-only">Type DELETE to confirm</span><input value={confirmation} onChange={(event) => { setConfirmation(event.target.value); setMessage('') }} autoComplete="off" /></label>
          <div><button type="button" onClick={() => { setConfirmingDelete(false); setConfirmation(''); setMessage('') }}>Cancel</button><button type="button" onClick={deleteAccount} disabled={confirmation !== 'DELETE'}>Delete permanently</button></div>
          {message && <p role="alert">{message}</p>}
        </div>
      )}
    </section>
  )
}

export default function AccountPage({
  user,
  savedDesigns,
  onNavigate,
  onSignOut,
  onOpenAuth,
  onReport,
  currencySummary,
  orders = [],
  enquiries = [],
  onUserChange,
}) {
  const auth = useAuthSession()
  const activeUser = user === undefined ? auth.user : user
  const [section, setSection] = useState('overview')
  const saved = useMemo(() => normaliseSavedDesigns(savedDesigns), [savedDesigns])
  const currency = useMemo(() => displayCurrency(currencySummary), [currencySummary])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [section])

  if (!activeUser) {
    return (
      <main className="tw-account-page tw-account-page--signed-out">
        <section className="tw-account-gate">
          <BrandLogo />
          <span className="tw-account-gate__icon"><LockKeyhole size={24} aria-hidden="true" /></span>
          <span className="tw-kicker">Your account</span>
          <h1>A calm place for<br /><em>all the details.</em></h1>
          <p>Sign in to view your profile, saved-design summary and planning preferences.</p>
          <button className="tw-primary-action" type="button" onClick={() => onOpenAuth?.('sign-in')}>Sign in <ArrowRight size={16} aria-hidden="true" /></button>
          <button className="tw-inline-action" type="button" onClick={() => onOpenAuth?.('sign-up')}>Create an account</button>
        </section>
      </main>
    )
  }

  const saveProfile = (values) => {
    const result = auth.updateProfile(values)
    onUserChange?.(result.user)
    return result
  }
  const savePreferences = (values) => {
    const result = auth.updatePreferences(values)
    onUserChange?.(result.user)
    return result
  }
  const handleSignOut = () => {
    auth.signOut()
    onSignOut?.({ deleted: false })
  }
  const handleDelete = () => {
    const result = auth.deleteAccount()
    onSignOut?.({ deleted: true, ...result })
  }

  return (
    <main className="tw-account-page">
      <aside className="tw-account-sidebar" aria-label="Account navigation">
        <button className="tw-account-sidebar__brand" type="button" onClick={() => onNavigate?.('home')} aria-label="Tell & Wed home"><BrandLogo /></button>
        <div className="tw-account-identity">
          <span>{initials(activeUser)}</span>
          <div><strong>{activeUser.profile?.displayName || 'Your account'}</strong><small>{activeUser.email}</small></div>
        </div>
        <nav>
          {ACCOUNT_SECTIONS.map(([value, label, Icon]) => (
            <button key={value} type="button" className={section === value ? 'is-active' : ''} onClick={() => setSection(value)} aria-current={section === value ? 'page' : undefined}>
              <Icon size={17} aria-hidden="true" /><span>{label}</span><ChevronRight size={14} aria-hidden="true" />
            </button>
          ))}
        </nav>
        <div className="tw-account-sidebar__footer">
          <button type="button" onClick={onReport}><Flag size={16} aria-hidden="true" />Report an issue</button>
          <button type="button" onClick={handleSignOut}><LogOut size={16} aria-hidden="true" />Sign out</button>
        </div>
      </aside>

      <div className="tw-account-content">
        {section === 'overview' && <AccountOverview user={activeUser} saved={saved} currency={currency} onNavigate={onNavigate} onReport={onReport} setSection={setSection} />}
        {section === 'profile' && <ProfileSection key={activeUser.id} user={activeUser} onSaved={saveProfile} />}
        {section === 'preferences' && <PreferencesSection key={activeUser.id} user={activeUser} onSaved={savePreferences} currency={currency} />}
        {section === 'activity' && <ActivitySection orders={orders} enquiries={enquiries} onNavigate={onNavigate} />}
        {section === 'security' && <SecuritySection user={activeUser} onSignOut={handleSignOut} onDelete={handleDelete} />}
      </div>
    </main>
  )
}
