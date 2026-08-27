const editorialVariants = new Set(['magazine', 'newspaper', 'editorial', 'couture', 'cover', 'society'])
const minimalVariants = new Set(['line', 'bow', 'serif', 'monogram', 'clay', 'thread'])
const floralVariants = new Set(['peony', 'pressed', 'orchid', 'bougainvillea', 'protea', 'rose', 'blooming'])
const cinematicVariants = new Set(['dawn', 'noir', 'cosmos', 'reel', 'blooming', 'nightcity', 'city', 'stars'])
const archVariants = new Set(['arch', 'coastal', 'spice', 'cathedral'])
const ringVariants = new Set(['beads', 'orbit', 'cosmos'])
const geometryVariants = new Set(['print', 'blocks', 'electric', 'glass', 'clay'])
const starVariants = new Set(['cosmos', 'stars', 'nightcity'])

function MountainLines() {
  return (
    <svg className="art-mountains" viewBox="0 0 400 220" aria-hidden="true">
      <path d="M-20 210 82 88l42 58 50-96 58 91 35-43 74 112" />
      <path d="M-10 217 105 135l35 41 49-82 49 72 38-34 72 85" />
    </svg>
  )
}

function BotanicalLines() {
  return (
    <svg className="art-botanical" viewBox="0 0 120 220" aria-hidden="true">
      <path d="M22 226C13 145 42 73 101 5" />
      <path d="M32 170c38-2 58-22 64-58-35 3-57 21-64 58ZM53 111C26 98 17 77 22 49c27 12 38 32 31 62ZM70 75c29-2 43-17 46-44-27 4-42 18-46 44Z" />
    </svg>
  )
}

export default function InvitationArtwork({ design, className = '', priority = false }) {
  const [first, second] = design.couple
  const [background, ink, accent, accentTwo] = design.palette
  const isEditorial = editorialVariants.has(design.variant)
  const isMinimal = minimalVariants.has(design.variant)
  const isFloral = floralVariants.has(design.variant)
  const isCinematic = cinematicVariants.has(design.variant)
  const hasBotanical = isFloral || ['tree', 'vineyard', 'spice', 'mehndi'].includes(design.variant)
  const style = {
    '--art-bg': background,
    '--art-ink': ink,
    '--art-accent': accent,
    '--art-accent-2': accentTwo,
  }

  return (
    <div
      className={`artwork artwork--${design.variant} ${design.image ? 'artwork--photo' : ''} ${isEditorial ? 'artwork--editorial' : ''} ${isMinimal ? 'artwork--minimal' : ''} ${isFloral ? 'artwork--floral' : ''} ${isCinematic ? 'artwork--cinematic' : ''} ${className}`}
      style={style}
      aria-label={`${design.name} invitation preview`}
    >
      {design.image && (
        <img
          className="artwork__photo"
          src={design.image}
          alt=""
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
        />
      )}
      {design.image && <div className="artwork__veil" />}
      <div className="artwork__grain" />
      {geometryVariants.has(design.variant) && <div className="artwork__geometry" aria-hidden="true">
        <i /><i /><i /><i />
      </div>}
      {!isMinimal && <div className="artwork__orb artwork__orb--one" aria-hidden="true" />}
      {!isMinimal && <div className="artwork__orb artwork__orb--two" aria-hidden="true" />}
      {archVariants.has(design.variant) && <div className="artwork__arch" aria-hidden="true" />}
      {ringVariants.has(design.variant) && <div className="artwork__rings" aria-hidden="true"><i /><i /><i /></div>}
      {starVariants.has(design.variant) && <div className="artwork__stars" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>}
      {(design.variant === 'mountain' || design.variant === 'mist') && <MountainLines />}
      {hasBotanical && <BotanicalLines />}

      <div className="invitation">
        <span className="invitation__issue">{isEditorial ? 'THE WEDDING EDIT' : 'K EVENTS • NAIROBI'}</span>
        <span className="invitation__kicker">{isCinematic ? 'A LOVE STORY' : 'TOGETHER WITH OUR FAMILIES'}</span>
        <div className="invitation__monogram" aria-hidden="true">{first[0]}{second[0]}</div>
        <h3 className="invitation__names">
          <span>{first}</span>
          <em>&amp;</em>
          <span>{second}</span>
        </h3>
        <p className="invitation__copy">joyfully invite you to celebrate their wedding</p>
        <div className="invitation__date"><span>16</span><i />OCTOBER<i /><span>27</span></div>
        <span className="invitation__place">
          {design.category === 'Destination' ? 'A BEAUTIFUL PLACE • FAR AWAY' : 'NAIROBI • KENYA'}
        </span>
        <div className="invitation__scroll" aria-hidden="true"><i /></div>
      </div>

      {isEditorial && (
        <div className="artwork__editorial-copy" aria-hidden="true">
          <strong>{design.variant === 'newspaper' ? 'VOWS' : 'AMOUR'}</strong>
          <span>THE CELEBRATION ISSUE</span>
        </div>
      )}
      {design.variant === 'reel' && <div className="artwork__film" aria-hidden="true" />}
    </div>
  )
}
