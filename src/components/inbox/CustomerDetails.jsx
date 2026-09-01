import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { X, Phone, Mail, Hash, Tag, Plus, User2, History } from 'lucide-react'
import Avatar from '../common/Avatar'
import { channelLabel } from '../common/ChannelIcon'
import Badge from '../common/Badge'
import { closeCustomerDetailsDrawer, selectIsCustomerDetailsDrawerOpen } from '../../features/ui/uiSlice'
import { formatRelativeTime } from '../../utils/formatters'
import { INTERACTION_STATUS } from '../../utils/constants'
import { addNotes, updateNote, deleteNote } from '../../features/interactions/interactionsSlice.js'
import ContactsTab from './ContactsTab'
import InteractionHistoryTab from './InteractionHistoryTab'

const PANEL_TABS = [
  { id: 'details', label: 'Details', icon: Hash },
  { id: 'contacts', label: 'Contacts', icon: User2 },
  { id: 'history', label: 'History', icon: History }
]

function PanelContent({ interaction }) {
  const [activeTab, setActiveTab] = useState('details')

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 border-b border-ink-100 dark:border-navy-800">
        {PANEL_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-b-2 border-transparent text-ink-400 hover:text-ink-600 dark:text-navy-500 dark:hover:text-navy-300'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1">
        {activeTab === 'details' && <DetailsTab interaction={interaction} />}
        {activeTab === 'contacts' && <ContactsTab interaction={interaction} />}
        {activeTab === 'history' && <InteractionHistoryTab interaction={interaction} />}
      </div>
    </div>
  )
}

function DetailRow({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-400 dark:text-navy-400" />
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wide text-ink-400 dark:text-navy-500">{label}</p>
        <p className="truncate text-sm text-ink-800 dark:text-navy-100">{value}</p>
      </div>
    </div>
  )
}

function InfoRow({ label, children }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-ink-500 dark:text-navy-400">{label}</span>
      <span className="font-medium text-ink-800 dark:text-navy-100">{children}</span>
    </div>
  )
}

function SectionLabel({ children }) {
  return <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400 dark:text-navy-500">{children}</p>
}

function DetailsTab({ interaction }) {
  const [note, setNote] = useState('')
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const dispatch = useDispatch()

  const {
    caller,
    channel,
    status,
    updatedAt,
    connect,
    notes = [],
    workCodes
  } = interaction

  const addNote = async () => {
    if (!note.trim()) return

    try {
      await dispatch(
        addNotes({
          interactionId: interaction?._id,
          note: {
            id: Date.now().toString(),
            text: note.trim()
          }
        })
      ).unwrap()

      setNote('')
    } catch (error) {
      console.error('Failed to add note:', error)
    }
  }

  const startEditNote = (item) => {
    setEditingNoteId(item.id)
    setEditingText(item.text || '')
  }

  const cancelEdit = () => {
    setEditingNoteId(null)
    setEditingText('')
  }

  const saveEditNote = async (item) => {
    if (!editingText.trim()) return

    try {
      await dispatch(
        updateNote({
          interactionId: interaction?._id,
          noteId: item.id,
          text: editingText.trim()
        })
      ).unwrap()

      cancelEdit()
    } catch (error) {
      console.error('Failed to update note:', error)
    }
  }

  const handleDeleteNote = async (item) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this note?'
    )

    if (!confirmed) return

    try {
      await dispatch(
        deleteNote({
          interactionId: interaction?._id,
          noteId: item?.id
        })
      ).unwrap()
    } catch (error) {
      console.error('Failed to delete note:', error)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto scroll-thin">
      <div className="flex flex-col items-center gap-1.5 border-b border-ink-100 px-4 py-6 text-center dark:border-navy-800">
        <Avatar
          name={caller.name}
          color="#219c89"
          size="lg"
          presence={caller.online ? 'ONLINE' : 'OFFLINE'}
        />

        <p className="text-sm font-semibold text-ink-900 dark:text-white">
          {caller.name}
        </p>

        <p className="text-xs text-ink-500 dark:text-navy-400">
          {channelLabel(channel)}
        </p>
      </div>

      <div className="space-y-4 border-b border-ink-100 px-4 py-4 dark:border-navy-800">
        <DetailRow
          icon={Phone}
          label="Phone"
          value={caller.phone}
        />

        <DetailRow
          icon={Mail}
          label="Email"
          value={caller.email}
        />

        <DetailRow
          icon={Hash}
          label="Customer ID"
          value={caller.id}
        />
      </div>

      <div className="space-y-2.5 border-b border-ink-100 px-4 py-4 dark:border-navy-800">
        <SectionLabel>Interaction</SectionLabel>

        <InfoRow label="Status">
          <Badge
            tone={
              status === INTERACTION_STATUS.CLOSED
                ? 'neutral'
                : 'success'
            }
          >
            {status === INTERACTION_STATUS.CLOSED
              ? 'Closed'
              : status === INTERACTION_STATUS.PENDING
                ? 'Pending'
                : 'Open'}
          </Badge>
        </InfoRow>

        <InfoRow label="Assigned">
          {connect ? 'Assigned' : 'Unassigned'}
        </InfoRow>

        <InfoRow label="Last activity">
          {formatRelativeTime(updatedAt)} ago
        </InfoRow>
      </div>

      <div className="space-y-2.5 border-b border-ink-100 px-4 py-4 dark:border-navy-800">
        <SectionLabel>Tags</SectionLabel>

        <div className="flex flex-wrap gap-1.5">
          { workCodes?.length > 0 && workCodes?.map((workCode) => (
            <Badge
              key={workCode?.id}
              tone="brand"
              className="gap-1"
            >
              <Tag className="h-3 w-3" />
              {workCode?.text}
            </Badge>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="flex-1 space-y-3 px-4 py-4">
        <SectionLabel>Internal notes</SectionLabel>

        <div className="space-y-2">
          {notes?.length === 0 ? (
            <p className="py-2 text-xs text-ink-400 dark:text-navy-500">
              No notes yet.
            </p>
          ) : (
            notes?.map((item) => {
              const isEditing =
                editingNoteId === item.id

              return (
                <div
                  key={item.id}
                  className="group rounded-lg border border-ink-100 bg-ink-50 px-3 py-2.5 dark:border-navy-700 dark:bg-navy-800"
                >
                  {isEditing ? (
                    <>
                      <textarea
                        value={editingText}
                        onChange={(e) =>
                          setEditingText(e.target.value)
                        }
                        rows={3}
                        autoFocus
                        className="w-full resize-none rounded-md border border-ink-200 bg-white px-2 py-1.5 text-sm text-ink-800 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-600 dark:bg-navy-900 dark:text-white"
                      />

                      <div className="mt-2 flex justify-end gap-2">
                        <button
                          onClick={cancelEdit}
                          className="rounded-md px-2.5 py-1 text-xs text-ink-500 hover:bg-ink-200 dark:text-navy-400 dark:hover:bg-navy-700"
                        >
                          Cancel
                        </button>

                        <button
                          onClick={() =>
                            saveEditNote(item)
                          }
                          className="rounded-md bg-brand-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-600"
                        >
                          Save
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Note text */}
                      <p className="text-xs leading-5 text-ink-700 dark:text-navy-100">
                        {item.text}
                      </p>

                      {/* Agent + actions */}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-[10px] font-medium text-ink-500 dark:text-navy-400">
                            {item.agentName || 'Unknown agent'}
                          </span>

                          {item.createdAt && (
                            <span className="text-[10px] text-ink-400 dark:text-navy-500">
                              {formatRelativeTime(
                                item.createdAt
                              )}{' '}
                              ago
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() =>
                              startEditNote(item)
                            }
                            className="rounded-md px-2 py-1 text-[10px] font-medium text-ink-500 hover:bg-ink-200 hover:text-ink-800 dark:text-navy-400 dark:hover:bg-navy-700 dark:hover:text-white"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              handleDeleteNote(item)
                            }
                            className="rounded-md px-2 py-1 text-[10px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Add note */}
        <div className="flex gap-1.5">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addNote()
              }
            }}
            placeholder="Add a note"
            className="flex-1 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-sm placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white dark:placeholder:text-navy-400"
          />

          <button
            onClick={addNote}
            disabled={!note.trim()}
            className="flex h-8 shrink-0 items-center justify-center rounded-lg bg-ink-100 px-3 text-xs font-medium text-ink-700 hover:bg-ink-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-navy-700 dark:text-navy-100 dark:hover:bg-navy-600"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
export default function CustomerDetails({ interaction }) {
  const dispatch = useDispatch()
  const drawerOpen = useSelector(selectIsCustomerDetailsDrawerOpen)

  if (!interaction) return null

  return (
    <>
      {/* Desktop column */}
      <aside className="hidden h-full w-72 shrink-0 border-l border-ink-100 bg-white dark:border-navy-800 dark:bg-navy-900 lg:block xl:w-80">
        <div className="flex h-16 items-center border-b border-ink-100 px-4 dark:border-navy-800">
          <h2 className="text-sm font-semibold text-ink-900 dark:text-white">Customer details</h2>
        </div>
        <div className="h-[calc(100%-4rem)]">
          <PanelContent interaction={interaction} />
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => dispatch(closeCustomerDetailsDrawer())} />
          <div className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-popover animate-slide-in-right dark:bg-navy-900">
            <div className="flex h-14 items-center justify-between border-b border-ink-100 px-4 dark:border-navy-800">
              <h2 className="text-sm font-semibold text-ink-900 dark:text-white">Customer details</h2>
              <button
                onClick={() => dispatch(closeCustomerDetailsDrawer())}
                className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 dark:text-navy-400 dark:hover:bg-navy-800"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="h-[calc(100%-3.5rem)]">
              <PanelContent interaction={interaction} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}