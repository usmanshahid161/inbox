// Realistic mock data used only while VITE_USE_MOCK_API is enabled (the default).
// Shapes here mirror what the real backend is expected to return — see each
// services/*Api.js file for the corresponding real endpoint calls.

import { CHANNEL_TYPE, INTERACTION_STATUS, MESSAGE_DIRECTION, MESSAGE_STATUS, MESSAGE_TYPE, ROLES, AGENT_STATUS } from '../utils/constants'

export const MOCK_TENANT = {
  id: 'tenant_9f21',
  name: 'Northwind Outfitters',
  domain: 'northwind.support',
  plan: 'Growth',
  timezone: 'America/Chicago',
  createdAt: '2023-02-11T09:00:00Z'
}

export const MOCK_USER = {
  id: 'user_admin_01',
  name: 'Priya Kapoor',
  email: 'priya@northwind.support',
  role: ROLES.ADMIN,
  tenantId: MOCK_TENANT.id,
  avatarColor: '#279a89'
}

export const MOCK_CHANNELS = [
  {
    id: 'chan_wa_1',
    type: CHANNEL_TYPE.WHATSAPP,
    name: 'WhatsApp — Support Line',
    identifier: '+1 (312) 555-0148',
    enabled: true,
    status: 'CONNECTED',
    connectedAt: '2023-03-01T12:00:00Z'
  },
  {
    id: 'chan_ig_1',
    type: CHANNEL_TYPE.INSTAGRAM,
    name: 'Instagram — @northwindgear',
    identifier: '@northwindgear',
    enabled: true,
    status: 'CONNECTED',
    connectedAt: '2023-04-18T12:00:00Z'
  },
  {
    id: 'chan_fb_1',
    type: CHANNEL_TYPE.MESSENGER,
    name: 'Messenger — Northwind Outfitters',
    identifier: 'northwindoutfitters',
    enabled: true,
    status: 'CONNECTED',
    connectedAt: '2023-04-18T12:05:00Z'
  },
  {
    id: 'chan_tt_1',
    type: CHANNEL_TYPE.TIKTOK,
    name: 'TikTok — @northwindgear',
    identifier: '@northwindgear',
    enabled: false,
    status: 'DISCONNECTED',
    connectedAt: null
  }
]

export const MOCK_AGENTS = [
  {
    id: 'user_admin_01',
    name: 'Priya Kapoor',
    email: 'priya@northwind.support',
    role: ROLES.ADMIN,
    status: AGENT_STATUS.ONLINE,
    assignedChannels: ['chan_wa_1', 'chan_ig_1', 'chan_fb_1'],
    avatarColor: '#279a89'
  },
  {
    id: 'user_agent_02',
    name: 'Marcus Lee',
    email: 'marcus@northwind.support',
    role: ROLES.AGENT,
    status: AGENT_STATUS.ONLINE,
    assignedChannels: ['chan_wa_1'],
    avatarColor: '#e8541c'
  },
  {
    id: 'user_agent_03',
    name: 'Sofia Alvarez',
    email: 'sofia@northwind.support',
    role: ROLES.AGENT,
    status: AGENT_STATUS.AWAY,
    assignedChannels: ['chan_ig_1', 'chan_fb_1'],
    avatarColor: '#6f6a59'
  },
  {
    id: 'user_agent_04',
    name: 'Devon Brooks',
    email: 'devon@northwind.support',
    role: ROLES.AGENT,
    status: AGENT_STATUS.OFFLINE,
    assignedChannels: ['chan_wa_1', 'chan_fb_1'],
    avatarColor: '#1c7c70'
  }
]

export const MOCK_CONTACTS = [
  {
    id: 'contact_1',
    name: 'Elena Marsh',
    phone: '+1 312 555 0102',
    email: 'elena.marsh@gmail.com',
    channel: CHANNEL_TYPE.WHATSAPP,
    lastInteractionAt: '2026-08-11T14:22:00Z',
    tags: ['VIP', 'Repeat customer']
  },
  {
    id: 'contact_2',
    name: 'Jordan Whitfield',
    phone: '+1 646 555 0177',
    email: 'jwhitfield@outlook.com',
    channel: CHANNEL_TYPE.INSTAGRAM,
    lastInteractionAt: '2026-08-11T13:05:00Z',
    tags: ['Shipping issue']
  },
  {
    id: 'contact_3',
    name: 'Priya Nair',
    phone: '+1 213 555 0134',
    email: 'priya.nair@yahoo.com',
    channel: CHANNEL_TYPE.MESSENGER,
    lastInteractionAt: '2026-08-11T11:40:00Z',
    tags: []
  },
  {
    id: 'contact_4',
    name: 'Tom Baxter',
    phone: '+1 415 555 0190',
    email: 'tbaxter@proton.me',
    channel: CHANNEL_TYPE.WHATSAPP,
    lastInteractionAt: '2026-08-10T18:12:00Z',
    tags: ['Refund']
  },
  {
    id: 'contact_5',
    name: 'Grace Kim',
    phone: '+1 917 555 0121',
    email: 'grace.kim@icloud.com',
    channel: CHANNEL_TYPE.INSTAGRAM,
    lastInteractionAt: '2026-08-10T09:30:00Z',
    tags: ['New customer']
  },
  {
    id: 'contact_6',
    name: 'Marcus Webb',
    phone: '+1 305 555 0166',
    email: 'mwebb@webbdesign.co',
    channel: CHANNEL_TYPE.MESSENGER,
    lastInteractionAt: '2026-08-09T16:02:00Z',
    tags: []
  }
]

const now = new Date('2026-08-11T14:30:00Z')
const minutesAgo = (m) => new Date(now.getTime() - m * 60000).toISOString()

export const MOCK_INTERACTIONS = [
  {
    id: 'itx_1',
    tenantId: MOCK_TENANT.id,
    channel: CHANNEL_TYPE.WHATSAPP,
    caller: { id: 'contact_1', name: 'Elena Marsh', phone: '+1 312 555 0102', online: true },
    status: INTERACTION_STATUS.OPEN,
    assignedAgent: MOCK_AGENTS[0],
    lastMessage: { message: 'Perfect, thank you for the quick help!', createdAt: minutesAgo(8), direction: MESSAGE_DIRECTION.INBOUND },
    unreadCount: 2,
    updatedAt: minutesAgo(8)
  },
  {
    id: 'itx_2',
    tenantId: MOCK_TENANT.id,
    channel: CHANNEL_TYPE.INSTAGRAM,
    caller: { id: 'contact_2', name: 'Jordan Whitfield', phone: '+1 646 555 0177', online: false },
    status: INTERACTION_STATUS.OPEN,
    assignedAgent: MOCK_AGENTS[2],
    lastMessage: { message: 'My package says delivered but I never got it.', createdAt: minutesAgo(85), direction: MESSAGE_DIRECTION.INBOUND },
    unreadCount: 1,
    updatedAt: minutesAgo(85)
  },
  {
    id: 'itx_3',
    tenantId: MOCK_TENANT.id,
    channel: CHANNEL_TYPE.MESSENGER,
    caller: { id: 'contact_3', name: 'Priya Nair', phone: '+1 213 555 0134', online: true },
    status: INTERACTION_STATUS.PENDING,
    assignedAgent: null,
    lastMessage: { message: 'Do you have this in size M?', createdAt: minutesAgo(170), direction: MESSAGE_DIRECTION.INBOUND },
    unreadCount: 0,
    updatedAt: minutesAgo(170)
  },
  {
    id: 'itx_4',
    tenantId: MOCK_TENANT.id,
    channel: CHANNEL_TYPE.WHATSAPP,
    caller: { id: 'contact_4', name: 'Tom Baxter', phone: '+1 415 555 0190', online: false },
    status: INTERACTION_STATUS.CLOSED,
    assignedAgent: MOCK_AGENTS[1],
    lastMessage: { message: "Great, refund is processed. Have a good one!", createdAt: minutesAgo(1400), direction: MESSAGE_DIRECTION.OUTBOUND },
    unreadCount: 0,
    updatedAt: minutesAgo(1400)
  },
  {
    id: 'itx_5',
    tenantId: MOCK_TENANT.id,
    channel: CHANNEL_TYPE.INSTAGRAM,
    caller: { id: 'contact_5', name: 'Grace Kim', phone: '+1 917 555 0121', online: true },
    status: INTERACTION_STATUS.OPEN,
    assignedAgent: MOCK_AGENTS[0],
    lastMessage: { message: 'Sending a photo of the defect now', createdAt: minutesAgo(240), direction: MESSAGE_DIRECTION.INBOUND },
    unreadCount: 0,
    updatedAt: minutesAgo(240)
  },
  {
    id: 'itx_6',
    tenantId: MOCK_TENANT.id,
    channel: CHANNEL_TYPE.MESSENGER,
    caller: { id: 'contact_6', name: 'Marcus Webb', phone: '+1 305 555 0166', online: false },
    status: INTERACTION_STATUS.OPEN,
    assignedAgent: MOCK_AGENTS[3],
    lastMessage: { message: 'Any update on my order #4471?', createdAt: minutesAgo(610), direction: MESSAGE_DIRECTION.INBOUND },
    unreadCount: 3,
    updatedAt: minutesAgo(610)
  }
]

export const MOCK_MESSAGES = {
  itx_1: [
    { id: 'm1', interactionId: 'itx_1', message: 'Hi! I ordered the trail jacket last week and wanted to check on shipping.', messageType: MESSAGE_TYPE.TEXT, direction: MESSAGE_DIRECTION.INBOUND, author: { id: 'contact_1', name: 'Elena Marsh' }, attachments: [], status: MESSAGE_STATUS.READ, createdAt: minutesAgo(40) },
    { id: 'm2', interactionId: 'itx_1', message: 'Hi Elena, happy to check that for you — one moment.', messageType: MESSAGE_TYPE.TEXT, direction: MESSAGE_DIRECTION.OUTBOUND, author: { id: 'user_admin_01', name: 'Priya Kapoor' }, attachments: [], status: MESSAGE_STATUS.READ, createdAt: minutesAgo(38) },
    { id: 'm3', interactionId: 'itx_1', message: 'Your order shipped this morning via FedEx, tracking below.', messageType: MESSAGE_TYPE.TEXT, direction: MESSAGE_DIRECTION.OUTBOUND, author: { id: 'user_admin_01', name: 'Priya Kapoor' }, attachments: [], status: MESSAGE_STATUS.READ, createdAt: minutesAgo(37) },
    { id: 'm4', interactionId: 'itx_1', message: 'tracking-image.png', messageType: MESSAGE_TYPE.IMAGE, direction: MESSAGE_DIRECTION.OUTBOUND, author: { id: 'user_admin_01', name: 'Priya Kapoor' }, attachments: [{ id: 'a1', type: MESSAGE_TYPE.IMAGE, url: 'https://images.unsplash.com/photo-1586880244406-556ebe35f282?w=480&q=80', name: 'tracking-image.png', size: 182300 }], status: MESSAGE_STATUS.READ, createdAt: minutesAgo(36) },
    { id: 'm5', interactionId: 'itx_1', message: 'Perfect, thank you for the quick help!', messageType: MESSAGE_TYPE.TEXT, direction: MESSAGE_DIRECTION.INBOUND, author: { id: 'contact_1', name: 'Elena Marsh' }, attachments: [], status: MESSAGE_STATUS.DELIVERED, createdAt: minutesAgo(8) }
  ],
  itx_2: [
    { id: 'm6', interactionId: 'itx_2', message: 'My package says delivered but I never got it.', messageType: MESSAGE_TYPE.TEXT, direction: MESSAGE_DIRECTION.INBOUND, author: { id: 'contact_2', name: 'Jordan Whitfield' }, attachments: [], status: MESSAGE_STATUS.DELIVERED, createdAt: minutesAgo(85) }
  ],
  itx_3: [
    { id: 'm7', interactionId: 'itx_3', message: 'Do you have this in size M?', messageType: MESSAGE_TYPE.TEXT, direction: MESSAGE_DIRECTION.INBOUND, author: { id: 'contact_3', name: 'Priya Nair' }, attachments: [], status: MESSAGE_STATUS.READ, createdAt: minutesAgo(170) }
  ],
  itx_4: [
    { id: 'm8', interactionId: 'itx_4', message: 'I would like to return this order, it did not fit.', messageType: MESSAGE_TYPE.TEXT, direction: MESSAGE_DIRECTION.INBOUND, author: { id: 'contact_4', name: 'Tom Baxter' }, attachments: [], status: MESSAGE_STATUS.READ, createdAt: minutesAgo(1420) },
    { id: 'm9', interactionId: 'itx_4', message: "Great, refund is processed. Have a good one!", messageType: MESSAGE_TYPE.TEXT, direction: MESSAGE_DIRECTION.OUTBOUND, author: { id: 'user_agent_02', name: 'Marcus Lee' }, attachments: [], status: MESSAGE_STATUS.READ, createdAt: minutesAgo(1400) }
  ],
  itx_5: [
    { id: 'm10', interactionId: 'itx_5', message: 'The stitching came apart after one wash.', messageType: MESSAGE_TYPE.TEXT, direction: MESSAGE_DIRECTION.INBOUND, author: { id: 'contact_5', name: 'Grace Kim' }, attachments: [], status: MESSAGE_STATUS.READ, createdAt: minutesAgo(242) },
    { id: 'm11', interactionId: 'itx_5', message: 'Sending a photo of the defect now', messageType: MESSAGE_TYPE.TEXT, direction: MESSAGE_DIRECTION.INBOUND, author: { id: 'contact_5', name: 'Grace Kim' }, attachments: [], status: MESSAGE_STATUS.DELIVERED, createdAt: minutesAgo(240) }
  ],
  itx_6: [
    { id: 'm12', interactionId: 'itx_6', message: 'Any update on my order #4471?', messageType: MESSAGE_TYPE.TEXT, direction: MESSAGE_DIRECTION.INBOUND, author: { id: 'contact_6', name: 'Marcus Webb' }, attachments: [], status: MESSAGE_STATUS.DELIVERED, createdAt: minutesAgo(610) }
  ]
}

export const MOCK_ANALYTICS = {
  totalConversations: MOCK_INTERACTIONS.length,
  openConversations: MOCK_INTERACTIONS.filter((i) => i.status === INTERACTION_STATUS.OPEN).length,
  closedConversations: MOCK_INTERACTIONS.filter((i) => i.status === INTERACTION_STATUS.CLOSED).length,
  unreadMessages: MOCK_INTERACTIONS.reduce((sum, i) => sum + i.unreadCount, 0),
  activeAgents: MOCK_AGENTS.filter((a) => a.status === AGENT_STATUS.ONLINE).length,
  messagesToday: 47,
  volumeByDay: [
    { day: 'Mon', count: 32 },
    { day: 'Tue', count: 41 },
    { day: 'Wed', count: 28 },
    { day: 'Thu', count: 53 },
    { day: 'Fri', count: 47 },
    { day: 'Sat', count: 19 },
    { day: 'Sun', count: 12 }
  ],
  channelBreakdown: [
    { channel: CHANNEL_TYPE.WHATSAPP, count: 58 },
    { channel: CHANNEL_TYPE.INSTAGRAM, count: 34 },
    { channel: CHANNEL_TYPE.MESSENGER, count: 22 },
    { channel: CHANNEL_TYPE.TIKTOK, count: 4 }
  ]
}
