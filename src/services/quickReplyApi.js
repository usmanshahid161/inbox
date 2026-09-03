import api from './api'
import config from '../config'

const baseUrl = `${config.BASE_HOST}:3033`

// GET    /admin/quick-replies       -> { data: QuickReply[] }
// GET    /admin/quick-replies/:id   -> { data: QuickReply }
// POST   /admin/quick-replies       -> { data: QuickReply }  body: { shortcut, title, message }
// PUT    /admin/quick-replies/:id   -> { data: QuickReply }  body: { shortcut, title, message }
// DELETE /admin/quick-replies/:id   -> { data: { _id } }
const quickReplyApi = {
  async list(params = {}) {
    const { data } = await api.get(`${baseUrl}/admin/quick-replies`, { params })
    return data
  },

  async create(payload) {
    const { data } = await api.post(`${baseUrl}/admin/quick-replies`, payload)
    return data
  },

  async update(id, payload) {
    const { data } = await api.put(`${baseUrl}/admin/quick-replies/${id}`, payload)
    return data
  },

  async remove(id) {
    const { data } = await api.delete(`${baseUrl}/admin/quick-replies/${id}`)
    return data
  }
}

export default quickReplyApi
