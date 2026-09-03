import api from './api'
import config from '../config'

const baseUrl = `${config.BASE_HOST}:3033`

// Backend contract (to be implemented):
// GET    /admin/tags            -> { data: Tag[] }
// GET    /admin/tags/:id        -> { data: Tag }
// POST   /admin/tags            -> { data: Tag }            body: { name, color, description }
// PUT    /admin/tags/:id        -> { data: Tag }            body: { name, color, description }
// DELETE /admin/tags/:id        -> { data: { _id } }
const tagApi = {
  async list(params = {}) {
    const { data } = await api.get(`${baseUrl}/admin/tags`, { params })
    return data
  },

  async get(id) {
    const { data } = await api.get(`${baseUrl}/admin/tags/${id}`)
    return data
  },

  async create(payload) {
    const { data } = await api.post(`${baseUrl}/admin/tags`, payload)
    return data
  },

  async update(id, payload) {
    const { data } = await api.put(`${baseUrl}/admin/tags/${id}`, payload)
    return data
  },

  async remove(id) {
    const { data } = await api.delete(`${baseUrl}/admin/tags/${id}`)
    return data
  }
}

export default tagApi
