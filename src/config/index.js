// One shared host+protocol for every backend service — the thing that
// actually changes between environments (localhost in dev, a real domain
// in production). Each individual services/*Api.js file appends its own
// port to this (`${config.BASE_HOST}:3032`, etc.) — ports themselves
// don't change per environment, so they stay simple literals in each
// file rather than needing their own env var each.
//
// Vite only exposes env vars prefixed with VITE_ to client code —
// anything else silently reads as `undefined` here and falls back to the
// default no matter what .env says. That was the actual bug behind the
// old CENTRIFUGE_URL/BASE_URL never picking up .env overrides.
const config = {
  BASE_HOST:
    import.meta.env.VITE_BASE_HOST ||
    'http://localhost',

  CENTRIFUGE_URL:
    import.meta.env.VITE_CENTRIFUGE_URL ||
    'ws://localhost:8000/connection/websocket',
}

export default config
