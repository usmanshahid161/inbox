import api from './api'
import config from '../config'

const baseUrl = `${config.BASE_HOST}:3033`

// Backend contract (to be implemented):
// GET    /admin/channels/whatsapp/numbers               -> { data: WhatsAppNumber[] }
// POST   /admin/channels/whatsapp/numbers                -> { data: WhatsAppNumber }  body: { phoneNumber, displayName }
// PUT    /admin/channels/whatsapp/numbers/:id/assignment -> { data: WhatsAppNumber }  body: { queues: [queueId], flow: flowId | null }
// POST   /admin/channels/whatsapp/numbers/:id/subscribe  -> { data: WhatsAppNumber }  triggers the Meta webhook subscription for this number
// DELETE /admin/channels/whatsapp/numbers/:id            -> { data: { _id } }
const whatsappChannelApi = {
  async list(params = {}) {
    const { data } = await api.get(`${baseUrl}/admin/channels/whatsapp/numbers`, { params })
    return data
  },

  async create(payload) {
    const { data } = await api.post(`${baseUrl}/admin/channels/whatsapp/numbers`, payload)
    return data
  },

  async updateAssignment(id, payload) {
    const { data } = await api.put(`${baseUrl}/admin/channels/whatsapp/numbers/${id}/assignment`, payload)
    return data
  },

  async subscribe(id) {
    const { data } = await api.post(`${baseUrl}/admin/channels/whatsapp/numbers/${id}/subscribe`)
    return data
  },

  async unsubscribe(id) {
    const { data } = await api.post(`${baseUrl}/admin/channels/whatsapp/numbers/${id}/unsubscribe`)
    return data
  },

  async remove(id) {
    const { data } = await api.delete(`${baseUrl}/admin/channels/whatsapp/numbers/${id}`)
    return data
  },

  // Completes Meta's Embedded Signup flow — exchanges the OAuth `code`
  // for an access token server-side (needs the app secret, never sent to
  // the browser) and saves the tenant's real WhatsApp credentials.
  async completeEmbeddedSignup({ code, wabaId, phoneNumberId }) {
    const { data } = await api.post(`${baseUrl}/admin/channels/whatsapp/numbers/embedded-signup`, {
      code,
      wabaId,
      phoneNumberId
    })
    return data
  }
}

export default whatsappChannelApi