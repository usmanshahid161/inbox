import api from './api'
import config from '../config'

const baseUrl = `${config.BASE_HOST}:3033`

const templatesAPI = {
  async list(params = {}) {
    const { data } = await api.get(
      `${baseUrl}/templates`,
      { params }
    )
    return data
  },

  async get(id) {
    const { data } = await api.get(
      `${baseUrl}/templates/${id}`
    )
    return data
  },

  async create(payload) {
    const { data } = await api.post(
      `${baseUrl}/templates`,
      payload
    )
    return data
  },

  async update(id, payload) {
    const { data } = await api.put(
      `${baseUrl}/templates/${id}`,
      payload
    )
    return data
  },

  async remove(id) {
    const { data } = await api.delete(
      `${baseUrl}/templates/${id}`
    )
    return data
  },

  async submit(id) {
    const { data } = await api.post(
      `${baseUrl}/templates/${id}/submit`
    )
    return data
  },

  async sync() {
    const { data } = await api.post(
      `${baseUrl}/templates/sync`
    )
    return data
  }
}

export default templatesAPI