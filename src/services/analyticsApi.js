import api from './api'
import { mockFetchAnalytics } from '../mocks/mockApi'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API !== 'false'

const analyticsApi = {
  async summary() {
    if (USE_MOCK) return mockFetchAnalytics()
    const { data } = await api.get('/analytics/summary')
    return data
  }
}

export default analyticsApi
