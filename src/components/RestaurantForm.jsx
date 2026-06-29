export function RestaurantForm({
  inputRef,
  inputVal,
  dupMsg,
  spinning,
  onInputChange,
  onAddRestaurant,
}) {
  return (
    <>
      <div className="input-row">
        <label htmlFor="restaurant-input" className="sr-only">Restaurant name</label>
        <input
          id="restaurant-input"
          ref={inputRef}
          type="text"
          placeholder="Restaurant name…"
          value={inputVal}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onAddRestaurant()}
          disabled={spinning}
        />
        <button
          className="btn-add"
          onClick={() => onAddRestaurant()}
          disabled={!inputVal.trim() || spinning}
        >
          Add
        </button>
      </div>
      {dupMsg && <p className="dup-msg" role="alert">{dupMsg}</p>}
    </>
  )
}
