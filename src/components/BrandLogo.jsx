import '../brand-logo.css'

/**
 * Tell & Wed identity.
 *
 * The continuous ampersand begins like a spoken loop and resolves like a
 * ribbon: a small visual bridge between telling the story and making the vow.
 */
export default function BrandLogo({
  className = '',
  label = 'Tell & Wed',
  variant = 'full',
}) {
  const compact = variant === 'compact' || variant === 'mark'
  const classes = ['tw-logo', compact ? 'tw-logo--compact' : 'tw-logo--full', className]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={classes} role="img" aria-label={label}>
      <svg
        className="tw-logo__mark"
        viewBox="0 0 48 48"
        aria-hidden="true"
        focusable="false"
      >
        <path
          className="tw-logo__thread"
          d="M32.7 36.6c-3.15 3.55-6.9 5.35-11.15 5.35-7.05 0-11.8-4.12-11.8-10.1 0-5.05 3.45-8.28 10.12-11.7 4.72-2.42 7.48-4.75 7.48-8.02 0-3.22-2.32-5.43-5.6-5.43-3.62 0-6.12 2.42-6.12 5.95 0 3.15 1.68 5.85 4.82 9.27l17.3 19.18"
        />
        <path
          className="tw-logo__ribbon"
          d="M30.35 23.35h9.4c-.72 5.48-3.08 10.2-7.05 13.25"
        />
      </svg>

      {!compact && (
        <span className="tw-logo__wordmark" aria-hidden="true">
          <span className="tw-logo__name">
            <span>Tell</span><span className="tw-logo__ampersand">&amp;</span><span>Wed</span>
          </span>
          <span className="tw-logo__descriptor">DIGITAL INVITATIONS</span>
        </span>
      )}
    </span>
  )
}

export function BrandMark({ className = '', label = 'Tell & Wed' }) {
  return <BrandLogo className={className} label={label} variant="compact" />
}
