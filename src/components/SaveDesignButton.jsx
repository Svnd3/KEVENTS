import { Heart } from 'lucide-react'

export default function SaveDesignButton({ design, saved, onToggle, className = '' }) {
  const action = saved ? 'Remove' : 'Save'
  const label = saved
    ? `Remove ${design.name} from saved designs`
    : `Save ${design.name} for later`

  return (
    <button
      className={`save-design-button${saved ? ' is-saved' : ''}${className ? ` ${className}` : ''}`}
      type="button"
      onClick={() => onToggle?.(design)}
      aria-label={label}
      aria-pressed={saved}
      title={label}
    >
      <Heart size={18} aria-hidden="true" />
      <span>{saved ? 'Saved' : action}</span>
    </button>
  )
}
