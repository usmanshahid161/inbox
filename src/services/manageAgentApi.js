import api from './api'
import config from '../config'

// This one talks to the AUTH service (not the port-3032 business service) —
// creating/editing an agent means creating login credentials, which only
// the auth service is allowed to touch. Port/env matches auth's server.js.
const baseUrl = `${config.BASE_HOST}:3034`

// Actual contract (implemented in the auth service):
// GET    /users                    -> { data: Agent[] }                body: -
// POST   /users/agents             -> { data: Agent }  body: { name, username, email, password, queues, teams, groups, channels }
// PUT    /users/agents/:id         -> { data: Agent }  body: { name, username, email, queues, teams, groups, channels }
// PUT    /users/agents/:id/password-> { data: { _id } } body: { password }
// DELETE /users/agents/:id         -> { data: { _id } }
const manageAgentApi = {
  async list(params = {}) {
    const { data } = await api.get(`${baseUrl}/users`, { params })
    return data
  },

  async get(id) {
    // No single-agent GET on the auth service yet — list and find client-side.
    const { data } = await api.get(`${baseUrl}/users`)
    return { success: true, data: data?.data?.find((a) => a._id === id) }
  },

  async create(payload) {
    const { data } = await api.post(`${baseUrl}/users/agents`, payload)
    return data
  },

  async update(id, payload) {
    const { data } = await api.put(`${baseUrl}/users/agents/${id}`, payload)
    return data
  },

  async updatePassword(id, password) {
    const { data } = await api.put(`${baseUrl}/users/agents/${id}/password`, { password })
    return data
  },

  async remove(id) {
    const { data } = await api.delete(`${baseUrl}/users/agents/${id}`)
    return data
  },

  // Self-service — the logged-in user changing their own password
  // (Settings > Security). Requires the current password, unlike
  // updatePassword above (an admin resetting someone else's).
  async changeMyPassword({ currentPassword, newPassword }) {
    const { data } = await api.put(`${baseUrl}/users/me/password`, { currentPassword, newPassword })
    return data
  }
}

export default manageAgentApi