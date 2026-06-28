# Architecture Notes

This page is a deeper code walkthrough for maintainers. The top-level README stays focused on what the app does, how it works at a high level, and how to run it.

## File Structure

```text
pick-for-us/
├── index.html          # Entry point, SEO/social tags, and the root React mount
├── vite.config.js      # Vite config with the React JSX compiler
├── package.json        # Frontend dependencies: React, Firebase, Vite
├── public/
│   ├── og-image.png    # Social preview image for shared links
│   └── og-image.svg    # Source SVG for the social preview image
├── src/
│   ├── main.jsx        # Mounts the React app into index.html's #root div
│   ├── App.jsx         # Main application logic and UI
│   └── App.css         # Styles built on a CSS design token system
├── worker/
│   ├── package.json    # Worker-only dependencies and deploy scripts
│   ├── package-lock.json
│   ├── src/
│   │   └── index.js    # Cloudflare Worker proxy for Google APIs
│   └── wrangler.toml   # Worker config and KV namespace bindings
└── docs/
    ├── architecture.md # This file
    └── ui-research/    # Design research reports used to inform the UI
```

## Frontend Entry Points

### `index.html`

A near-empty HTML file: mostly SEO/social meta tags, a `<div id="root">` that React mounts into, and a `<script>` tag pointing at `src/main.jsx`. Vite injects the compiled JS/CSS bundles here at build time.

### `vite.config.js`

Small Vite config that registers the `@vitejs/plugin-react` plugin, which tells Vite how to transform JSX into browser-ready JavaScript.

### `src/main.jsx`

The bootstrap file. Calls `createRoot().render(<App />)` to hand control to React. This rarely needs to change.

## `src/App.jsx`

Most of the app lives here. It has three broad responsibilities.

### 1. Firebase setup

- Initializes the Firebase app with the project config.
- Gets the Realtime Database instance.
- Computes the room ID from the URL, or generates a 9-character ID and writes it to the URL.
- Defines `SUGGESTIONS`, the pre-loaded restaurant options grouped by category.

### 2. State and data

- `useState` hooks hold local UI state: restaurant list, winner, spin state, input value, nearby search state, duplicate messages, viewer count, and panel open/closed states.
- `useEffect` sets up Firebase `onValue` listeners for restaurants, winner, connection state, and room presence.
- Presence uses Firebase `onDisconnect`, so the UI can show when multiple people are in the room and remove presence entries when a browser leaves.
- `addRestaurant`, `removeRestaurant`, and `pickRandom` write to Firebase. Firebase then propagates those changes to every connected client.
- The winner is chosen immediately when `pickRandom` runs. The spin animation is visual only.
- The winner is also written directly to local state, not only Firebase, so the UI still updates if the same winner is picked twice in a row and Firebase does not emit a changed value.
- Nearby search uses `VITE_WORKER_URL` to call the Cloudflare Worker for geocoding and nearby restaurant search.

### 3. Rendered UI

The JSX renders:

- Title, subtitle, presence count, and invite button.
- Restaurant input row.
- Restaurant list and empty state.
- Pick button and winner result.
- Collapsible suggestion chips.
- Collapsible nearby restaurant search.
- Privacy footer.

`Chevron` is the only small helper component; the rest stays in the main `App` function for simplicity.

## `src/App.css`

Styles are built on CSS custom properties defined in `:root`.

| Token group | Purpose |
|---|---|
| `--space-*` | 4/8px spacing scale applied everywhere |
| `--neutral-*` | 11-step warm gray ramp |
| `--color-*` | Semantic tokens for text, surfaces, borders, primary, danger, and winner states |
| `--text-*` | Type scale from display to label |
| `--weight-*` | Font weights |
| `--radius-*` | Border radius scale |
| `--elev-*` | Two-layer box shadows |
| `--motion-*` | Duration and easing curves |

Most component styles reference these tokens, so changing a token propagates through the UI.

## Worker Proxy

`worker/src/index.js` is a Cloudflare Worker that:

- Receives browser requests from the app.
- Adds CORS headers for the production site origins.
- Keeps the Google API key server-side via `env.GOOGLE_PLACES_API_KEY`.
- Proxies `/nearby` to Google Places Nearby Search.
- Proxies `/geocode` to Google Geocoding.
- Uses Cloudflare KV as a simple global daily request counter.

The Worker is intentionally small. It is a spend-control and secret-hiding proxy, not a full backend application.
