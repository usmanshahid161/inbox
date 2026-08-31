import api from './api'

const baseUrl = 'http://localhost:3033'

// Backend contract (to be implemented):
// GET    /admin/groups          -> { data: Group[] }
// GET    /admin/groups/:id      -> { data: Group }
// POST   /admin/groups          -> { data: Group }          body: { name, description, agents: [agentId] }
// PUT    /admin/groups/:id      -> { data: Group }          body: { name, description, agents: [agentId] }
// DELETE /admin/groups/:id      -> { data: { _id } }
const groupApi = {
  async list(params = {}) {
    const { data } = await api.get(`${baseUrl}/admin/groups`, { params })
    return data
  },

  async get(id) {
    const { data } = await api.get(`${baseUrl}/admin/groups/${id}`)
    return data
  },

  async create(payload) {
    const { data } = await api.post(`${baseUrl}/admin/groups`, payload)
    return data
  },

  async update(id, payload) {
    const { data } = await api.put(`${baseUrl}/admin/groups/${id}`, payload)
    return data
  },

  async remove(id) {
    const { data } = await api.delete(`${baseUrl}/admin/groups/${id}`)
    return data
  }
}

export default groupApi
