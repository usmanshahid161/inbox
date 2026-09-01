import api from './api'

const baseUrl = 'http://localhost:3036'

// GET    /contacts                              -> { data: Contact[] }   ?search=
// GET    /contacts/:id                           -> { data: Contact }
// POST   /contacts                               -> { data: Contact }    body: { name, phone, email, company, notes, tags, actorName }
// PUT    /contacts/:id                           -> { data: Contact }
// DELETE /contacts/:id                           -> { data: { _id } }
// GET    /contacts/:id/activity                  -> { data: ContactActivity[] }
// POST   /contacts/:id/interactions              -> { data: Contact }    body: { interactionId, channel, previousContactId, actorName }
// DELETE /contacts/:id/interactions/:interactionId -> { data: Contact }
const contactApi = {
  async list(params = {}) {
    const { data } = await api.get(`${baseUrl}/contacts`, { params })
    return data
  },

  async get(id) {
    const { data } = await api.get(`${baseUrl}/contacts/${id}`)
    return data
  },

  async create(payload) {
    const { data } = await api.post(`${baseUrl}/contacts`, payload)
    return data
  },

  async update(id, payload) {
    const { data } = await api.put(`${baseUrl}/contacts/${id}`, payload)
    return data
  },

  async remove(id) {
    const { data } = await api.delete(`${baseUrl}/contacts/${id}`)
    return data
  },

  async listActivity(id) {
    const { data } = await api.get(`${baseUrl}/contacts/${id}/activity`)
    return data
  },

  async assignInteraction(contactId, { interactionId, channel, previousContactId, actorName }) {
    const { data } = await api.post(`${baseUrl}/contacts/${contactId}/interactions`, {
      interactionId,
      channel,
      previousContactId,
      actorName
    })
    return data
  },

  async unassignInteraction(contactId, interactionId, { channel, actorName } = {}) {
    const { data } = await api.delete(`${baseUrl}/contacts/${contactId}/interactions/${interactionId}`, {
      params: { channel, actorName }
    })
    return data
  }
}

export default contactApi