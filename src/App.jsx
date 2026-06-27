import { useState, useEffect, useRef } from 'react'
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, push, remove, set, onValue } from 'firebase/database'
import './App.css'

const firebaseConfig = {
  apiKey: "AIzaSyAf8FxYhAgYPB3H2mDvzZUpfSUMAEDI240",
  authDomain: "meal-picker-a1961.firebaseapp.com",
  databaseURL: "https://meal-picker-a1961-default-rtdb.firebaseio.com",
  projectId: "meal-picker-a1961",
  storageBucket: "meal-picker-a1961.firebasestorage.app",
  messagingSenderId: "292156708829",
  appId: "1:292156708829:web:ee3b9535fd0bcfb1d78834"
}

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)

let roomId = new URLSearchParams(window.location.search).get('room')
if (!roomId) {
  roomId = Math.random().toString(36).slice(2, 8)
  window.history.replaceState({}, '', `?room=${roomId}`)
}
const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`

const SUGGESTIONS = {
  'Burgers':    ["McDonald's", "Wendy's", "Burger King", "Shake Shack", "Chick-fil-A"],
  'Pizza':      ["Domino's", "Pizza Hut", "Papa John's", "Little Caesars"],
  'Mexican':    ["Chipotle", "Taco Bell", "Qdoba"],
  'Chicken':    ["Popeyes", "KFC", "Wingstop", "Raising Cane's"],
  'Asian':      ["Panda Express", "Cava", "Sweetgreen"],
  'Sandwiches': ["Subway", "Panera Bread", "Jimmy John's"],
}

export default function App() {
  const [restaurants, setRestaurants] = useState({})
  const [winner, setWinner] = useState(null)
  const [spinning, setSpinning] = useState(false)
  const [spinIndex, setSpinIndex] = useState(null)
  const [inputVal, setInputVal] = useState('')
  const [helpOpen, setHelpOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [copyLabel, setCopyLabel] = useState('Copy link')
  const inputRef = useRef(null)

  const restaurantsRef = ref(db, `rooms/${roomId}/restaurants`)
  const winnerRef = ref(db, `rooms/${roomId}/winner`)

  useEffect(() => {
    const unsub1 = onValue(restaurantsRef, snap => {
      setRestaurants(snap.val() || {})
    })
    const unsub2 = onValue(winnerRef, snap => {
      setWinner(snap.val())
    })
    return () => { unsub1(); unsub2() }
  }, [])

  const entries = Object.entries(restaurants)

  function addRestaurant(name) {
    const n = (name ?? inputVal).trim()
    if (!n) return
    push(restaurantsRef, n)
    setInputVal('')
    inputRef.current?.focus()
  }

  function removeRestaurant(key) {
    remove(ref(db, `rooms/${roomId}/restaurants/${key}`))
    remove(winnerRef)
    setWinner(null)
  }

  function pickRandom() {
    if (!entries.length) return
    setWinner(null)
    setSpinning(true)
    let i = 0
    const total = entries.length
    const interval = setInterval(() => {
      setSpinIndex(i % total)
      i++
    }, 80)
    setTimeout(() => {
      clearInterval(interval)
      setSpinning(false)
      setSpinIndex(null)
      const winnerIndex = Math.floor(Math.random() * total)
      const winnerName = entries[winnerIndex][1]
      set(winnerRef, winnerName)
    }, 1200)
  }

  function copyLink() {
    navigator.clipboard.writeText(shareUrl)
    setCopyLabel('Copied!')
    setTimeout(() => setCopyLabel('Copy link'), 2000)
  }

  return (
    <div className="page">
      <div className="card">
        <h1>Meal Picker</h1>
        <p className="subtitle">Add your options and let fate decide.</p>

        <button className="help-toggle" onClick={() => setHelpOpen(o => !o)}>
          Need help? Browse options
        </button>

        <div className={`help-panel ${helpOpen ? 'open' : ''}`}>
          {Object.entries(SUGGESTIONS).map(([category, items]) => (
            <div key={category} className="help-category">
              <div className="help-category-label">{category}</div>
              <div className="help-chips">
                {items.map(name => (
                  <button key={name} className="help-chip" onClick={() => addRestaurant(name)}>
                    {name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="input-row">
          <input
            ref={inputRef}
            type="text"
            placeholder="Restaurant name…"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addRestaurant()}
          />
          <button className="btn-add" onClick={() => addRestaurant()}>Add</button>
        </div>

        <ul className="restaurant-list">
          {entries.length === 0 && (
            <li className="empty-hint">No restaurants yet.</li>
          )}
          {entries.map(([key, name], i) => (
            <li
              key={key}
              className={
                (spinning && spinIndex === i) || (!spinning && winner === name)
                  ? 'winner' : ''
              }
            >
              {name}
              <button className="remove-btn" onClick={() => removeRestaurant(key)}>×</button>
            </li>
          ))}
        </ul>

        <div className="pick-row">
          <button className="btn-pick" onClick={pickRandom}>Pick one</button>
          {winner && !spinning && (
            <div className="result">Let's go to {winner}!</div>
          )}
        </div>

        <div className="share-section">
          <button className="btn-share" onClick={() => setShareOpen(o => !o)}>Share</button>
          <div className={`share-box ${shareOpen ? 'open' : ''}`}>
            <span>{shareUrl}</span>
            <button className="btn-copy" onClick={copyLink}>{copyLabel}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
