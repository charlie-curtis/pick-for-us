# Just Pick Food

A real-time collaborative food picker. Add places together, share one live room, and let the app choose where to eat.

**Live:** [justpickfood.com](https://justpickfood.com)

![Just Pick Food app screenshot](docs/assets/pick-for-us-screenshot.png)

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

Nearby restaurant search is the one server-side path: the browser calls a Cloudflare Worker, and the Worker calls Google Places or Geocoding with the Google API key kept server-side. The Worker also stores a global daily request counter in Cloudflare KV.

Each session gets a **room ID** generated on first load and stored in the URL (`?room=abc123xyz`). Sharing that URL gives anyone access to the same room.

---

## Project docs

The README is intentionally kept high-level. For a deeper maintainer walkthrough of the file structure, React app, CSS tokens, and Worker proxy, see [docs/architecture.md](docs/architecture.md).

---

## Cloudflare Worker proxy

The nearby restaurant search feature routes through a Cloudflare Worker rather than calling Google APIs directly from the browser.

```
Browser ──▶ Cloudflare Worker ──▶ Google Places API
                  │         └────▶ Google Geocoding API
                  └──────────────▶ KV (global daily counter)
```

**Why a proxy?** The Google API key must never appear in browser code — anything shipped to the client is publicly visible. The Worker keeps the key server-side as an encrypted secret, and the browser never sees it.

**CORS:** The Worker returns CORS headers for `https://justpickfood.com` and `https://www.justpickfood.com`. This lets the production frontend read Worker responses in the browser.

**Rate limiting:** The Worker checks a global counter stored in Cloudflare KV. The counter is keyed by day (`global:<day-number>`) and capped at 100 requests/day across all users. When the cap is hit, the Worker returns a `429` error and the app surfaces a message. The counter resets automatically at midnight UTC — no cron job needed, the day-bucketed key just changes with time.

The counter is intentionally simple and global. Because Cloudflare KV is eventually consistent, a burst of simultaneous requests can overshoot the exact cap slightly, but it still bounds usage for this small app. For an exact global counter, the Worker would need a stronger coordination primitive such as Durable Objects.

**Routes:**

| Method | Path | Proxies to |
|---|---|---|
| `POST` | `/nearby` | Google Places Nearby Search API |
| `GET` | `/geocode?address=...` | Google Geocoding API |

### Worker setup

```bash
cd worker
npm install
npx wrangler login
npx wrangler kv:namespace create RATE_LIMIT_KV
npx wrangler kv:namespace create RATE_LIMIT_KV --preview
# paste the returned IDs into worker/wrangler.toml
npx wrangler secret put GOOGLE_PLACES_API_KEY
npx wrangler deploy
```

Then add the deployed Worker URL to `.env.local` in the project root:

```
VITE_WORKER_URL=https://meal-picker-proxy.<your-subdomain>.workers.dev
```

---

## Data model

Firebase stores rooms as a JSON tree:

```json
{
  "rooms": {
    "abc123": {
      "restaurants": {
        "-NxKj2...": "Chipotle",
        "-NxKj3...": "Shake Shack"
      },
      "winner": "Chipotle",
      "presence": {
        "-NxPresence...": true
      }
    }
  }
}
```

Restaurant and presence keys are Firebase push IDs (random, collision-safe, time-ordered). The winner is a plain string — the restaurant name. Presence entries are created per connected browser and removed automatically with Firebase `onDisconnect`.

---

## Getting started

**Prerequisites:** Node.js 20.19+ or 22.12+ (required by the current Vite version)

```bash
git clone https://github.com/charlie-curtis/pick-for-us.git
cd pick-for-us
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). To share a session, copy the URL (which now includes `?room=<id>`) and open it in another browser tab or send it to someone.

Nearby restaurant search also needs `VITE_WORKER_URL` in `.env.local`; see the Worker setup section above.

### Other commands

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server with hot reload |
| `npm run build` | Compile a production bundle into `dist/` |
| `npm run preview` | Serve the production build locally |

---

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| UI framework | React 18 | Component model, state management |
| Build tool | Vite | Fast dev server, JSX compilation |
| Realtime database | Firebase Realtime Database | Push-based sync across clients with no backend |
| Styling | Plain CSS + custom properties | No build-time dependency, token system gives design consistency |
| API proxy | Cloudflare Workers | Keeps Google API key server-side, enforces global rate limit |
| Rate limit store | Cloudflare KV | Persistent daily request counter, auto-expires |
| Maps/search | Google Places + Geocoding APIs | Finds nearby restaurants from address or current location |
