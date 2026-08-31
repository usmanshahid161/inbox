import api from './api'
import { mockFetchContacts } from '../mocks/mockApi'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API !== 'false'

const contactApi = {
  async list(params) {
    if (USE_MOCK) return mockFetchContacts(params)
    const { data } = await api.get('/contacts', { params })
    return data
  }
}

export default contactApi
