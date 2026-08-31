import api from './api'

const baseUrl = 'http://localhost:3032'

const interactionRequestApi = {
  async transfer(interactionId, { toAgentId, fromAgentName }) {
    const { data } = await api.post(`${baseUrl}/interactions/${interactionId}/transfer`, { toAgentId, fromAgentName })
    return data
  },
  async share(interactionId, { toAgentId, fromAgentName }) {
    const { data } = await api.post(`${baseUrl}/interactions/${interactionId}/share`, { toAgentId, fromAgentName })
    return data
  },
  async accept(requestId) {
    const { data } = await api.post(`${baseUrl}/interactions/requests/${requestId}/accept`)
    return data
  },
  async reject(requestId) {
    const { data } = await api.post(`${baseUrl}/interactions/requests/${requestId}/reject`)
    return data
  }
}

export default interactionRequestApi
