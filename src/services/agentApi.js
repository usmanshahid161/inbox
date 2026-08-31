import api from './api'
import { mockCreateAgent, mockDeactivateAgent, mockFetchAgents, mockUpdateAgent } from '../mocks/mockApi'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API !== 'false'

const agentApi = {
  async list() {
    if (USE_MOCK) return mockFetchAgents()
    const { data } = await api.get('/agents')
    return data
  },

  async create(payload) {
    if (USE_MOCK) return mockCreateAgent(payload)
    const { data } = await api.post('/agents', payload)
    return data
  },

  async update(agentId, changes) {
    if (USE_MOCK) return mockUpdateAgent(agentId, changes)
    const { data } = await api.patch(`/agents/${agentId}`, changes)
    return data
  },

  async deactivate(agentId) {
    if (USE_MOCK) return mockDeactivateAgent(agentId)
    const { data } = await api.post(`/agents/${agentId}/deactivate`)
    return data
  }
}

export default agentApi
