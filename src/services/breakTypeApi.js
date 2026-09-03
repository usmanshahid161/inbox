import api from './api'
import config from '../config'

const baseUrl = `${config.BASE_HOST}:3035`

const breakTypeApi = {
  async list() {
    const { data } = await api.get(`${baseUrl}/admin/break-types`)
    return data
  },
  async create(payload) {
    const { data } = await api.post(`${baseUrl}/admin/break-types`, payload)
    return data
  },
  async update(id, payload) {
    const { data } = await api.put(`${baseUrl}/admin/break-types/${id}`, payload)
    return data
  },
  async remove(id) {
    const { data } = await api.delete(`${baseUrl}/admin/break-types/${id}`)
    return data
  }
}

export default breakTypeApi
