import { useEffect } from 'react'
import presenceApi from '../services/presenceApi'

const HEARTBEAT_INTERVAL_MS = 30000

// Mount once near the root of the authenticated app. The backend treats a
// heartbeat older than 90s as offline regardless of what the last known
// status was (see business service's services/presence.js) — that's what
// covers a dropped connection without needing a clean disconnect signal.
export function usePresenceHeartbeat(enabled) {
  useEffect(() => {
    if (!enabled) return undefined

    presenceApi.heartbeat().catch(() => {})
    const interval = setInterval(() => {
      presenceApi.heartbeat().catch(() => {})
    }, HEARTBEAT_INTERVAL_MS)

    const handleUnload = () => {
      // No reliable way to guarantee this completes on tab close with an
      // authenticated request (sendBeacon can't carry the Bearer token) —
      // the heartbeat staleness check on the backend is the real safety
      // net; this is just a best-effort head start on it.
      presenceApi.goOffline().catch(() => {})
    }
    window.addEventListener('beforeunload', handleUnload)

    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeunload', handleUnload)
      presenceApi.goOffline().catch(() => {})
    }
  }, [enabled])
}
