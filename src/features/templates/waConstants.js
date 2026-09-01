// src/features/templates/waConstants.js
//
// Central place for every WhatsApp Business template "rule". Keeping these
// as data (not scattered magic numbers) makes it easy to update if Meta
// changes limits later.

export const CATEGORIES = [
  { value: 'MARKETING', label: 'Marketing', hint: 'Promotions, offers, announcements, updates' },
  { value: 'UTILITY', label: 'Utility', hint: 'Order updates, account alerts, confirmations' },
  { value: 'AUTHENTICATION', label: 'Authentication', hint: 'One-time passcodes / verification codes' },
]

export const LANGUAGES = [
  { value: 'en_US', label: 'English (US)' },
  { value: 'en_GB', label: 'English (UK)' },
  { value: 'ur', label: 'Urdu' },
  { value: 'ur_PK', label: 'Urdu (Pakistan)' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ar', label: 'Arabic' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
]

export const STATUSES = {
  DRAFT: { value: 'DRAFT', label: 'Draft', description: 'Saved locally, not yet sent to WhatsApp for review' },
  PENDING: { value: 'PENDING', label: 'Pending review', description: 'Submitted to WhatsApp, awaiting approval' },
  APPROVED: { value: 'APPROVED', label: 'Approved', description: 'Live and ready to send' },
  REJECTED: { value: 'REJECTED', label: 'Rejected', description: 'WhatsApp declined this template' },
  PAUSED: { value: 'PAUSED', label: 'Paused', description: 'Temporarily paused due to quality/feedback score' },
  DISABLED: { value: 'DISABLED', label: 'Disabled', description: 'Disabled by WhatsApp' },
  ARCHIVED: { value: 'ARCHIVED', label: 'Archived', description: 'Archived due to inactivity — scheduled for deletion in 28 days unless unarchived' },
  UNARCHIVED: { value: 'UNARCHIVED', label: 'Unarchived', description: 'Restored to its previous status' },
  DELETED: { value: 'DELETED', label: 'Deleted', description: 'Deleted on WhatsApp' },
  FLAGGED: { value: 'FLAGGED', label: 'Flagged', description: 'Received negative feedback — at risk of being disabled' },
  IN_APPEAL: { value: 'IN_APPEAL', label: 'In appeal', description: 'An appeal against rejection/disabling is in progress' },
  LIMIT_EXCEEDED: { value: 'LIMIT_EXCEEDED', label: 'Limit exceeded', description: 'Account has hit its template limit' },
  LOCKED: { value: 'LOCKED', label: 'Locked', description: 'Locked and cannot be edited' },
}

export const STATUS_LIST = Object.values(STATUSES)

export const HEADER_TYPES = ['NONE', 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT', 'LOCATION']

// AUTHENTICATION only — Meta generates the actual OTP button text
// itself; these are the three delivery mechanisms it supports.
export const OTP_TYPES = [
  { value: 'COPY_CODE', label: 'Copy code' },
  { value: 'ONE_TAP', label: 'One-tap autofill (Android)' },
  { value: 'ZERO_TAP', label: 'Zero-tap autofill (Android)' },
]

export const BUTTON_TYPES = [
  { value: 'QUICK_REPLY', label: 'Quick reply' },
  { value: 'URL', label: 'Visit website' },
  { value: 'PHONE_NUMBER', label: 'Call phone number' },
  { value: 'COPY_CODE', label: 'Copy offer code' },
]

export const LIMITS = {
  NAME_MAX: 512,
  HEADER_TEXT_MAX: 60,
  BODY_TEXT_MAX: 1024,
  FOOTER_TEXT_MAX: 60,
  BUTTON_TEXT_MAX: 25,
  BUTTONS_MAX: 10,
  QUICK_REPLY_MAX: 10,
  CTA_MAX: 2, // max combined URL + PHONE_NUMBER + COPY_CODE buttons
}

// WhatsApp template names: lowercase letters, numbers and underscores only
export const NAME_PATTERN = /^[a-z0-9_]+$/

export const sanitizeTemplateName = (raw = '') =>
  raw
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')

// Extracts {{1}}, {{2}}... from a body/header string, in order of appearance
export const extractVariables = (text = '') => {
  const matches = [...text.matchAll(/\{\{\s*(\d+)\s*\}\}/g)]
  return matches.map((m) => m[1])
}

export const validateTemplate = (template) => {
  const errors = {}

  if (!template.name?.trim()) {
    errors.name = 'Template name is required'
  } else if (!NAME_PATTERN.test(template.name)) {
    errors.name = 'Only lowercase letters, numbers and underscores are allowed'
  } else if (template.name.length > LIMITS.NAME_MAX) {
    errors.name = `Name must be under ${LIMITS.NAME_MAX} characters`
  }

  if (!template.category) errors.category = 'Category is required'
  if (!template.language) errors.language = 'Language is required'

  // AUTHENTICATION templates are a structurally different shape — no
  // header, no free-form body/footer text (Meta generates it), exactly
  // one OTP button. None of the checks below apply to them.
  if (template.category === 'AUTHENTICATION') {
    return { ...errors, ...validateAuthenticationTemplate(template) }
  }

  const bodyText = template.components?.body?.text?.trim()
  if (!bodyText) {
    errors.body = 'Body text is required'
  } else if (bodyText.length > LIMITS.BODY_TEXT_MAX) {
    errors.body = `Body must be under ${LIMITS.BODY_TEXT_MAX} characters`
  } else {
    const vars = extractVariables(bodyText)
    if (vars.length) {
      const expected = vars.map((_, i) => String(i + 1))
      const sorted = [...vars].sort((a, b) => Number(a) - Number(b))
      const sequential = expected.every((v, i) => v === sorted[i])
      if (!sequential) errors.body = 'Variables must be numbered sequentially: {{1}}, {{2}}, {{3}}...'
      if (/^\s*\{\{\s*1\s*\}\}/.test(bodyText) || /\{\{\s*\d+\s*\}\}\s*$/.test(bodyText.trim())) {
        errors.bodyWarning = 'Body should not start or end with a variable — WhatsApp often rejects these'
      }
      const missingExamples = vars.some((v) => !template.components?.body?.examples?.[Number(v) - 1])
      if (missingExamples) errors.bodyExamples = 'Provide an example value for every {{variable}} for review'
    }
  }

  const header = template.components?.header
  if (header?.type === 'TEXT') {
    if (!header.text?.trim()) errors.header = 'Header text is required when header type is Text'
    else if (header.text.length > LIMITS.HEADER_TEXT_MAX) errors.header = `Header must be under ${LIMITS.HEADER_TEXT_MAX} characters`
    const headerVars = extractVariables(header.text || '')
    if (headerVars.length > 1) errors.header = 'Header text can contain only one variable'
  }
  if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(header?.type) && !header?.exampleUrl) {
    errors.headerMedia = 'Provide a sample media URL/file for review'
  }

  const footerText = template.components?.footer?.text
  if (footerText && footerText.length > LIMITS.FOOTER_TEXT_MAX) {
    errors.footer = `Footer must be under ${LIMITS.FOOTER_TEXT_MAX} characters`
  }

  const buttons = template.components?.buttons || []
  if (buttons.length > LIMITS.BUTTONS_MAX) {
    errors.buttons = `Maximum ${LIMITS.BUTTONS_MAX} buttons allowed`
  }
  const quickReplies = buttons.filter((b) => b.type === 'QUICK_REPLY')
  const ctas = buttons.filter((b) => ['URL', 'PHONE_NUMBER', 'COPY_CODE'].includes(b.type))
  if (quickReplies.length > LIMITS.QUICK_REPLY_MAX) errors.buttons = `Maximum ${LIMITS.QUICK_REPLY_MAX} quick reply buttons`
  if (ctas.length > LIMITS.CTA_MAX) errors.buttons = `Maximum ${LIMITS.CTA_MAX} call-to-action buttons (URL / phone / copy code)`
  buttons.forEach((b, i) => {
    if (!b.text?.trim()) errors[`button_${i}`] = 'Button text is required'
    else if (b.text.length > LIMITS.BUTTON_TEXT_MAX) errors[`button_${i}`] = `Button text must be under ${LIMITS.BUTTON_TEXT_MAX} characters`
    if (b.type === 'URL' && !b.url?.trim()) errors[`button_${i}_url`] = 'URL is required'
    if (b.type === 'PHONE_NUMBER' && !b.phoneNumber?.trim()) errors[`button_${i}_phone`] = 'Phone number is required'
  })

  return errors
}

// Authentication templates support: an optional security-recommendation
// line, an optional code-expiration footer, and exactly one OTP button.
// No header, no custom body/footer text.
const validateAuthenticationTemplate = (template) => {
  const errors = {}
  const auth = template.components?.authentication || {}
  const buttons = template.components?.buttons || []
  const otp = buttons[0]

  if (auth.codeExpirationMinutes != null && (auth.codeExpirationMinutes < 1 || auth.codeExpirationMinutes > 90)) {
    errors.authExpiration = 'Code expiration must be between 1 and 90 minutes'
  }

  if (!otp || otp.type !== 'OTP' || !otp.otpType) {
    errors.authOtp = 'Choose an OTP delivery method'
  } else if (['ONE_TAP', 'ZERO_TAP'].includes(otp.otpType) && (!otp.packageName?.trim() || !otp.signatureHash?.trim())) {
    errors.authOtp = 'One-tap/zero-tap needs the Android package name and signature hash'
  }

  return errors
}

export const isTemplateEditable = (status) => ['DRAFT', 'REJECTED'].includes(status)