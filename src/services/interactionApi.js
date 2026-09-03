import api                                              from './api'
import { mockFetchInteractions, mockUpdateInteraction } from '../mocks/mockApi'
import config from '../config'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API !== 'false'
const baseUrl = `${config.BASE_HOST}:3032`

const interactionApi = {
  async list(params) {
    if (USE_MOCK) return mockFetchInteractions(params)

    const { data } = await api.get(`${baseUrl}/interactions`, { params })
    return data
  },

  async get(interactionId) {
    if (USE_MOCK) {
      return (await mockFetchInteractions()).find(
        (i) => i.id === interactionId
      )
    }

    const { data } = await api.get(
      `${baseUrl}/interactions/${interactionId}`
    )
    return data
  },

  async update(interactionId, changes) {
    if (USE_MOCK) {
      return mockUpdateInteraction(interactionId, changes)
    }

    const { data } = await api.patch(
      `${baseUrl}/interactions/${interactionId}`,
      changes
    )
    return data
  },

  async assign(interactionId, agentId) {
    if (USE_MOCK) {
      return mockUpdateInteraction(interactionId, {
        assignedAgent: { id: agentId }
      })
    }

    const { data } = await api.post(
      `${baseUrl}/interactions/${interactionId}/assign`,
      { agentId }
    )
    return data
  },

  async interactionActions(interactionId, body) {

    const { data } = await api.patch(
      `${baseUrl}/interactions/${interactionId}`,
      { ...body }
    )
    return data
  },

  async addNote(interactionId, note) {
    const { data } = await api.post(
      `${baseUrl}/interactions/${interactionId}/notes`,
      { ...note }
    )
    return data
  },

  async updateNote(note) {
    const { data } = await api.put(
      `${baseUrl}/interactions/${note.interactionId}/notes/${note?.id}`,
      { text: note?.text }
    )
    return data
  },

  async deleteNote(interactionId, noteId) {
    const { data } = await api.delete(
      `${baseUrl}/interactions/${interactionId}/notes/${noteId}`
    )
    return data
  },

  async addWorkCode(interactionId, workCode) {
    const { data } = await api.post(
      `${baseUrl}/interactions/${interactionId}/workCode`,
      { ...workCode }
    )
    return data
  },

  async deleteWorkCode(interactionId, id) {
    const { data } = await api.delete(
      `${baseUrl}/interactions/${interactionId}/workCode/${id}`
    )
    return data
  },

  async close(interactionId) {
    if (USE_MOCK) {
      return mockUpdateInteraction(interactionId, {
        status: 'CLOSED'
      })
    }

    const { data } = await api.post(
      `${baseUrl}/interactions/${interactionId}/close`
    )
    return data
  },

  async reopen(interactionId) {
    if (USE_MOCK) {
      return mockUpdateInteraction(interactionId, {
        status: 'OPEN'
      })
    }

    const { data } = await api.post(
      `${baseUrl}/interactions/${interactionId}/reopen`
    )
    return data
  },

  async markRead(interactionId, agentId) {
    if (USE_MOCK) {
      return mockUpdateInteraction(interactionId, {
        unreadCount: 0
      })
    }

    const { data } = await api.post(
      `${baseUrl}/interactions/${interactionId}/read`, {
        agentId
      }
    )
    return data
  }
}

export default interactionApi