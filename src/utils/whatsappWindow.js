const WHATSAPP_WINDOW_MS = 24 * 60 * 60 * 1000

// WhatsApp only allows free-form (non-Template) outbound messages within
// 24 hours of the customer's last message — this mirrors the same check
// enforced server-side in services/message.js, so the UI reflects it
// before a send even gets rejected.
export function getWhatsappWindowStatus(lastCustomerMessageAt, now = Date.now()) {
  if (!lastCustomerMessageAt) {
    return { open: false, remainingMs: 0, expiresAt: null }
  }

  const expiresAt = new Date(lastCustomerMessageAt).getTime() + WHATSAPP_WINDOW_MS
  const remainingMs = expiresAt - now

  return { open: remainingMs > 0, remainingMs: Math.max(remainingMs, 0), expiresAt }
}

export function formatRemainingWindow(remainingMs) {
  const hours = Math.floor(remainingMs / (60 * 60 * 1000))
  const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000))
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}
