import api from './api'

const baseUrl = 'http://localhost:3032'

const interactionRequestApi = {
  async transfer(interactionId, { toAgentId, fromAgentName, toAgentName }) {
    const { data } = await api.post(`${baseUrl}/interactions/${interactionId}/transfer`, { toAgentId, fromAgentName, toAgentName })
    return data
  },
  async share(interactionId, { toAgentId, fromAgentName, toAgentName }) {
    const { data } = await api.post(`${baseUrl}/interactions/${interactionId}/share`, { toAgentId, fromAgentName, toAgentName })
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
