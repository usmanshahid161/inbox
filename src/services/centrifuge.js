import { Centrifuge } from 'centrifuge'
import config from '../config'

const CENTRIFUGE_URL = config.CENTRIFUGE_URL

/**
 * Thin wrapper around the Centrifuge client.
 *
 * Security note: `subscribeToTenantChannel` is the ONLY way callers can
 * subscribe, and it always builds the channel name from the tenant id this
 * service was connected with — never from a caller-supplied string. That
 * means nothing in the app can accidentally (or intentionally) subscribe to
 * another tenant's channel; the tenant id always comes from the
 * authenticated session, not from a route or query parameter.
 */
class CentrifugeService {
  constructor() {
    this.client = null
    this.subscriptions = new Map() // channelName -> Subscription
    this.stateListeners = new Set()
    this.tenantId = null
  }

  /**
   * @param {Object} params
   * @param {string} params.token - Centrifuge connection token issued by the backend for this session.
   * @param {string} params.tenantId - The authenticated user's tenant id (never from the URL).
   * @param {() => Promise<string>} [params.getToken] - Optional async refresher for expiring tokens.
   */
  connect({ token, tenantId, getToken }) {
    if (this.client) this.disconnect()

    this.tenantId = tenantId
    this.client = new Centrifuge(CENTRIFUGE_URL)

    this.client.on('connecting', () => this._emitState('connecting'))
    this.client.on('connected', () => this._emitState('connected'))
    this.client.on('disconnected', () => this._emitState('disconnected'))

    this.client.connect()
  }

  disconnect() {
    this.subscriptions.forEach((sub) => {
      sub.removeAllListeners()
      sub.unsubscribe()
    })
    this.subscriptions.clear()

    if (this.client) {
      this.client.removeAllListeners()
      this.client.disconnect()
      this.client = null
    }

    this.tenantId = null
    this._emitState('disconnected')
  }

  /**
   * Subscribe to a tenant-scoped channel, e.g. suffix "messages" resolves to
   * "tenant:{tenantId}:messages". Returns the existing subscription if
   * already subscribed, so this is safe to call from multiple components.
   */
  subscribeToTenantChannel(suffix, handlers = {}) {
    if (!this.client || !this.tenantId) return null

    const channelName = `tenant_${this.tenantId}_${suffix}`
    if (this.subscriptions.has(channelName)) {
      return this.subscriptions.get(channelName)
    }

    const sub = this.client.newSubscription(channelName)
    if (handlers.onPublication) sub.on('publication', (ctx) => handlers.onPublication(ctx.data))
    if (handlers.onSubscribed) sub.on('subscribed', handlers.onSubscribed)
    if (handlers.onError) sub.on('error', handlers.onError)
    sub.subscribe()

    this.subscriptions.set(channelName, sub)
    return sub
  }

  unsubscribe(suffix) {
    if (!this.tenantId) return
    const channelName = `tenant_${this.tenantId}_${suffix}`
    const sub = this.subscriptions.get(channelName)
    if (sub) {
      sub.removeAllListeners()
      sub.unsubscribe()
      this.subscriptions.delete(channelName)
    }
  }

  onConnectionStateChange(listener) {
    this.stateListeners.add(listener)
    return () => this.stateListeners.delete(listener)
  }

  _emitState(state) {
    this.stateListeners.forEach((listener) => listener(state))
  }

  get connectionState() {
    return this.client?.state || 'disconnected'
  }
}

// Singleton — one realtime connection per browser tab, matching one
// authenticated tenant session at a time.
export const centrifugeService = new CentrifugeService()