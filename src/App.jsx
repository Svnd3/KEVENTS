import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CirclePlay,
  CircleUserRound,
  ExternalLink,
  Instagram,
  LifeBuoy,
  LogIn,
  LogOut,
  Menu,
  Music2,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import InvitationArtwork from './components/InvitationArtwork.jsx'
import BrandLogo from './components/BrandLogo.jsx'
import CookieBanner from './components/CookieConsent.jsx'
import LegalPage from './components/LegalPage.jsx'
import SaveDesignButton from './components/SaveDesignButton.jsx'
import { CurrencyControl, PriceDisplay, useCurrency } from './components/CurrencyControl.jsx'
import { AccountPage, AuthDialog, ReportDialog, useAuthSession } from './account/index.js'
import { categories, designs } from './data/designs.js'
import { openCookiePreferences } from './utils/cookieConsent.js'

const featuredNames = [
  'A Letter from the Tide',
  'Crimson Orbit',
  'Heartburst: After Dark',
  'Electric Vow',
  'Blush Forecast',
  'Velvet Signal',
  'Heart Parade',
  'Up, Up & Always',
  'Love, in Transit',
  'Scarlet Hour',
  'Soft Launch: Forever',
  'Love Bomb',
]
const heroFeaturedNames = featuredNames.slice(0, 4)
const loadTemplatePreview = () => import('./components/TemplatePreview.jsx')
const TemplatePreview = lazy(loadTemplatePreview)
const COLLECTION_PREFERENCES_KEY = 'kevents-collection-preferences'
const SAVED_DESIGNS_KEY = 'tell-and-wed:saved-designs:v1'
const validDesignSlugs = new Set(designs.map((design) => design.slug))

function cleanSavedDesigns(value) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((slug) => typeof slug === 'string' && validDesignSlugs.has(slug)))]
}

function readSavedDesigns() {
  try {
    return cleanSavedDesigns(JSON.parse(window.localStorage.getItem(SAVED_DESIGNS_KEY) || '[]'))
  } catch {
    return []
  }
}

function readCollectionPreferences() {
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(COLLECTION_PREFERENCES_KEY) || '{}')
    return {
      category: categories.includes(saved.category) ? saved.category : 'All',
      search: typeof saved.search === 'string' ? saved.search : '',
      sort: ['featured', 'low', 'high', 'name'].includes(saved.sort) ? saved.sort : 'featured',
      showFilters: typeof saved.showFilters === 'boolean' ? saved.showFilters : true,
    }
  } catch {
    return { category: 'All', search: '', sort: 'featured', showFilters: true }
  }
}

function getView() {
  const hash = window.location.hash
  if (hash === '#collection') return 'collection'
  if (hash === '#saved') return 'saved'
  if (hash === '#account') return 'account'
  if (hash === '#terms' || hash.startsWith('#legal/terms') || hash.startsWith('#legal-terms-')) return 'terms'
  if (hash === '#privacy' || hash.startsWith('#legal/privacy') || hash.startsWith('#legal-privacy-')) return 'privacy'
  if (hash === '#cookies' || hash.startsWith('#legal/cookies') || hash.startsWith('#legal-cookies-')) return 'cookies'
  if (hash.startsWith('#preview/')) {
    try {
      const slug = decodeURIComponent(hash.slice('#preview/'.length))
      if (designs.some((design) => design.slug === slug)) return 'preview'
    } catch {
      return 'home'
    }
  }
  return 'home'
}

function getPreviewDesign() {
  if (!window.location.hash.startsWith('#preview/')) return null
  try {
    const slug = decodeURIComponent(window.location.hash.slice('#preview/'.length))
    return designs.find((design) => design.slug === slug) || null
  } catch {
    return null
  }
}

function useScrollReveal(dependency) {
  useEffect(() => {
    const targets = [...document.querySelectorAll('[data-reveal]')]
    if (!('IntersectionObserver' in window)) {
      targets.forEach((target) => target.classList.add('is-visible'))
      return undefined
    }
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      }),
      { threshold: 0.12, rootMargin: '0px 0px -40px' },
    )
    targets.forEach((target) => observer.observe(target))
    return () => observer.disconnect()
  }, [dependency])
}

function useDialogBehavior(open, dialogRef, onClose) {
  useEffect(() => {
    if (!open) return undefined

    const previous = document.activeElement
    const dialog = dialogRef.current
    const focusableSelector = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    document.body.classList.add('modal-open')
    const timer = window.setTimeout(() => {
      dialog?.querySelector('[data-autofocus]')?.focus()
      if (!dialog?.contains(document.activeElement)) dialog?.focus()
    }, 20)

    const keydown = (event) => {
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
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', keydown)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', keydown)
      document.body.classList.remove('modal-open')
      previous?.focus?.()
    }
  }, [dialogRef, onClose, open])
}

function SkipLink() {
  const focusMain = (event) => {
    event.preventDefault()
    const main = document.getElementById('main-content')
    if (!main) return
    main.focus({ preventScroll: true })
    main.scrollIntoView({ block: 'start' })
  }

  return <a className="skip-link" href="#main-content" onClick={focusMain}>Skip to content</a>
}

function Header({ view, navigate, onEnquire, onOpenAuth, savedCount, user }) {
  const [open, setOpen] = useState(false)
  const navigationRef = useRef(null)
  const menuToggleRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const focusFrame = window.requestAnimationFrame(() => {
      navigationRef.current?.querySelector('button')?.focus({ preventScroll: true })
    })
    const closeOnEscape = (event) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      menuToggleRef.current?.focus({ preventScroll: true })
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      window.cancelAnimationFrame(focusFrame)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const move = (destination) => {
    setOpen(false)
    navigate(destination)
  }

  const openAccount = () => {
    setOpen(false)
    if (user) move('account')
    else onOpenAuth('sign-in')
  }

  const accountName = user?.profile?.displayName?.split(/\s+/)[0] || 'Account'

  return (
    <header className="site-header">
      <button className="brand" type="button" onClick={() => move('home')} aria-label="Tell & Wed home">
        <BrandLogo />
      </button>
      <nav ref={navigationRef} id="main-navigation" className={`main-nav ${open ? 'is-open' : ''}`} aria-label="Main navigation">
        <button className={view === 'home' ? 'is-active' : ''} type="button" onClick={() => move('home')} aria-current={view === 'home' ? 'page' : undefined}>Home</button>
        <button className={view === 'collection' ? 'is-active' : ''} type="button" onClick={() => move('collection')} aria-current={view === 'collection' ? 'page' : undefined}>Designs</button>
        <button className={view === 'saved' ? 'is-active' : ''} type="button" onClick={() => move('saved')} aria-current={view === 'saved' ? 'page' : undefined}>
          Saved{savedCount ? ` (${savedCount})` : ''}
        </button>
        <button type="button" onClick={() => { setOpen(false); onEnquire(null) }}>Custom design</button>
        <div className="main-nav__mobile-actions">
          <button className={view === 'account' ? 'is-active' : ''} type="button" onClick={openAccount}>
            {user ? `Account · ${accountName}` : 'Sign in or create account'}
          </button>
        </div>
      </nav>
      <div className="header-tools">
        <button className={`header-account ${view === 'account' ? 'is-active' : ''}`} type="button" onClick={openAccount} aria-label={user ? `Open ${accountName}'s account` : 'Sign in or create an account'}>
          {user ? <CircleUserRound size={17} /> : <LogIn size={16} />}
          <span>{user ? accountName : 'Sign in'}</span>
        </button>
        <button className="header-cta" type="button" onClick={() => onEnquire(null)}>
          <span>Get started</span><ArrowRight size={15} strokeWidth={1.8} />
        </button>
      </div>
      <button ref={menuToggleRef} className="menu-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-label="Toggle menu" aria-controls="main-navigation" aria-expanded={open}>
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
    </header>
  )
}

function Hero({ navigate, onEnquire }) {
  const stageRef = useRef(null)
  const featured = heroFeaturedNames.map((name) => designs.find((design) => design.name === name))

  const handlePointer = (event) => {
    if (!stageRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const rect = stageRef.current.getBoundingClientRect()
    stageRef.current.style.setProperty('--pointer-x', `${((event.clientX - rect.left) / rect.width - 0.5) * 16}px`)
    stageRef.current.style.setProperty('--pointer-y', `${((event.clientY - rect.top) / rect.height - 0.5) * 12}px`)
  }

  return (
    <section className="hero" onPointerMove={handlePointer}>
      <div className="hero__copy">
        <span className="eyebrow">Digital invitations</span>
        <h1>Make it<br /><span>an event.</span></h1>
        <p>Choose a design for the celebration, then make the words, colours and details yours.</p>
        <div className="hero__actions">
          <button className="button button--dark" type="button" onClick={() => navigate('collection')}>
            Browse designs <ArrowRight size={17} />
          </button>
          <button className="text-link" type="button" onClick={() => onEnquire(null)}>Request a custom design <ArrowRight size={15} /></button>
        </div>
      </div>

      <div className="hero-stage" ref={stageRef}>
        <div className="hero-halo" />
        {featured.map((design, index) => (
          <a
            className={`hero-card hero-card--${index + 1}`}
            key={design.id}
            href={`#preview/${encodeURIComponent(design.slug)}`}
            aria-label={`View ${design.name}`}
            onPointerEnter={loadTemplatePreview}
            onFocus={loadTemplatePreview}
          >
            <InvitationArtwork design={design} priority />
          </a>
        ))}
      </div>

      <button className="hero-scroll" type="button" onClick={() => document.querySelector('.featured')?.scrollIntoView({ behavior: 'smooth' })}>
        <span>Featured designs</span><ArrowDown size={16} />
      </button>
    </section>
  )
}

function DesignCard({ design, large = false, saved = false, onToggleSaved, showOffer = false }) {
  const { formatPrice } = useCurrency()

  return (
    <article className={`design-card ${large ? 'design-card--large' : ''}`}>
      <a
        className="design-card__visual"
        href={`#preview/${encodeURIComponent(design.slug)}`}
        aria-label={`Preview ${design.name}`}
        onPointerEnter={loadTemplatePreview}
        onFocus={loadTemplatePreview}
      >
        <InvitationArtwork design={design} />
        <span className="design-card__view"><span>Preview</span><ArrowRight size={15} /></span>
        {design.category === 'Cinematic' && <span className="design-card__motion"><CirclePlay size={13} /> Animated</span>}
      </a>
      <SaveDesignButton
        design={design}
        saved={saved}
        onToggle={onToggleSaved}
        className="design-card__save"
      />
      <div className="design-card__meta">
        <div>
          <span>{design.category} · {design.tier.name}</span>
          <h3>{design.name}</h3>
        </div>
        <div className="design-card__price">
          {showOffer && design.compareAtPrice ? (
            <PriceDisplay price={design.price} compareAt={design.compareAtPrice} compact />
          ) : (
            <><strong>{formatPrice(design.price)}</strong><small>One-time</small></>
          )}
        </div>
      </div>
    </article>
  )
}

function Featured({ navigate, savedSet, onToggleSaved }) {
  const scroller = useRef(null)
  const featured = featuredNames.map((name) => designs.find((design) => design.name === name))
  const scroll = (direction) => scroller.current?.scrollBy({ left: direction * scroller.current.clientWidth * 0.78, behavior: 'smooth' })

  return (
    <section className="featured section-pad">
      <div className="section-heading" data-reveal>
        <div>
          <span className="eyebrow">Featured designs</span>
          <h2>A few favourites</h2>
        </div>
        <div className="carousel-controls">
          <button type="button" onClick={() => scroll(-1)} aria-label="Previous design"><ChevronLeft size={19} /></button>
          <button type="button" onClick={() => scroll(1)} aria-label="Next design"><ChevronRight size={19} /></button>
        </div>
      </div>
      <div className="featured__track" ref={scroller}>
        {featured.map((design) => (
          <DesignCard
            key={design.id}
            design={design}
            large
            saved={savedSet.has(design.slug)}
            onToggleSaved={onToggleSaved}
          />
        ))}
        <button className="collection-teaser" type="button" onClick={() => navigate('collection')} data-reveal>
          <span>All<br />designs</span>
          <p>Browse the full collection</p>
          <i><ArrowRight size={21} /></i>
        </button>
      </div>
    </section>
  )
}

function HomePage({ navigate, onEnquire, savedSet, onToggleSaved }) {
  useScrollReveal('home')
  return (
    <main>
      <Hero navigate={navigate} onEnquire={onEnquire} />
      <Featured navigate={navigate} savedSet={savedSet} onToggleSaved={onToggleSaved} />
      <section className="process section-pad" data-reveal aria-labelledby="process-title">
        <div className="process__heading">
          <div>
            <span className="eyebrow">Ordering an invitation</span>
            <h2 id="process-title">What happens after you choose a design</h2>
          </div>
          <div className="process__intro">
            <p>We personalise the design with your event details and send you a proof before the final invitation is ready to share.</p>
            <button className="text-link" type="button" onClick={() => navigate('collection')}>Browse designs <ArrowRight size={15} /></button>
          </div>
        </div>
        <ol className="process__steps">
          <li>
            <span>01</span>
            <h3>Choose a starting point</h3>
            <p>Pick a design from the collection, or ask for something custom.</p>
          </li>
          <li>
            <span>02</span>
            <h3>Send your content</h3>
            <p>Share the names, date, venue, wording, colours and any photographs.</p>
          </li>
          <li>
            <span>03</span>
            <h3>Approve the proof</h3>
            <p>Review the invitation and request changes before it is ready to share.</p>
          </li>
        </ol>
      </section>
      <section className="home-cta section-pad" data-reveal>
        <p>Custom design</p>
        <h2>Want something made<br /><span>from scratch?</span></h2>
        <button className="button button--light" type="button" onClick={() => onEnquire(null)}>Request a custom design <ArrowRight size={17} /></button>
      </section>
    </main>
  )
}

function CollectionPage({ savedSet, onToggleSaved }) {
  const initialPreferences = useRef(null)
  if (!initialPreferences.current) initialPreferences.current = readCollectionPreferences()
  const [category, setCategory] = useState(initialPreferences.current.category)
  const [search, setSearch] = useState(initialPreferences.current.search)
  const [sort, setSort] = useState(initialPreferences.current.sort)
  const [showFilters, setShowFilters] = useState(initialPreferences.current.showFilters)

  useEffect(() => {
    try {
      window.sessionStorage.setItem(COLLECTION_PREFERENCES_KEY, JSON.stringify({
        category,
        search,
        sort,
        showFilters,
      }))
    } catch {
      // Browsing still works when storage is unavailable.
    }
  }, [category, search, showFilters, sort])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    const matches = designs.filter((design) => (
      (category === 'All' || design.category === category)
      && (!query || `${design.name} ${design.category} ${design.tagline} ${design.tags.join(' ')}`.toLowerCase().includes(query))
    ))
    return [...matches].sort((a, b) => {
      if (sort === 'low') return a.price - b.price
      if (sort === 'high') return b.price - a.price
      if (sort === 'name') return a.name.localeCompare(b.name)
      return Number(Boolean(b.templatePath)) - Number(Boolean(a.templatePath))
        || Number(b.featured) - Number(a.featured)
        || a.id - b.id
    })
  }, [category, search, sort])

  const clearFilters = () => {
    setSearch('')
    setCategory('All')
    setSort('featured')
  }

  const hasActiveFilters = category !== 'All' || Boolean(search.trim()) || sort !== 'featured'

  return (
    <main className="collection-page">
      <section className="collection-hero section-pad">
        <span className="eyebrow">Invitations for every event</span>
        <h1>Invitation designs</h1>
        <p>Filter by style, preview each design and choose one to customise. Each price is one-time, with no per-guest charge.</p>
      </section>

      <section className="catalog section-pad">
        <div className="catalog-toolbar">
          <div className="category-list" role="group" aria-label="Filter by invitation category">
            {categories.map((item) => (
              <button key={item} type="button" className={category === item ? 'is-active' : ''} onClick={() => setCategory(item)} aria-pressed={category === item}>
                {item}
              </button>
            ))}
          </div>
          <button className="filter-toggle" type="button" onClick={() => setShowFilters((value) => !value)} aria-expanded={showFilters} aria-controls="catalog-filter-panel">
            <SlidersHorizontal size={16} /> <span>Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="catalog-filters" id="catalog-filter-panel">
            <div className="search-field">
              <Search size={17} />
              <label className="sr-only" htmlFor="design-search">Search designs</label>
              <input id="design-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search designs" />
              {search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search"><X size={15} /></button>}
            </div>
            <label className="sort-field">
              <span>Sort by</span>
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="featured">Featured &amp; new</option>
                <option value="low">Price: low to high</option>
                <option value="high">Price: high to low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </label>
          </div>
        )}

        <div className="catalog-results" role="status" aria-live="polite" aria-atomic="true">
          <span>{filtered.length} {filtered.length === 1 ? 'design' : 'designs'}</span>
          {hasActiveFilters && <button type="button" onClick={clearFilters}>Clear filters</button>}
        </div>

        {filtered.length ? (
          <div className="catalog-grid">
            {filtered.map((design) => (
              <DesignCard
                key={design.id}
                design={design}
                showOffer
                saved={savedSet.has(design.slug)}
                onToggleSaved={onToggleSaved}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span>No results</span>
            <h2>No designs match your search.</h2>
            <p>Try another search or clear the filters.</p>
            <button type="button" className="button button--dark" onClick={clearFilters}>Clear filters</button>
          </div>
        )}
      </section>
    </main>
  )
}

function SavedPage({ navigate, savedDesigns, savedSet, onToggleSaved }) {
  useScrollReveal(`saved-${savedDesigns.length}`)

  return (
    <main className="collection-page saved-page">
      <section className="collection-hero section-pad">
        <span className="eyebrow">Saved on this device</span>
        <h1>Your shortlist</h1>
        <p>Compare the designs you love, then preview one when you are ready.</p>
      </section>
      <section className="catalog section-pad">
        {savedDesigns.length ? (
          <>
            <div className="catalog-results"><span>{savedDesigns.length} saved {savedDesigns.length === 1 ? 'design' : 'designs'}</span></div>
            <div className="catalog-grid">
              {savedDesigns.map((design) => (
                <DesignCard
                  key={design.id}
                  design={design}
                  showOffer
                  saved={savedSet.has(design.slug)}
                  onToggleSaved={onToggleSaved}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <span>Your shortlist is empty</span>
            <h2>Save a few favourites.</h2>
            <p>Tap the heart on any design and it will stay here on this device.</p>
            <button type="button" className="button button--dark" onClick={() => navigate('collection')}>Browse designs</button>
          </div>
        )}
      </section>
    </main>
  )
}

function EnquiryPanel({ design, onClose }) {
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const dialogRef = useRef(null)
  const endpoint = import.meta.env.VITE_ENQUIRY_ENDPOINT
  const { formatPrice } = useCurrency()
  useDialogBehavior(true, dialogRef, onClose)

  const submit = async (event) => {
    event.preventDefault()
    if (!endpoint) {
      setSent(true)
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: new FormData(event.currentTarget),
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) throw new Error('Request failed')
      setSent(true)
    } catch {
      setError('We could not send that. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="enquiry-shell" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <aside className="enquiry-panel" role="dialog" aria-modal="true" aria-labelledby="enquiry-title" tabIndex={-1} ref={dialogRef}>
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close enquiry"><X size={18} /></button>
        {!sent ? (
          <>
            <span className="eyebrow">Enquiry</span>
            <h2 id="enquiry-title">Tell us what<br /><span>you need.</span></h2>
            <p>Share your details and we will reply with availability and next steps.</p>
            {design && <div className="enquiry-selection"><span>Selected design</span><strong>{design.name}</strong><small>{formatPrice(design.price)}</small></div>}
            <form onSubmit={submit}>
              {design && <input type="hidden" name="design" value={design.name} />}
              {design && <input type="hidden" name="price" value={formatPrice(design.price)} />}
              {design && <input type="hidden" name="priceKes" value={design.price} />}
              <input type="hidden" name="termsVersion" value="2026-08-30" />
              <label><span>Names</span><input name="name" autoComplete="name" required placeholder="Njeri and Malik" data-autofocus /></label>
              <label><span>Email address</span><input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label>
              <label><span>Event date</span><input name="date" type="date" /></label>
              <label><span>Invitation details</span><textarea name="message" required rows="4" placeholder="Tell us about the events, wording and any ideas you already have." /></label>
              <label className="enquiry-consent">
                <input name="termsAccepted" type="checkbox" required />
                <span>I agree to the <a href="#terms">Terms</a> and acknowledge the <a href="#privacy">Privacy notice</a>.</span>
              </label>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="button button--dark button--full" type="submit" disabled={submitting}>{submitting ? 'Sending…' : 'Send enquiry'} <ArrowRight size={17} /></button>
            </form>
          </>
        ) : (
          <div className="enquiry-success">
            <span><Check size={28} /></span>
            <h2 id="enquiry-title">{endpoint ? 'Enquiry sent' : 'Demo submitted'}</h2>
            <p>{endpoint ? 'Thanks. We will reply by email with availability and next steps.' : 'This preview form is not connected yet.'}</p>
            <button className="button button--dark" type="button" onClick={onClose}>Close</button>
          </div>
        )}
      </aside>
    </div>
  )
}

function Footer({ navigate, onEnquire, onOpenAuth, onReport, onCookieSettings, onSignOut, savedCount, user }) {
  return (
    <footer className="site-footer section-pad">
      <div className="footer-brand"><BrandLogo /></div>

      <div className="footer-copy">
        <p>Digital invitations<br />designed in Nairobi.</p>
        <span>Available worldwide</span>
        <div className="footer-socials" aria-label="Tell & Wed on social media">
          <a href="https://www.instagram.com/tellandwed/" target="_blank" rel="noreferrer" aria-label="Instagram @tellandwed">
            <Instagram size={15} /><span>@tellandwed</span><ExternalLink size={11} />
          </a>
          <a href="https://www.tiktok.com/@tell.wed.invitations" target="_blank" rel="noreferrer" aria-label="TikTok @tell.wed.invitations">
            <Music2 size={15} /><span>@tell.wed.invitations</span><ExternalLink size={11} />
          </a>
        </div>
      </div>

      <nav className="footer-links" aria-label="Footer navigation">
        <div>
          <strong>Explore</strong>
          <button type="button" onClick={() => navigate('collection')}>Designs</button>
          <button type="button" onClick={() => navigate('saved')}>Saved{savedCount ? ` (${savedCount})` : ''}</button>
          <button type="button" onClick={() => onEnquire(null)}>Custom design</button>
        </div>
        <div>
          <strong>Account</strong>
          <button type="button" onClick={() => user ? navigate('account') : onOpenAuth('sign-in')}>{user ? 'My account' : 'Sign in'}</button>
          {!user && <button type="button" onClick={() => onOpenAuth('sign-up')}>Create account</button>}
          {user && <button type="button" onClick={onSignOut}><LogOut size={13} /> Sign out</button>}
          <button type="button" onClick={onReport}><LifeBuoy size={13} /> Report a problem</button>
        </div>
        <div>
          <strong>Information</strong>
          <button type="button" onClick={() => navigate('terms')}>Terms</button>
          <button type="button" onClick={() => navigate('privacy')}>Privacy</button>
          <button type="button" onClick={() => navigate('cookies')}>Cookies</button>
          <button type="button" onClick={onCookieSettings}>Cookie settings</button>
        </div>
      </nav>

      <div className="footer-utility">
        <div><span>Country</span><CurrencyControl /></div>
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Back to top <ArrowDown className="footer-back-arrow" size={14} /></button>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Tell &amp; Wed</span>
        <span>Nairobi, Kenya · Available worldwide</span>
      </div>
    </footer>
  )
}

export default function App() {
  const [view, setView] = useState(getView)
  const [enquiry, setEnquiry] = useState({ open: false, design: null })
  const [authDialog, setAuthDialog] = useState({ open: false, mode: 'sign-in' })
  const [reportOpen, setReportOpen] = useState(false)
  const [savedSlugs, setSavedSlugs] = useState(readSavedDesigns)
  const [saveAnnouncement, setSaveAnnouncement] = useState('')
  const auth = useAuthSession()
  const { country } = useCurrency()
  const progressRef = useRef(null)
  const viewRef = useRef(view)
  const collectionScrollRef = useRef(0)
  const closeEnquiry = useCallback(() => setEnquiry({ open: false, design: null }), [])
  const closeAuth = useCallback(() => setAuthDialog((current) => ({ ...current, open: false })), [])
  const previewDesign = view === 'preview' ? getPreviewDesign() : null
  const isLegalView = ['terms', 'privacy', 'cookies'].includes(view)
  const savedSet = useMemo(() => new Set(savedSlugs), [savedSlugs])
  const savedDesigns = useMemo(
    () => savedSlugs.map((slug) => designs.find((design) => design.slug === slug)).filter(Boolean),
    [savedSlugs],
  )

  useEffect(() => {
    try {
      window.localStorage.setItem(SAVED_DESIGNS_KEY, JSON.stringify(savedSlugs))
    } catch {
      // Saving still works for this visit when local storage is unavailable.
    }
  }, [savedSlugs])

  useEffect(() => {
    const syncSavedDesigns = (event) => {
      if (event.key !== SAVED_DESIGNS_KEY) return
      try {
        setSavedSlugs(cleanSavedDesigns(JSON.parse(event.newValue || '[]')))
      } catch {
        setSavedSlugs([])
      }
    }
    window.addEventListener('storage', syncSavedDesigns)
    return () => window.removeEventListener('storage', syncSavedDesigns)
  }, [])

  useEffect(() => {
    const changeView = () => {
      const nextView = getView()
      if (viewRef.current === 'collection') collectionScrollRef.current = window.scrollY
      viewRef.current = nextView
      setView(nextView)
      setEnquiry({ open: false, design: null })
      setAuthDialog((current) => ({ ...current, open: false }))
      setReportOpen(false)
      window.requestAnimationFrame(() => {
        window.scrollTo({
          top: nextView === 'collection' ? collectionScrollRef.current : 0,
          behavior: 'auto',
        })
        document.getElementById('main-content')?.focus({ preventScroll: true })
      })
    }
    let frame = 0
    const updateProgress = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight
        const progress = max > 0 ? window.scrollY / max : 0
        if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`
        if (viewRef.current === 'collection') collectionScrollRef.current = window.scrollY
        frame = 0
      })
    }
    window.addEventListener('hashchange', changeView)
    window.addEventListener('scroll', updateProgress, { passive: true })
    updateProgress()
    return () => {
      window.removeEventListener('hashchange', changeView)
      window.removeEventListener('scroll', updateProgress)
      window.cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    const titles = {
      account: 'Your account | Tell & Wed',
      collection: 'Invitation designs | Tell & Wed',
      cookies: 'Cookie policy | Tell & Wed',
      privacy: 'Privacy notice | Tell & Wed',
      saved: 'Saved designs | Tell & Wed',
      terms: 'Terms of service | Tell & Wed',
    }
    document.title = previewDesign
      ? `${previewDesign.name} | Tell & Wed`
      : titles[view] || 'Tell & Wed | Digital invitations'
  }, [previewDesign, view])

  const navigate = (destination) => {
    const routes = {
      account: '#account',
      collection: '#collection',
      cookies: '#cookies',
      home: '#home',
      privacy: '#privacy',
      saved: '#saved',
      terms: '#terms',
    }
    const nextView = routes[destination] ? destination : 'home'
    const nextHash = routes[nextView]
    if (window.location.hash === nextHash) {
      viewRef.current = nextView
      setView(nextView)
      window.scrollTo({ top: 0, behavior: 'auto' })
    } else {
      window.location.hash = nextHash
    }
  }

  const openEnquiry = useCallback((design) => {
    setEnquiry({ open: true, design })
  }, [])

  const openAuth = useCallback((mode = 'sign-in') => {
    setAuthDialog({ open: true, mode: mode === 'sign-up' ? 'sign-up' : 'sign-in' })
  }, [])

  const signOutFromSite = () => {
    auth.signOut()
    setSaveAnnouncement('You have signed out of this device.')
    navigate('home')
  }

  const toggleSaved = useCallback((design) => {
    const willSave = !savedSlugs.includes(design.slug)
    setSavedSlugs((current) => (
      current.includes(design.slug)
        ? current.filter((slug) => slug !== design.slug)
        : [...current, design.slug]
    ))
    setSaveAnnouncement(willSave
      ? `${design.name} saved on this device.`
      : `${design.name} removed from saved designs.`)
  }, [savedSlugs])

  if (view === 'preview' && previewDesign) {
    return (
      <>
        <SkipLink />
        <div className="scroll-progress" ref={progressRef} />
        <Suspense fallback={<div className="preview-loading" aria-label="Loading invitation preview" />}>
          <TemplatePreview
            key={previewDesign.slug}
            design={previewDesign}
            onBack={() => navigate('collection')}
            onEnquire={openEnquiry}
            saved={savedSet.has(previewDesign.slug)}
            onToggleSaved={toggleSaved}
          />
        </Suspense>
        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{saveAnnouncement}</p>
        {enquiry.open && <EnquiryPanel design={enquiry.design} onClose={closeEnquiry} />}
        <CookieBanner onNavigatePolicy={() => navigate('cookies')} policyHref="#cookies" />
      </>
    )
  }

  let page = <HomePage navigate={navigate} onEnquire={openEnquiry} savedSet={savedSet} onToggleSaved={toggleSaved} />
  if (view === 'collection') {
    page = <CollectionPage savedSet={savedSet} onToggleSaved={toggleSaved} />
  } else if (view === 'saved') {
    page = <SavedPage navigate={navigate} savedDesigns={savedDesigns} savedSet={savedSet} onToggleSaved={toggleSaved} />
  } else if (view === 'account') {
    page = (
      <AccountPage
        user={auth.user}
        savedDesigns={savedDesigns}
        onNavigate={navigate}
        onSignOut={() => navigate('home')}
        onOpenAuth={openAuth}
        onReport={() => setReportOpen(true)}
        currencySummary={{ label: country.name, country: country.name }}
        onUserChange={auth.refresh}
      />
    )
  } else if (isLegalView) {
    page = (
      <LegalPage
        document={view}
        navigate={navigate}
        contactEmail={import.meta.env.VITE_CONTACT_EMAIL || 'hello@tellandwed.com'}
        onOpenCookiePreferences={openCookiePreferences}
      />
    )
  }

  return (
    <>
      <SkipLink />
      <div className="scroll-progress" ref={progressRef} />
      {!isLegalView && (
        <Header
          view={view}
          navigate={navigate}
          onEnquire={openEnquiry}
          onOpenAuth={openAuth}
          savedCount={savedSlugs.length}
          user={auth.user}
        />
      )}
      <div id="main-content" tabIndex={-1}>
        {page}
      </div>
      <Footer
        navigate={navigate}
        onEnquire={openEnquiry}
        onOpenAuth={openAuth}
        onReport={() => setReportOpen(true)}
        onCookieSettings={openCookiePreferences}
        onSignOut={signOutFromSite}
        savedCount={savedSlugs.length}
        user={auth.user}
      />
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{saveAnnouncement}</p>
      {enquiry.open && <EnquiryPanel design={enquiry.design} onClose={closeEnquiry} />}
      <AuthDialog
        open={authDialog.open}
        mode={authDialog.mode}
        onClose={closeAuth}
        onAuthenticated={() => {
          closeAuth()
          navigate('account')
        }}
      />
      <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} user={auth.user} />
      <CookieBanner onNavigatePolicy={() => navigate('cookies')} policyHref="#cookies" />
    </>
  )
}
