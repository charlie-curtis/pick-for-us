# Just Pick Food

A real-time collaborative food picker. Add places together, share one live room, and let the app choose where to eat.

**Live:** [justpickfood.com](https://justpickfood.com)

<img src="docs/assets/pick-for-us-screenshot.png" alt="Just Pick Food app screenshot" width="420">

---

## How it works

```
Browser A ◀──▶ Firebase Realtime Database ◀──▶ Browser B
   │                                                   │
   └──────────────▶ Cloudflare Worker ◀────────────────┘
                         │
                         ├──▶ Google Maps APIs
                         └──▶ Cloudflare KV (daily request counter)
```

There is no app server for the shared-room workflow. The app is a static React frontend that reads from and writes to Firebase Realtime Database. Firebase also pushes updates back to connected clients over WebSockets — so when one user adds a restaurant, everyone in the same room sees it immediately.

Nearby restaurant search is the one server-side path: the browser calls a Cloudflare Worker, and the Worker calls Google Places or Geocoding. The Worker also handles rate limiting via Cloudflare KV counters.

Each session gets a **room ID** generated on first load and stored in the URL (`?room=abc123xyz`). Sharing that URL gives anyone access to the same room.

---

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| UI framework | React 18 | Component model, state management |
| Build tool | Vite | Fast dev server, JSX compilation |
| Realtime database | Firebase Realtime Database | Push-based sync across clients; lightweight and cheap with no backend |
| Styling | Plain CSS + custom properties | No build-time dependency, token system gives design consistency |
| API proxy | Cloudflare Workers | Keeps Google API key server-side |
| Rate limiter | Cloudflare KV | Stores the daily API usage counter |
| Maps/search | Google Places + Geocoding APIs | Finds nearby restaurants from address or current location |

---

## Architecture notes

Detailed architecture notes live in [docs/architecture.md](docs/architecture.md), including the file structure, React app walkthrough, CSS tokens, Firebase data model, and Worker proxy details.

---

## Contributing

Contributions are welcome through issues and pull requests. Local development notes and PR guidance live in [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).
