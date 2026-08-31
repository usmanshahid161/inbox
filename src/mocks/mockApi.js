// In-memory mock backend. Every function resolves after a small simulated
// delay so loading states behave the same as they will against the real API.
// Nothing here is imported once a real backend is wired up — each
// services/*Api.js file simply stops calling into this module.

import {
  MOCK_AGENTS,
  MOCK_ANALYTICS,
  MOCK_CHANNELS,
  MOCK_CONTACTS,
  MOCK_INTERACTIONS,
  MOCK_MESSAGES,
  MOCK_TENANT,
  MOCK_USER
} from './mockData'
import { AGENT_STATUS } from '../utils/constants'

const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms))

// Mutable in-memory copies so create/update actions persist for the session.
let agents = MOCK_AGENTS.map((a) => ({ ...a }))
let channels = MOCK_CHANNELS.map((c) => ({ ...c }))
let contacts = MOCK_CONTACTS.map((c) => ({ ...c }))
let interactions = MOCK_INTERACTIONS.map((i) => ({ ...i }))
let messagesByInteraction = Object.fromEntries(
  Object.entries(MOCK_MESSAGES).map(([id, msgs]) => [id, msgs.map((m) => ({ ...m }))])
)

let idCounter = 1000
const nextId = (prefix) => `${prefix}_${idCounter++}`

export async function mockLogin({ email, password }) {
  await delay(500)
  if (!email || !password) {
    const err = new Error('Email and password are required.')
    err.response = { data: { message: 'Email and password are required.' } }
    throw err
  }
  // Any credentials succeed in mock mode so reviewers can explore freely.
  return {
    token: `mock-jwt-${Date.now()}`,
    user: MOCK_USER,
    tenant: MOCK_TENANT,
    channels
  }
}

export async function mockFetchInteractions(params = {}) {
  await delay()
  let results = [...interactions]
  if (params.status && params.status !== 'ALL') {
    results = results.filter((i) => i.status === params.status)
  }
  if (params.assignedTo === 'me' && params.currentUserId) {
    results = results.filter((i) => i.assignedAgent?.id === params.currentUserId)
  }
  if (params.unassigned) {
    results = results.filter((i) => !i.assignedAgent)
  }
  if (params.unreadOnly) {
    results = results.filter((i) => i.unreadCount > 0)
  }
  if (params.search) {
    const q = params.search.toLowerCase()
    results = results.filter((i) => i.caller.name.toLowerCase().includes(q))
  }
  results.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  return results
}

export async function mockFetchMessages(interactionId) {
  await delay(250)
  return messagesByInteraction[interactionId] || []
}

export async function mockSendMessage({ interactionId, message, messageType = 'TEXT', attachments = [], author }) {
  await delay(400)
  const newMessage = {
    id: nextId('m'),
    interactionId,
    message,
    messageType,
    direction: 'OUTBOUND',
    author,
    attachments,
    status: 'SENT',
    createdAt: new Date().toISOString()
  }
  messagesByInteraction[interactionId] = [...(messagesByInteraction[interactionId] || []), newMessage]
  interactions = interactions.map((i) =>
    i.id === interactionId
      ? { ...i, lastMessage: { message, createdAt: newMessage.createdAt, direction: 'OUTBOUND' }, updatedAt: newMessage.createdAt }
      : i
  )
  return newMessage
}

export async function mockUpdateInteraction(interactionId, changes) {
  await delay(250)
  interactions = interactions.map((i) => (i.id === interactionId ? { ...i, ...changes } : i))
  return interactions.find((i) => i.id === interactionId)
}

export async function mockFetchChannels() {
  await delay(250)
  return channels
}

export async function mockToggleChannel(channelId, enabled) {
  await delay(250)
  channels = channels.map((c) => (c.id === channelId ? { ...c, enabled, status: enabled ? 'CONNECTED' : 'DISCONNECTED' } : c))
  return channels.find((c) => c.id === channelId)
}

export async function mockFetchAgents() {
  await delay(300)
  return agents
}

export async function mockCreateAgent(payload) {
  await delay(400)
  const agent = {
    id: nextId('user_agent'),
    status: AGENT_STATUS.OFFLINE,
    assignedChannels: [],
    avatarColor: '#1c7c70',
    ...payload
  }
  agents = [...agents, agent]
  return agent
}

export async function mockUpdateAgent(agentId, changes) {
  await delay(300)
  agents = agents.map((a) => (a.id === agentId ? { ...a, ...changes } : a))
  return agents.find((a) => a.id === agentId)
}

export async function mockDeactivateAgent(agentId) {
  await delay(300)
  agents = agents.map((a) => (a.id === agentId ? { ...a, status: AGENT_STATUS.OFFLINE, deactivated: true } : a))
  return agents.find((a) => a.id === agentId)
}

export async function mockFetchContacts(params = {}) {
  await delay(300)
  let results = [...contacts]
  if (params.search) {
    const q = params.search.toLowerCase()
    results = results.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q)
    )
  }
  if (params.channel && params.channel !== 'ALL') {
    results = results.filter((c) => c.channel === params.channel)
  }
  const page = params.page || 1
  const pageSize = params.pageSize || 10
  const start = (page - 1) * pageSize
  return {
    items: results.slice(start, start + pageSize),
    total: results.length,
    page,
    pageSize
  }
}

export async function mockFetchAnalytics() {
  await delay(300)
  return MOCK_ANALYTICS
}
