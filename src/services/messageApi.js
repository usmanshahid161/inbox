import api from './api'
import { mockFetchMessages, mockSendMessage } from '../mocks/mockApi'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API !== 'false'
const baseUrl = 'http://localhost:3032'

// Previously used bare fetch() here with no Authorization header at all —
// every UI-originated message list/send call was going out unauthenticated
// against an interaction manager that now requires a Bearer token. Routed
// through the shared `api` instance instead, matching interactionApi.js /
// templatesAPI.js, so the token (and 401 refresh handling) apply here too.
const messageApi = {
  async list(interactionId, params) {
    if (USE_MOCK) return mockFetchMessages(interactionId)

    const { data } = await api.get(`${baseUrl}/messages/interaction/${interactionId}`, { params })
    return data
  },

  async send(message) {
    if (USE_MOCK) return mockSendMessage({ message })

    const { data } = await api.post(`${baseUrl}/messages`, message)
    return data
  },

  async uploadFile(file, interactionId) {
    const formData = new FormData()

    formData.append('file', file)
    formData.append('interactionId', interactionId)
    formData.append('type', 'audio')

    const { data } = await api.post(`${baseUrl}/fileUpload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    return data
  }
}

export default messageApi
