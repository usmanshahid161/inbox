// Central place for enum-like values shared across the app.
// Plain objects rather than TS enums, per the JS-only requirement.

export const ROLES = {
  ADMIN: 'ADMIN',
  AGENT: 'AGENT'
}

export const INTERACTION_STATUS = {
  OPEN: 'OPEN',
  PENDING: 'PENDING',
  CLOSED: 'CLOSED'
}

export const MESSAGE_DIRECTION = {
  INBOUND: 'INBOUND', // from customer
  OUTBOUND: 'OUTBOUND' // from agent
}

export const MESSAGE_STATUS = {
  SENDING: 'SENDING',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  READ: 'READ',
  FAILED: 'FAILED'
}

export const MESSAGE_TYPE = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  AUDIO: 'AUDIO',
  DOCUMENT: 'DOCUMENT',
  LINK: 'LINK',
  LOCATION: 'LOCATION',
  CONTACT: 'CONTACT'
}

export const CHANNEL_TYPE = {
  WHATSAPP: 'WHATSAPP',
  INSTAGRAM: 'INSTAGRAM',
  MESSENGER: 'MESSENGER',
  TIKTOK: 'TIKTOK'
}

export const CHANNEL_LABELS = {
  [CHANNEL_TYPE.WHATSAPP]: 'WhatsApp',
  [CHANNEL_TYPE.INSTAGRAM]: 'Instagram',
  [CHANNEL_TYPE.MESSENGER]: 'Messenger',
  [CHANNEL_TYPE.TIKTOK]: 'TikTok'
}

export const AGENT_STATUS = {
  ONLINE: 'ONLINE',
  AWAY: 'AWAY',
  OFFLINE: 'OFFLINE'
}

export const INBOX_FILTERS = {
  ALL: 'ALL',
  UNASSIGNED: 'UNASSIGNED',
  ASSIGNED_TO_ME: 'ASSIGNED_TO_ME',
  UNREAD: 'UNREAD',
  OPEN: 'OPEN',
  CLOSED: 'CLOSED'
}

// Preset swatches for the Tags module's color picker.
export const TAG_COLORS = [
  '#e8541c', '#d64545', '#c2410c', '#b45309', '#a16207',
  '#4d7c0f', '#15803d', '#0f766e', '#0e7490', '#1d4ed8',
  '#4338ca', '#7e22ce', '#a21caf', '#be185d', '#57534e'
]

export const FILE_RULES = {
  [MESSAGE_TYPE.IMAGE]: {
    maxSize: 5 * 1024 * 1024, // 5 MB
    types: [
      'image/jpeg',
      'image/png',
    ],
  },

  [MESSAGE_TYPE.VIDEO]: {
    maxSize: 16 * 1024 * 1024, // 16 MB
    types: [
      'video/mp4',
    ],
  },

  [MESSAGE_TYPE.AUDIO]: {
    maxSize: 16 * 1024 * 1024, // 16 MB
    types: [
      'audio/mp3'
    ],
  },

  [MESSAGE_TYPE.DOCUMENT]: {
    maxSize: 100 * 1024 * 1024, // 100 MB
    types: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
    ],
  },
}

