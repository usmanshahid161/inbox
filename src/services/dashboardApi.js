import api from './api'

const baseUrl = 'http://localhost:3037'

const dashboardApi = {
  async get(filters) {
    const { data } = await api.get(`${baseUrl}/dashboard`, { params: filters })
    return data
  },

  async getUnassigned(filters) {
    const { data } = await api.get(`${baseUrl}/dashboard/unassigned`, { params: filters })
    return data
  }
}

export default dashboardApi