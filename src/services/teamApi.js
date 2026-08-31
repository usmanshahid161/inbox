import api from './api'

const baseUrl = 'http://localhost:3033'

// Backend contract (to be implemented):
// GET    /admin/teams           -> { data: Team[] }
// GET    /admin/teams/:id       -> { data: Team }
// POST   /admin/teams           -> { data: Team }   body: { name, description, agents: [agentId], queues: [queueId], groups: [groupId] }
// PUT    /admin/teams/:id       -> { data: Team }   body: same as create
// DELETE /admin/teams/:id       -> { data: { _id } }
const teamApi = {
  async list(params = {}) {
    const { data } = await api.get(`${baseUrl}/admin/teams`, { params })
    return data
  },

  async get(id) {
    const { data } = await api.get(`${baseUrl}/admin/teams/${id}`)
    return data
  },

  async create(payload) {
    const { data } = await api.post(`${baseUrl}/admin/teams`, payload)
    return data
  },

  async update(id, payload) {
    const { data } = await api.put(`${baseUrl}/admin/teams/${id}`, payload)
    return data
  },

  async remove(id) {
    const { data } = await api.delete(`${baseUrl}/admin/teams/${id}`)
    return data
  }
}

export default teamApi
