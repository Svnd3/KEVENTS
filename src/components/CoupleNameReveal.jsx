import '../couple-name-reveal.css'

function AnimatedName({ children, position }) {
  return (
    <span className={`cnr__name cnr__name--${position}`}>
      {Array.from(children).map((character, index) => (
        <span
          className="cnr__character"
          key={`${character}-${index}`}
          style={{ '--cnr-character': index }}
        >
          {character === ' ' ? '\u00a0' : character}
        </span>
      ))}
    </span>
  )
}

function SignatureNames({ first, second }) {
  return (
    <span className="cnr__signature">
      <span className="cnr__signature-name cnr__signature-name--first">{first}</span>
      <span className="cnr__signature-ampersand">&amp;</span>
      <span className="cnr__signature-name cnr__signature-name--second">{second}</span>
      <svg className="cnr__signature-stroke" viewBox="0 0 820 94" preserveAspectRatio="none" aria-hidden="true">
        <path pathLength="1" d="M18 62C151 81 258 18 378 49C489 78 587 82 802 30" />
      </svg>
    </span>
  )
}

export default function CoupleNameReveal({ design, recipe, active }) {
  if (!recipe) return null

  const [first = '', second = ''] = design?.couple || []
  const fullNames = [first, second].filter(Boolean).join(' & ')
  const palette = design?.palette || []
  const artwork = recipe.artwork || design?.image
  const style = {
    '--cnr-one': palette[0] || '#f2eee7',
    '--cnr-two': palette[1] || '#181818',
    '--cnr-three': palette[2] || '#a56972',
    '--cnr-four': palette[3] || '#7e6b5e',
    '--cnr-surface': recipe.surface || palette[0] || '#f2eee7',
    '--cnr-ink': recipe.ink || palette[1] || '#181818',
    '--cnr-accent': recipe.accent || palette[2] || '#a56972',
    '--cnr-artwork': artwork ? `url("${artwork}")` : 'none',
  }

  return (
    <section
      className={`couple-name-reveal cnr--${recipe.style}${active ? ' is-active' : ''}`}
      data-design={design?.slug}
      data-backdrop={recipe.backdrop || undefined}
      data-scene={recipe.scene || undefined}
      style={style}
      aria-hidden={!active}
    >
      <span className="cnr__artwork" aria-hidden="true" />
      <span className="cnr__wash" aria-hidden="true" />
      <span className="cnr__grain" aria-hidden="true" />

      <span className="cnr__ornament" aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => <i key={index} />)}
      </span>

      <div className="cnr__copy">
        <p className="cnr__eyebrow">{recipe.eyebrow}</p>
        <h2 className="cnr__names" aria-label={fullNames}>
          <span className="cnr__animated-names" aria-hidden="true">
            {recipe.style === 'signature' ? (
              <SignatureNames first={first} second={second} />
            ) : (
              <>
                <AnimatedName position="first">{first}</AnimatedName>
                <span className="cnr__ampersand">&amp;</span>
                <AnimatedName position="second">{second}</AnimatedName>
              </>
            )}
          </span>
        </h2>
        <p className="cnr__promise">Together, from this day forward.</p>
      </div>
    </section>
  )
}
