import api from './api'
import { mockFetchChannels, mockToggleChannel } from '../mocks/mockApi'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API !== 'false'

const channelApi = {
  async list() {
    if (USE_MOCK) return mockFetchChannels()
    const { data } = await api.get('/channels')
    return data
  },

  async toggle(channelId, enabled) {
    if (USE_MOCK) return mockToggleChannel(channelId, enabled)
    const { data } = await api.patch(`/channels/${channelId}`, { enabled })
    return data
  },

  async connect(channelType) {
    // OAuth connect flow is intentionally out of scope — this is where the
    // backend's redirect URL / connect token request would be issued.
    if (USE_MOCK) throw new Error('Connecting a live channel requires the backend OAuth flow.')
    const { data } = await api.post('/channels/connect', { type: channelType })
    return data
  }
}

export default channelApi
