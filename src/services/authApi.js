import api from './api'
import { mockLogin } from '../mocks/mockApi'
import axios         from 'axios';
import config from '../config'

// Flip VITE_USE_MOCK_API to "false" once the real backend is reachable.
// Every function below already has the real axios call in place; only the
// mock branch needs to be removed at that point.
const USE_MOCK = import.meta.env.VITE_USE_MOCK_API !== 'false'
const baseUrl = `${config.BASE_HOST}:3034`

const authApi = {
  async login(credentials) {
    if (USE_MOCK) return mockLogin(credentials)
    const { data } = await axios.post(`${baseUrl}/auth/login`, credentials)
    return data
  },

  async me() {
    if (USE_MOCK) throw new Error('mockFetchCurrentUser is not implemented; login returns the full session.')
    const { data } = await api.get('/auth/me')
    return data
  }
}

export default authApi
