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
import { categories, designs, formatPrice } from './data/designs.js'

const featuredNames = ['Velvet Signal', 'Heart Parade', 'Up, Up & Always', 'Love, in Transit', 'Scarlet Hour', 'Soft Launch: Forever', 'Love Bomb']
const heroFeaturedNames = featuredNames.slice(0, 3)
const loadTemplatePreview = () => import('./components/TemplatePreview.jsx')
const TemplatePreview = lazy(loadTemplatePreview)

function getView() {
  const hash = window.location.hash
  if (hash === '#collection') return 'collection'
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

function Header({ view, navigate, onEnquire }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open])

  const move = (destination) => {
    setOpen(false)
    navigate(destination)
  }

  return (
    <header className="site-header">
      <button className="brand" type="button" onClick={() => move('home')} aria-label="K EVENTS home">
        <BrandLogo />
      </button>
      <nav id="main-navigation" className={`main-nav ${open ? 'is-open' : ''}`} aria-label="Main navigation">
        <button className={view === 'home' ? 'is-active' : ''} type="button" onClick={() => move('home')}>Home</button>
        <button className={view === 'collection' ? 'is-active' : ''} type="button" onClick={() => move('collection')}>Designs</button>
        <button type="button" onClick={() => { setOpen(false); onEnquire(null) }}>Custom design</button>
      </nav>
      <button className="header-cta" type="button" onClick={() => onEnquire(null)}>
        <span>Get started</span><ArrowRight size={15} strokeWidth={1.8} />
      </button>
      <button className="menu-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-label="Toggle menu" aria-controls="main-navigation" aria-expanded={open}>
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

function DesignCard({ design, large = false }) {
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
      <div className="design-card__meta">
        <div>
          <span>{design.category}</span>
          <h3>{design.name}</h3>
        </div>
        <strong>{formatPrice(design.price)}</strong>
      </div>
    </article>
  )
}

function Featured({ navigate }) {
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
        {featured.map((design) => <DesignCard key={design.id} design={design} large />)}
        <button className="collection-teaser" type="button" onClick={() => navigate('collection')} data-reveal>
          <span>All<br />designs</span>
          <p>Browse the full collection</p>
          <i><ArrowRight size={21} /></i>
        </button>
      </div>
    </section>
  )
}

function HomePage({ navigate, onEnquire }) {
  useScrollReveal('home')
  return (
    <main>
      <Hero navigate={navigate} onEnquire={onEnquire} />
      <Featured navigate={navigate} />
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

function CollectionPage() {
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('featured')
  const [showFilters, setShowFilters] = useState(false)

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
      return Number(b.featured) - Number(a.featured) || a.id - b.id
    })
  }, [category, search, sort])

  return (
    <main className="collection-page">
      <section className="collection-hero section-pad">
        <span className="eyebrow">Invitations for every event</span>
        <h1>Invitation designs</h1>
        <p>Filter by style, preview each design and choose one to customise.</p>
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
          <button className="filter-toggle" type="button" onClick={() => setShowFilters((value) => !value)} aria-expanded={showFilters}>
            <SlidersHorizontal size={16} /> Filters
          </button>
        </div>

        {showFilters && (
          <div className="catalog-filters">
            <div className="search-field">
              <Search size={17} />
              <label className="sr-only" htmlFor="design-search">Search designs</label>
              <input id="design-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search designs" />
              {search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search"><X size={15} /></button>}
            </div>
            <label className="sort-field">
              <span>Sort by</span>
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="featured">Featured</option>
                <option value="low">Price: low to high</option>
                <option value="high">Price: high to low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </label>
          </div>
        )}

        {filtered.length ? (
          <div className="catalog-grid">
            {filtered.map((design) => <DesignCard key={design.id} design={design} />)}
          </div>
        ) : (
          <div className="empty-state">
            <span>No results</span>
            <h2>No designs match your search.</h2>
            <p>Try another search or clear the filters.</p>
            <button type="button" className="button button--dark" onClick={() => { setSearch(''); setCategory('All') }}>Clear filters</button>
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

function Footer({ navigate, onEnquire }) {
  return (
    <footer className="site-footer section-pad">
      <div className="footer-brand"><BrandLogo /></div>
      <div className="footer-copy"><p>Digital invitations<br />designed in Nairobi.</p><span>Available worldwide</span></div>
      <div className="footer-links">
        <button type="button" onClick={() => navigate('collection')}>Designs</button>
        <button type="button" onClick={() => onEnquire(null)}>Custom design</button>
        <button type="button" onClick={() => navigate('home')}>Home</button>
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Back to top</button>
      </div>
      <div className="footer-bottom"><span>© 2026 K EVENTS</span></div>
    </footer>
  )
}

export default function App() {
  const [view, setView] = useState(getView)
  const [enquiry, setEnquiry] = useState({ open: false, design: null })
  const progressRef = useRef(null)
  const closeEnquiry = useCallback(() => setEnquiry({ open: false, design: null }), [])
  const previewDesign = view === 'preview' ? getPreviewDesign() : null

  useEffect(() => {
    const changeView = () => {
      setView(getView())
      setEnquiry({ open: false, design: null })
      window.scrollTo({ top: 0, behavior: 'instant' })
      window.requestAnimationFrame(() => document.getElementById('main-content')?.focus({ preventScroll: true }))
    }
    let frame = 0
    const updateProgress = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight
        const progress = max > 0 ? window.scrollY / max : 0
        if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`
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
      ? `${previewDesign.name} | K EVENTS`
      : view === 'collection'
        ? 'Invitation designs | K EVENTS'
        : 'K EVENTS | Digital invitations'
  }, [previewDesign, view])

  const navigate = (destination) => {
    const nextHash = destination === 'collection' ? '#collection' : '#home'
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
          />
        </Suspense>
        {enquiry.open && <EnquiryPanel design={enquiry.design} onClose={closeEnquiry} />}
      </>
    )
  }

  return (
    <>
      <SkipLink />
      <div className="scroll-progress" ref={progressRef} />
      <Header view={view} navigate={navigate} onEnquire={openEnquiry} />
      <div id="main-content" tabIndex={-1}>
        {view === 'home'
          ? <HomePage navigate={navigate} onEnquire={openEnquiry} />
          : <CollectionPage />}
      </div>
      <Footer navigate={navigate} onEnquire={openEnquiry} />
      {enquiry.open && <EnquiryPanel design={enquiry.design} onClose={closeEnquiry} />}
    </>
  )
}
