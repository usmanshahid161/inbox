import api from './api'
import config from '../config'

const baseUrl = `${config.BASE_HOST}:3033`

// Backend contract (to be implemented):
// GET    /admin/queues          -> { data: Queue[] }
// GET    /admin/queues/:id      -> { data: Queue }
// POST   /admin/queues          -> { data: Queue }          body: { name, description }
// PUT    /admin/queues/:id      -> { data: Queue }          body: { name, description }
// DELETE /admin/queues/:id      -> { data: { _id } }
const queueApi = {
  async list(params = {}) {
    const { data } = await api.get(`${baseUrl}/admin/queues`, { params })
    return data
  },

  async get(id) {
    const { data } = await api.get(`${baseUrl}/admin/queues/${id}`)
    return data
  },

  async create(payload) {
    const { data } = await api.post(`${baseUrl}/admin/queues`, payload)
    return data
  },

  async update(id, payload) {
    const { data } = await api.put(`${baseUrl}/admin/queues/${id}`, payload)
    return data
  },

  async remove(id) {
    const { data } = await api.delete(`${baseUrl}/admin/queues/${id}`)
    return data
  }
}

export default queueApi
