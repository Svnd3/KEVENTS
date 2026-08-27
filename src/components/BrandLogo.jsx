import '../brand-logo.css'

/**
 * K EVENTS identity.
 *
 * The mark is an abstract K cut from a folded invitation. The cobalt facet is
 * the fold, not a decorative accent, so the symbol stays legible at favicon
 * size and in monochrome printing.
 */
export default function BrandLogo({
  className = '',
  label = 'K EVENTS',
  variant = 'full',
}) {
  const compact = variant === 'compact' || variant === 'mark'
  const classes = ['ke-logo', compact ? 'ke-logo--compact' : 'ke-logo--full', className]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={classes} role="img" aria-label={label}>
      <svg
        className="ke-logo__mark"
        viewBox="0 0 48 48"
        aria-hidden="true"
        focusable="false"
      >
        <path
          className="ke-logo__ink"
          d="M5 3h9v16.15L28.25 3H40L22.7 22.45 42 45H29.62L14 26.58V45H5V3Z"
        />
        <path
          className="ke-logo__fold"
          d="m14 19.15 8.7 3.3L14 31.7V19.15Z"
        />
        <path
          className="ke-logo__cut"
          d="m22.7 22.45 5.55-6.25 3.8 4.42-5.5 6.22-3.85-4.39Z"
        />
      </svg>

      {!compact && (
        <span className="ke-logo__wordmark" aria-hidden="true">
          <span className="ke-logo__name">K EVENTS</span>
          <span className="ke-logo__descriptor">INVITATIONS</span>
        </span>
      )}
    </span>
  )
}

export function BrandMark({ className = '', label = 'K EVENTS' }) {
  return <BrandLogo className={className} label={label} variant="compact" />
}
