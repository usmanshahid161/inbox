import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Search, UserPlus, ExternalLink, X, Phone, Mail, Building2 } from 'lucide-react'
import {
  fetchContacts,
  assignContactToInteraction,
  unassignContactFromInteraction,
  selectAllContacts,
  selectContactByInteractionId,
  selectAssigning
} from '../../features/contacts/contactsSlice'
import { selectCurrentUser } from '../../features/auth/authSlice'
import { openConfirmDialog, showToast } from '../../features/ui/uiSlice'

function LinkedContactCard({ contact, interaction, dispatch, currentUser }) {
  const handleRemove = () => {
    dispatch(
      openConfirmDialog({
        title: 'Remove contact link',
        description: `"${contact.name}" will no longer be linked to this conversation.`,
        confirmLabel: 'Remove',
        tone: 'danger',
        onConfirm: () => {
          dispatch(
            unassignContactFromInteraction({
              contactId: contact._id,
              interactionId: interaction._id,
              channel: interaction.channel,
              actorName: currentUser?.name
            })
          ).then((res) => {
            if (!res.error) dispatch(showToast({ message: 'Contact unlinked', tone: 'default' }))
          })
        }
      })
    )
  }

  return (
    <div className="rounded-xl border border-ink-100 p-3.5 dark:border-navy-800">
      <div className="mb-2.5 flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-ink-900 dark:text-white">{contact.name}</p>
          {contact.company && <p className="text-xs text-ink-500 dark:text-navy-400">{contact.company}</p>}
        </div>
        <button
          onClick={handleRemove}
          className="rounded-md p-1 text-ink-400 hover:bg-ink-100 dark:text-navy-500 dark:hover:bg-navy-800"
          title="Remove link"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-1.5 text-xs text-ink-500 dark:text-navy-400">
        {contact.phone && (
          <p className="flex items-center gap-1.5">
            <Phone className="h-3 w-3" /> {contact.phone}
          </p>
        )}
        {contact.email && (
          <p className="flex items-center gap-1.5">
            <Mail className="h-3 w-3" /> {contact.email}
          </p>
        )}
      </div>

      <Link
        to={`/app/contacts/${contact._id}`}
        className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-ink-200 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-50 dark:border-navy-700 dark:text-navy-300 dark:hover:bg-navy-800"
      >
        <ExternalLink className="h-3 w-3" />
        Open contact profile
      </Link>
    </div>
  )
}

export default function ContactsTab({ interaction }) {
  const dispatch = useDispatch()
  const currentUser = useSelector(selectCurrentUser)
  const allContacts = useSelector(selectAllContacts)
  const linkedContact = useSelector((state) => selectContactByInteractionId(state, interaction?._id))
  const assigning = useSelector(selectAssigning)
  const [query, setQuery] = useState('')

  useEffect(() => {
    dispatch(fetchContacts())
  }, [dispatch])

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return allContacts
      .filter((c) => c.name?.toLowerCase().includes(q) || c.phone?.includes(q) || c.email?.toLowerCase().includes(q))
      .slice(0, 8)
  }, [allContacts, query])

  const handleAssign = (contact) => {
    dispatch(
      assignContactToInteraction({
        contactId: contact._id,
        interactionId: interaction._id,
        channel: interaction.channel,
        previousContactId: linkedContact?._id,
        actorName: currentUser?.name
      })
    ).then((res) => {
      if (!res.error) {
        dispatch(showToast({ message: `Linked to ${contact.name}`, tone: 'success' }))
        setQuery('')
      }
    })
  }

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4">
      {linkedContact ? (
        <LinkedContactCard contact={linkedContact} interaction={interaction} dispatch={dispatch} currentUser={currentUser} />
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search contacts to link..."
              className="w-full rounded-lg border border-ink-200 bg-white py-2 pl-8 pr-3 text-xs focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
            />
          </div>

          {query.trim() && (
            <div className="space-y-1">
              {results.length === 0 ? (
                <p className="py-4 text-center text-xs text-ink-400 dark:text-navy-500">No matching contacts.</p>
              ) : (
                results.map((c) => (
                  <button
                    key={c._id}
                    disabled={assigning}
                    onClick={() => handleAssign(c)}
                    className="flex w-full flex-col items-start rounded-lg px-2.5 py-2 text-left hover:bg-ink-50 disabled:opacity-50 dark:hover:bg-navy-800"
                  >
                    <span className="text-sm font-medium text-ink-800 dark:text-navy-100">{c.name}</span>
                    <span className="text-[11px] text-ink-400 dark:text-navy-500">
                      {[c.phone, c.email].filter(Boolean).join(' · ') || 'No contact info'}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}

          <Link
            to="/app/contacts/new"
            className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-ink-200 py-2 text-xs font-medium text-ink-500 hover:border-ink-300 hover:text-ink-700 dark:border-navy-700 dark:text-navy-400 dark:hover:border-navy-600"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Create a new contact
          </Link>
        </div>
      )}
    </div>
  )
}