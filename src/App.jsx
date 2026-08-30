import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CirclePlay,
  Menu,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import InvitationArtwork from './components/InvitationArtwork.jsx'
import BrandLogo from './components/BrandLogo.jsx'
import SaveDesignButton from './components/SaveDesignButton.jsx'
import { categories, designs, formatPrice, pricingTiers } from './data/designs.js'

const featuredNames = [
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

function Header({ view, navigate, onEnquire, savedCount }) {
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
      </nav>
      <button className="header-cta" type="button" onClick={() => onEnquire(null)}>
        <span>Get started</span><ArrowRight size={15} strokeWidth={1.8} />
      </button>
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

function DesignCard({ design, large = false, saved = false, onToggleSaved }) {
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
          <strong>{formatPrice(design.price)}</strong>
          <small>One-time</small>
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

function PricingGuide({ navigate }) {
  return (
    <section className="pricing-guide section-pad" data-reveal aria-labelledby="pricing-guide-title">
      <div className="pricing-guide__intro">
        <span className="eyebrow">Clear, one-time pricing</span>
        <h2 id="pricing-guide-title">One invitation.<br /><span>Every guest.</span></h2>
        <p>Pay for the creative work—not for the size of your guest list. Every listed price includes personalisation, a shareable link and two review rounds.</p>
        <button className="text-link" type="button" onClick={() => navigate('collection')}>See exact design prices <ArrowRight size={15} /></button>
        <p className="pricing-guide__note">Names, wording, colours and event details are customised. No per-guest charge.</p>
      </div>
      <div className="pricing-guide__tiers">
        {pricingTiers.map((tier) => (
          <article key={tier.key}>
            <span>{tier.name}</span>
            <strong>{formatPrice(tier.min)}–{tier.max.toLocaleString('en-KE')}</strong>
            <p>{tier.description}</p>
          </article>
        ))}
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
      <PricingGuide navigate={navigate} />
      <section className="manifesto section-pad" data-reveal>
        <div className="manifesto__copy">
          <span className="eyebrow">How it works</span>
          <h2>Choose a design.<br /><span>We customise it.</span></h2>
          <p>Send us your wording, colours, photos and event details. We prepare the invitation for you to review.</p>
          <button className="text-link" type="button" onClick={() => onEnquire(null)}>Start an enquiry <ArrowRight size={15} /></button>
        </div>
        <div className="manifesto__details">
          <div><span>Choose a design</span></div>
          <div><span>Send your details</span></div>
          <div><span>Review and approve</span></div>
        </div>
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
              <label><span>Names</span><input name="name" autoComplete="name" required placeholder="Njeri and Malik" data-autofocus /></label>
              <label><span>Email address</span><input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label>
              <label><span>Event date</span><input name="date" type="date" /></label>
              <label><span>Invitation details</span><textarea name="message" required rows="4" placeholder="Tell us about the events, wording and any ideas you already have." /></label>
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

function Footer({ navigate, onEnquire, savedCount }) {
  return (
    <footer className="site-footer section-pad">
      <div className="footer-brand"><BrandLogo /></div>
      <div className="footer-copy"><p>Digital invitations<br />designed in Nairobi.</p><span>Available worldwide</span></div>
      <div className="footer-links">
        <button type="button" onClick={() => navigate('collection')}>Designs</button>
        <button type="button" onClick={() => navigate('saved')}>Saved designs{savedCount ? ` (${savedCount})` : ''}</button>
        <button type="button" onClick={() => onEnquire(null)}>Custom design</button>
        <button type="button" onClick={() => navigate('home')}>Home</button>
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Back to top</button>
      </div>
      <div className="footer-bottom"><span>© 2026 Tell &amp; Wed</span></div>
    </footer>
  )
}

export default function App() {
  const [view, setView] = useState(getView)
  const [enquiry, setEnquiry] = useState({ open: false, design: null })
  const [savedSlugs, setSavedSlugs] = useState(readSavedDesigns)
  const [saveAnnouncement, setSaveAnnouncement] = useState('')
  const progressRef = useRef(null)
  const viewRef = useRef(view)
  const collectionScrollRef = useRef(0)
  const closeEnquiry = useCallback(() => setEnquiry({ open: false, design: null }), [])
  const previewDesign = view === 'preview' ? getPreviewDesign() : null
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
    document.title = previewDesign
      ? `${previewDesign.name} | Tell & Wed`
      : view === 'collection'
        ? 'Invitation designs | Tell & Wed'
        : view === 'saved'
          ? 'Saved designs | Tell & Wed'
        : 'Tell & Wed | Digital invitations'
  }, [previewDesign, view])

  const navigate = (destination) => {
    const nextHash = destination === 'collection'
      ? '#collection'
      : destination === 'saved'
        ? '#saved'
        : '#home'
    if (window.location.hash === nextHash) {
      setView(destination)
      window.scrollTo({ top: 0, behavior: 'auto' })
    } else {
      window.location.hash = nextHash
    }
  }

  const openEnquiry = useCallback((design) => {
    setEnquiry({ open: true, design })
  }, [])

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
      </>
    )
  }

  return (
    <>
      <SkipLink />
      <div className="scroll-progress" ref={progressRef} />
      <Header view={view} navigate={navigate} onEnquire={openEnquiry} savedCount={savedSlugs.length} />
      <div id="main-content" tabIndex={-1}>
        {view === 'home'
          ? <HomePage navigate={navigate} onEnquire={openEnquiry} savedSet={savedSet} onToggleSaved={toggleSaved} />
          : view === 'collection'
            ? <CollectionPage savedSet={savedSet} onToggleSaved={toggleSaved} />
            : <SavedPage navigate={navigate} savedDesigns={savedDesigns} savedSet={savedSet} onToggleSaved={toggleSaved} />}
      </div>
      <Footer navigate={navigate} onEnquire={openEnquiry} savedCount={savedSlugs.length} />
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{saveAnnouncement}</p>
      {enquiry.open && <EnquiryPanel design={enquiry.design} onClose={closeEnquiry} />}
    </>
  )
}
