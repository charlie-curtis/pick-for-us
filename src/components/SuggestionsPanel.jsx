import { Chevron } from './Icons.jsx'

export function SuggestionsPanel({
  open,
  suggestions,
  addedNames,
  onToggle,
  onAddRestaurant,
}) {
  return (
    <div className="help-section">
      <button
        className="disclosure-toggle"
        aria-expanded={open}
        aria-controls="help-panel"
        onClick={onToggle}
      >
        <Chevron />
        Need ideas? Browse suggestions
      </button>
      <div id="help-panel" className={`collapse ${open ? 'open' : ''}`}>
        <div className="collapse-inner" {...(!open ? { inert: '' } : {})}>
          <div className="help-tray">
            {Object.entries(suggestions).map(([category, items]) => (
              <div key={category} className="help-category">
                <div className="help-category-label">{category}</div>
                <div className="help-chips">
                  {items.map(name => {
                    const added = addedNames.has(name.toLowerCase())
                    return (
                      <button
                        key={name}
                        className={`help-chip${added ? ' added' : ''}`}
                        onClick={() => onAddRestaurant(name, false)}
                        disabled={added}
                      >
                        {name}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
