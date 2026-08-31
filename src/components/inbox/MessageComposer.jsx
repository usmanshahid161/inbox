import { useRef, useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Recorder } from 'vmsg'
import {
  Paperclip,
  Smile,
  Send,
  X,
  FileText,
  Mic,
  Square,
  Trash2,
  UploadCloud,
  LayoutTemplate
} from 'lucide-react'

import { selectCurrentUser } from '../../features/auth/authSlice.js'
import { selectSelectedInteraction } from '../../features/interactions/interactionsSlice.js'
import { addOptimisticMessage, sendMessage } from '../../features/messages/messagesSlice'
import { selectAllQuickReplies } from '../../features/quickReplies/quickRepliesSlice'
import { showToast } from '../../features/ui/uiSlice'
import { useAuth } from '../../hooks/useAuth'
import messageApi from '../../services/messageApi.js'
import { formatFileSize } from '../../utils/formatters'
import { MESSAGE_TYPE, INTERACTION_STATUS, FILE_RULES } from '../../utils/constants'
import { getWhatsappWindowStatus } from '../../utils/whatsappWindow'
import TemplateSendModal                                from './TemplateSendModal.jsx'

const EMOJIS = ['😀', '😂', '😍', '👍', '🙏', '🎉', '❤️', '😢', '🔥', '👀']

const SUPPORTED_DOC_INFO = [
  { category: 'Image', formats: 'JPEG, PNG', size: '5 MB' },
  { category: 'Document', formats: 'PDF, DOC, DOCX, PPT, XLS', size: '100 MB' },
  { category: 'Video', formats: 'MP4', size: '16 MB' },
  { category: 'Audio', formats: 'MP3', size: '16 MB' },
]

// Allowed Extensions & MIME Types Mapping
const ALLOWED_FORMATS = {
  [MESSAGE_TYPE.IMAGE]: {
    extensions: ['jpg', 'jpeg', 'png'],
    mimes: ['image/jpeg', 'image/png']
  },
  [MESSAGE_TYPE.DOCUMENT]: {
    extensions: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'],
    mimes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
  },
  [MESSAGE_TYPE.VIDEO]: {
    extensions: ['mp4'],
    mimes: ['video/mp4']
  },
  [MESSAGE_TYPE.AUDIO]: {
    extensions: ['mp3'],
    mimes: ['audio/mpeg', 'audio/mp3']
  }
}

function inferType(file) {
  const ext = file.name.split('.').pop()?.toLowerCase()

  if (ALLOWED_FORMATS[MESSAGE_TYPE.IMAGE].extensions.includes(ext) || file.type.startsWith('image/')) {
    return MESSAGE_TYPE.IMAGE
  }
  if (ALLOWED_FORMATS[MESSAGE_TYPE.VIDEO].extensions.includes(ext) || file.type.startsWith('video/')) {
    return MESSAGE_TYPE.VIDEO
  }
  if (ALLOWED_FORMATS[MESSAGE_TYPE.AUDIO].extensions.includes(ext) || file.type.startsWith('audio/')) {
    return MESSAGE_TYPE.AUDIO
  }
  return MESSAGE_TYPE.DOCUMENT
}

function validateFile(file) {
  const type = inferType(file)
  const rule = FILE_RULES?.[type]
  const allowed = ALLOWED_FORMATS[type]

  const fileExt = file.name.split('.').pop()?.toLowerCase()
  const fileMime = file.type?.toLowerCase()

  // 1. Strict Format & Extension Validation
  const isValidExtension = allowed?.extensions.includes(fileExt)
  const isValidMime = allowed?.mimes.includes(fileMime) || fileMime === '' // Empty MIME fallback to extension check

  if (!isValidExtension || !isValidMime) {
    const categoryInfo = SUPPORTED_DOC_INFO.find(
      (item) => item.category.toUpperCase() === type.toUpperCase()
    )

    return {
      valid: false,
      error: `Invalid format (${fileExt.toUpperCase()}). Supported ${categoryInfo?.category || type} formats: ${categoryInfo?.formats}`
    }
  }

  // 2. Size Validation
  const maxSize = rule?.maxSize || 100 * 1024 * 1024
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `${file.name} exceeds allowed limit (${formatFileSize(maxSize)}).`
    }
  }

  return { valid: true, type }
}

export default function MessageComposer({ interactionId, interactionStatus }) {
  const dispatch = useDispatch()
  const { user } = useAuth()

  const [text, setText] = useState('')
  const [pendingAttachments, setPendingAttachments] = useState([])
  const [showEmoji, setShowEmoji] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Modals state
  const [isFileModalOpen, setIsFileModalOpen] = useState(false)
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)

  // Audio Recording States
  const [recorder, setRecorder] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBuffer, setAudioBuffer] = useState(null)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)

  const timerRef = useRef(null)
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)

  const currentUser = useSelector(selectCurrentUser)
  const selectedInteraction = useSelector(selectSelectedInteraction)
  const quickReplies = useSelector(selectAllQuickReplies)

  const isClosed = interactionStatus === INTERACTION_STATUS.CLOSED
  const hasAttachments = pendingAttachments.length > 0

  // Outside WhatsApp's 24-hour customer window, Meta only accepts
  // Template messages — same rule enforced server-side (services/message.js
  // on the interaction manager), mirrored here so the composer blocks it
  // before a doomed send even goes out.
  const isWhatsapp = selectedInteraction?.channel?.toUpperCase?.() === 'WHATSAPP'
  const windowClosed = isWhatsapp && !getWhatsappWindowStatus(selectedInteraction?.lastCustomerMessageAt).open

  const canSend = (text.trim().length > 0 || hasAttachments) && !isClosed && !isUploading && !windowClosed

  // Typing "/shortcut" opens a picker of matching quick replies — selecting
  // one replaces the composer's text with that reply's full message,
  // mirroring how Slack/Intercom-style canned responses work.
  const quickReplyQuery = /^\/(\S*)$/.test(text.trim()) ? text.trim().slice(1).toLowerCase() : null
  const matchingQuickReplies =
    quickReplyQuery !== null
      ? quickReplies.filter((qr) => qr.shortcut.toLowerCase().startsWith(quickReplyQuery))
      : []

  const insertQuickReply = (reply) => {
    setText(reply.message)
    textareaRef.current?.focus()
  }

  // Single File Handler
  const processAndUploadFile = async (file) => {
    if (!file) return

    if (pendingAttachments.length >= 1) {
      dispatch(showToast({ message: 'Only 1 file can be uploaded at a time.', tone: 'danger' }))
      return
    }

    const validation = validateFile(file)
    if (!validation.valid) {
      dispatch(showToast({ message: validation.error, tone: 'danger' }))
      return
    }

    const localId = `local-${Date.now()}-${file.name}`
    const tempUrl = URL.createObjectURL(file)

    const tempAttachment = {
      id: localId,
      type: validation.type,
      uploading: true,
      data: {
        url: tempUrl,
        size: file.size,
        name: file.name,
        mimeType: file.type
      }
    }

    setPendingAttachments([tempAttachment])
    setIsUploading(true)
    setIsFileModalOpen(false)

    dispatch(showToast({ message: 'File uploading in progress...', tone: 'warn' }))

    try {
      const response = await messageApi.uploadFile(file, interactionId)
      const uploadedUrl = response?.data?.url

      if (!uploadedUrl) throw new Error('S3 URL failed')

      dispatch(showToast({ message: `Uploaded ${file.name} successfully`, tone: 'success' }))

      setPendingAttachments([
        {
          ...tempAttachment,
          uploading: false,
          data: { ...tempAttachment.data, url: uploadedUrl }
        }
      ])
      URL.revokeObjectURL(tempUrl)
    } catch (error) {
      console.error('File upload failed:', error)
      URL.revokeObjectURL(tempUrl)
      setPendingAttachments([])
      dispatch(showToast({ message: `Failed to upload ${file.name}`, tone: 'danger' }))
    } finally {
      setIsUploading(false)
    }
  }

  // Voice Recording with vmsg WebAssembly MP3 Encoder
  const startRecording = async () => {
    try {
      const vmsgRecorder = new Recorder({
        wasmURL: 'https://unpkg.com/vmsg@0.3.0/vmsg.wasm'
      })
      await vmsgRecorder.init()
      await vmsgRecorder.startRecording()

      setRecorder(vmsgRecorder)
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error(err)
      dispatch(showToast({ message: 'Microphone permission denied or WASM load failed.', tone: 'danger' }))
    }
  }

  const stopRecording = async () => {
    if (recorder && isRecording) {
      clearInterval(timerRef.current)
      try {
        const mp3Blob = await recorder.stopRecording()
        const buffer = await mp3Blob.arrayBuffer()
        const url = URL.createObjectURL(mp3Blob)

        setAudioBuffer(buffer)
        setAudioBlob(mp3Blob)
        setAudioUrl(url)
        setIsRecording(false)
      } catch (e) {
        console.error(e)
      }
    }
  }

  const discardAudio = () => {
    if (isRecording && recorder) {
      recorder.stopRecording()
    }
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setRecorder(null)
    setAudioBuffer(null)
    setAudioBlob(null)
    setAudioUrl(null)
    setRecordingTime(0)
    setIsRecording(false)
    clearInterval(timerRef.current)
    setIsAudioModalOpen(false)
  }

  const saveRecordedAudio = async () => {
    if (!audioBlob || !audioBuffer) return

    // WhatsApp Cloud API only accepts 'audio/mpeg' for MP3 files (NOT 'audio/mp3')
    const audioFile = new File([audioBuffer], `voice-note-${Date.now()}.mp3`, {
      type: 'audio/mpeg'
    })

    await processAndUploadFile(audioFile)
    discardAudio()
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const removeAttachment = (id) => {
    setPendingAttachments([])
  }

  const handleSend = () => {
    if (!canSend || isUploading) return

    const author = {
      id: currentUser?.id || currentUser?._id,
      name: currentUser?.name,
      role: currentUser?.role
    }
    const messageType = pendingAttachments.length > 0 ? 'MULTIMEDIA' : MESSAGE_TYPE.TEXT
    const recipient = selectedInteraction?.participants.find((p) => p?.role === 'customer')

    const message = {
      author,
      interactionId,
      message: text.trim(),
      messageType,
      attachments: pendingAttachments,
      direction: 1,
      channel: 'whatsapp',
      extension: selectedInteraction?.extension,
      recipient: recipient?.id,
      tenantId: selectedInteraction?.tenantId,
      status: { message: 'SENDING' }
    }

    dispatch(addOptimisticMessage({ interactionId, message: text.trim(), messageType, attachments: pendingAttachments, author }))
    dispatch(sendMessage({ message })).unwrap().catch(() => dispatch(showToast({ message: 'Message failed to send.', tone: 'danger' })))

    setText('')
    setPendingAttachments([])
    setShowEmoji(false)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  // Sends an approved WhatsApp template message, built by TemplateSendModal
  const handleSendTemplate = (templatePayload) => {
    const author = {
      id: currentUser?.id || currentUser?._id,
      name: currentUser?.name,
      role: currentUser?.role
    }
    const recipient = selectedInteraction?.participants.find((p) => p?.role === 'customer')

    const message = {
      author,
      interactionId,
      message: templatePayload.previewText, // rendered text for the thread/optimistic bubble
      messageType: 'TEMPLATE',
      template: {
        name: templatePayload.name,
        language: templatePayload.language,
        category: templatePayload.category,
        components: templatePayload.components // Meta's send-time parameter format
      },
      direction: 1,
      channel: 'whatsapp',
      extension: selectedInteraction?.extension,
      recipient: recipient?.id,
      tenantId: selectedInteraction?.tenantId,
      status: { message: 'SENDING' }
    }

    dispatch(addOptimisticMessage({
      interactionId,
      message: templatePayload.previewText,
      messageType: 'TEMPLATE',
      attachments: [],
      author
    }))

    dispatch(sendMessage({ message }))
      .unwrap()
      .catch(() => dispatch(showToast({ message: 'Template message failed to send.', tone: 'danger' })))

    setIsTemplateModalOpen(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const autoGrow = (e) => {
    setText(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
  }

  if (isClosed) {
    return (
      <div className="border-t border-ink-100 bg-white px-4 py-3 text-center text-sm text-ink-400 dark:border-navy-800 dark:bg-navy-900 dark:text-navy-400">
        This conversation is closed. Reopen it to keep messaging.
      </div>
    )
  }

  return (
    <div className="shrink-0 border-t border-ink-100 bg-white px-3 py-2.5 dark:border-navy-800 dark:bg-navy-900 sm:px-4">
      {windowClosed && (
        <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          <span>24-hour window closed — only a template message can be sent now.</span>
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="shrink-0 rounded-md bg-amber-600 px-2.5 py-1 font-medium text-white hover:bg-amber-700"
          >
            Send template
          </button>
        </div>
      )}

      {/* Pending Attachment Preview Bar */}
      {pendingAttachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {pendingAttachments.map((att) => (
            <div
              key={att.id}
              className="relative flex items-center gap-2 rounded-lg border border-ink-200 bg-ink-50 px-2 py-1.5 dark:border-navy-700 dark:bg-navy-800"
            >
              {att.type === MESSAGE_TYPE.IMAGE ? (
                <img src={att.data.url} alt={att?.data?.name} className="h-8 w-8 rounded object-cover" />
              ) : (
                <FileText className="h-5 w-5 text-ink-400" />
              )}
              <div className="max-w-[10rem]">
                <p className="truncate text-xs font-medium text-ink-700 dark:text-navy-100">{att?.data?.name}</p>
                <p className="text-[10px] text-ink-400 dark:text-navy-400">
                  {att.uploading ? 'Uploading...' : formatFileSize(att?.data?.size)}
                </p>
              </div>
              <button
                onClick={() => removeAttachment(att.id)}
                className="text-ink-400 hover:text-ink-700 dark:text-navy-400 dark:hover:text-white"
                disabled={isUploading}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Action Toolbar Bar */}
      <div className="flex items-end gap-1">
        <button
          onClick={() => setShowEmoji((s) => !s)}
          disabled={windowClosed}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 disabled:opacity-40 dark:text-navy-300 dark:hover:bg-navy-800"
        >
          <Smile className="h-4.5 w-4.5" />
        </button>

        <button
          onClick={() => setIsFileModalOpen(true)}
          disabled={hasAttachments || isUploading || windowClosed}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 disabled:opacity-40 dark:text-navy-300 dark:hover:bg-navy-800"
          title="Upload File"
        >
          <Paperclip className="h-4.5 w-4.5" />
        </button>

        <button
          onClick={() => setIsAudioModalOpen(true)}
          disabled={hasAttachments || isUploading || windowClosed}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 disabled:opacity-40 dark:text-navy-300 dark:hover:bg-navy-800"
          title="Record Audio"
        >
          <Mic className="h-4.5 w-4.5" />
        </button>

        <button
          onClick={() => setIsTemplateModalOpen(true)}
          disabled={hasAttachments || isUploading}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 disabled:opacity-40 dark:text-navy-300 dark:hover:bg-navy-800"
          title="Send a template"
        >
          <LayoutTemplate className="h-4.5 w-4.5" />
        </button>

        <div className="relative flex-1">
          {showEmoji && (
            <div className="absolute bottom-11 left-0 z-20 grid grid-cols-5 gap-1 rounded-lg border border-ink-100 bg-white p-2 shadow-popover dark:border-navy-700 dark:bg-navy-800">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setText((t) => t + emoji)}
                  className="rounded p-1 text-lg hover:bg-ink-100 dark:hover:bg-navy-700"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {quickReplyQuery !== null && matchingQuickReplies.length > 0 && (
            <div className="absolute bottom-11 left-0 z-20 max-h-56 w-72 overflow-y-auto scroll-thin rounded-lg border border-ink-100 bg-white py-1 shadow-popover dark:border-navy-700 dark:bg-navy-800">
              {matchingQuickReplies.map((reply) => (
                <button
                  key={reply._id}
                  onClick={() => insertQuickReply(reply)}
                  className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-ink-50 dark:hover:bg-navy-700"
                >
                  <span className="flex items-center gap-1.5 text-xs">
                    <span className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[11px] text-ink-600 dark:bg-navy-700 dark:text-navy-300">
                      /{reply.shortcut}
                    </span>
                    <span className="font-medium text-ink-800 dark:text-navy-100">{reply.title}</span>
                  </span>
                  <span className="line-clamp-1 text-[11px] text-ink-400 dark:text-navy-500">{reply.message}</span>
                </button>
              ))}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={text}
            onChange={autoGrow}
            disabled={windowClosed}
            placeholder={windowClosed ? '24-hour window closed — use a template instead' : undefined}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Write a reply..."
            className="max-h-[120px] w-full resize-none rounded-lg border border-ink-200 bg-ink-50 px-3 py-2 text-sm text-ink-800 placeholder:text-ink-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white dark:placeholder:text-navy-400 dark:focus:bg-navy-800"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!canSend}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:bg-ink-200 disabled:text-ink-400 dark:disabled:bg-navy-700 dark:disabled:text-navy-500"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      {/* MODAL 1: FILE UPLOAD SPECS & PICKER */}
      {isFileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl dark:bg-navy-900">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3 dark:border-navy-800">
              <h3 className="text-base font-semibold text-ink-800 dark:text-white">Upload Media File</h3>
              <button onClick={() => setIsFileModalOpen(false)} className="text-ink-400 hover:text-ink-700 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-ink-500 dark:text-navy-300">Supported Formats & Size Limits (Single File):</p>

              <div className="overflow-hidden rounded-lg border border-ink-100 bg-ink-50 p-3 text-xs dark:border-navy-800 dark:bg-navy-800">
                <div className="grid grid-cols-12 font-semibold text-ink-700 border-b pb-2 dark:text-navy-200 dark:border-navy-700">
                  <span className="col-span-3">Type</span>
                  <span className="col-span-6">Formats</span>
                  <span className="col-span-3 text-right">Max Limit</span>
                </div>
                {SUPPORTED_DOC_INFO.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 py-2 text-ink-600 border-b last:border-0 border-ink-100/60 dark:text-navy-300 dark:border-navy-700/50">
                    <span className="col-span-3 font-medium">{item.category}</span>
                    <span className="col-span-6 leading-relaxed break-words pr-2">{item.formats}</span>
                    <span className="col-span-3 text-right font-semibold text-brand-600 dark:text-brand-400">{item.size}</span>
                  </div>
                ))}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    processAndUploadFile(e.target.files[0])
                  }
                  e.target.value = ''
                }}
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink-200 p-6 hover:border-brand-500 dark:border-navy-700 dark:hover:border-brand-400"
              >
                <UploadCloud className="h-8 w-8 text-brand-600 dark:text-brand-400" />
                <span className="mt-2 text-xs font-semibold text-ink-700 dark:text-navy-200">Click to Choose File</span>
                <span className="text-[10px] text-ink-400">Maximum 1 file allowed per message</span>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setIsFileModalOpen(false)}
                className="rounded-lg border border-ink-200 px-4 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-100 dark:border-navy-700 dark:text-navy-300 dark:hover:bg-navy-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: MP3 VOICE AUDIO RECORDER */}
      {isAudioModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl dark:bg-navy-900">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3 dark:border-navy-800">
              <h3 className="text-base font-semibold text-ink-800 dark:text-white">Voice Note Recorder (MP3)</h3>
              <button onClick={discardAudio} className="text-ink-400 hover:text-ink-700 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 flex flex-col items-center justify-center">
              <div className="text-3xl font-mono font-bold text-ink-800 dark:text-white">{formatTime(recordingTime)}</div>

              {isRecording && (
                <div className="mt-2 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                  <span className="text-xs text-red-500 font-medium">Recording MP3 live...</span>
                </div>
              )}

              {audioUrl && !isRecording && (
                <audio controls src={audioUrl} className="mt-4 w-full h-8" />
              )}

              <div className="mt-6 flex items-center gap-3">
                {!isRecording && !audioUrl && (
                  <button
                    onClick={startRecording}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700"
                  >
                    <Mic className="h-6 w-6" />
                  </button>
                )}

                {isRecording && (
                  <button
                    onClick={stopRecording}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-800 text-white shadow-lg hover:bg-black"
                  >
                    <Square className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-ink-100 pt-3 dark:border-navy-800">
              <button
                onClick={discardAudio}
                className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" /> Cancel
              </button>

              <button
                onClick={saveRecordedAudio}
                disabled={!audioUrl}
                className="flex items-center gap-1 rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50 hover:bg-brand-700"
              >
                Attach & Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: TEMPLATE PICKER + VARIABLE FILL */}
      <TemplateSendModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSend={handleSendTemplate}
      />
    </div>
  )
}