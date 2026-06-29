export function PickControls({ show, winner, spinning, onPickRandom }) {
  if (!show) return null

  return (
    <div className="pick-row">
      <button className="btn-pick" onClick={onPickRandom} disabled={spinning}>
        {spinning ? 'Picking…' : winner ? 'Pick again' : 'Pick one'}
      </button>
      <div className="result" role="status" aria-live="polite">
        {winner && !spinning ? `Let's go to ${winner}!` : ''}
      </div>
    </div>
  )
}
