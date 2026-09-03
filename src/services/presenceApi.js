import api from './api'
import config from '../config'

const baseUrl = `${config.BASE_HOST}:3035`

const presenceApi = {
  async heartbeat() {
    const { data } = await api.post(`${baseUrl}/presence/heartbeat`)
    return data
  },
  async goOffline() {
    const { data } = await api.post(`${baseUrl}/presence/offline`)
    return data
  },
  async list(agentIds) {
    const { data } = await api.get(`${baseUrl}/presence`, { params: { agentIds: agentIds.join(',') } })
    return data
  },
  async myActiveBreaks() {
    const { data } = await api.get(`${baseUrl}/presence/breaks/mine`)
    return data
  },
  async startBreak(payload) {
    const { data } = await api.post(`${baseUrl}/presence/breaks`, payload)
    return data
  },
  async endBreak(id) {
    const { data } = await api.delete(`${baseUrl}/presence/breaks/${id}`)
    return data
  }
}

export default presenceApi
