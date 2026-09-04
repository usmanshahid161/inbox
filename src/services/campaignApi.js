import api from './api'
import config from '../config'

const baseUrl = `${config.BASE_HOST}:3038`

const campaignApi = {
  // ---- Contact lists ----
  async listContactLists() {
    const { data } = await api.get(`${baseUrl}/contact-lists`)
    return data.data
  },
  async createContactList(payload) {
    const { data } = await api.post(`${baseUrl}/contact-lists`, payload)
    return data.data
  },
  async updateContactList(id, payload) {
    const { data } = await api.put(`${baseUrl}/contact-lists/${id}`, payload)
    return data.data
  },
  async deleteContactList(id) {
    const { data } = await api.delete(`${baseUrl}/contact-lists/${id}`)
    return data.data
  },
  async listContacts(listId, params = {}) {
    const { data } = await api.get(`${baseUrl}/contact-lists/${listId}/contacts`, { params })
    return data.data
  },
  async addContact(listId, payload) {
    const { data } = await api.post(`${baseUrl}/contact-lists/${listId}/contacts`, payload)
    return data.data
  },
  async removeContact(listId, entryId) {
    const { data } = await api.delete(`${baseUrl}/contact-lists/${listId}/contacts/${entryId}`)
    return data.data
  },
  async importCsv(listId, file) {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await api.post(`${baseUrl}/contact-lists/${listId}/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data.data
  },
  async getListCoverage(listId, columnNames) {
    const { data } = await api.get(`${baseUrl}/contact-lists/${listId}/coverage`, { params: { columns: columnNames.join(',') } })
    return data.data
  },

  // ---- Campaigns ----
  async listCampaigns() {
    const { data } = await api.get(`${baseUrl}/campaigns`)
    return data.data
  },
  async getCampaign(id) {
    const { data } = await api.get(`${baseUrl}/campaigns/${id}`)
    return data.data
  },
  async createCampaign(payload) {
    const { data } = await api.post(`${baseUrl}/campaigns`, payload)
    return data.data
  },
  async updateCampaign(id, payload) {
    const { data } = await api.put(`${baseUrl}/campaigns/${id}`, payload)
    return data.data
  },
  async scheduleCampaign(id) {
    const { data } = await api.post(`${baseUrl}/campaigns/${id}/schedule`)
    return data.data
  },
  async sendTest(id, payload) {
    const { data } = await api.post(`${baseUrl}/campaigns/${id}/test`, payload)
    return data.data
  },
  async pauseCampaign(id) {
    const { data } = await api.post(`${baseUrl}/campaigns/${id}/pause`)
    return data.data
  },
  async resumeCampaign(id) {
    const { data } = await api.post(`${baseUrl}/campaigns/${id}/resume`)
    return data.data
  },
  async cancelCampaign(id) {
    const { data } = await api.post(`${baseUrl}/campaigns/${id}/cancel`)
    return data.data
  },
  async deleteCampaign(id) {
    const { data } = await api.delete(`${baseUrl}/campaigns/${id}`)
    return data.data
  },
  async getStats(id) {
    const { data } = await api.get(`${baseUrl}/campaigns/${id}/stats`)
    return data.data
  },
  async listRecipients(id, params = {}) {
    const { data } = await api.get(`${baseUrl}/campaigns/${id}/recipients`, { params })
    return data.data
  },

  // ---- Opt-outs ----
  async listOptOuts() {
    const { data } = await api.get(`${baseUrl}/opt-outs`)
    return data.data
  },
  async addOptOut(phone) {
    const { data } = await api.post(`${baseUrl}/opt-outs`, { phone })
    return data.data
  },
  async removeOptOut(phone) {
    const { data } = await api.delete(`${baseUrl}/opt-outs/${phone}`)
    return data.data
  }
}

export default campaignApi
