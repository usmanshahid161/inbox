import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Phone, Mail, Building2, MessageSquare, UserCheck, UserX, PencilLine, PlusCircle } from 'lucide-react'
import Avatar from '../components/common/Avatar'
import Badge from '../components/common/Badge'
import { Skeleton } from '../components/common/Loader'
import ChannelIcon, { channelLabel } from '../components/common/ChannelIcon'
import {
  fetchContacts,
  fetchContactActivity,
  selectContactById,
  selectContactActivity,
  selectContactsStatus
} from '../features/contacts/contactsSlice'
import { selectInteraction } from '../features/interactions/interactionsSlice'
import { formatFullDateTime } from '../utils/formatters'

const ACTIVITY_ICON = {
  CREATED: PlusCircle,
  UPDATED: PencilLine,
  INTERACTION_ASSIGNED: UserCheck,
  INTERACTION_UNASSIGNED: UserX
}

export default function ContactDetail() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const contact = useSelector((state) => selectContactById(state, id))
  const activity = useSelector((state) => selectContactActivity(state, id))
  const status = useSelector(selectContactsStatus)

  useEffect(() => {
    dispatch(fetchContacts())
    dispatch(fetchContactActivity(id))
  }, [dispatch, id])

  const openInteraction = (interactionId) => {
    dispatch(selectInteraction(interactionId))
    navigate('/app/inbox')
  }

  if (status === 'loading' && !contact) {
    return (
      <div className="p-6">
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-ink-400 dark:text-navy-500">Contact not found.</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 lg:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/contacts')}
            className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 dark:text-navy-400 dark:hover:bg-navy-800"
            aria-label="Back to contacts"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <Avatar name={contact.name} color="#219c89" size="md" />
          <div>
            <h1 className="text-base font-semibold text-ink-900 dark:text-white">{contact.name}</h1>
            {contact.company && <p className="text-xs text-ink-500 dark:text-navy-400">{contact.company}</p>}
          </div>
        </div>
        <button
          onClick={() => navigate(`/app/contacts/${id}/edit`)}
          className="flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-50 dark:border-navy-700 dark:text-navy-300 dark:hover:bg-navy-800"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: details + linked interactions */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-ink-100 bg-white p-4 dark:border-navy-800 dark:bg-navy-900">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm text-ink-700 dark:text-navy-200">
                <Phone className="h-3.5 w-3.5 text-ink-400" /> {contact.phone || '—'}
              </div>
              <div className="flex items-center gap-2 text-sm text-ink-700 dark:text-navy-200">
                <Mail className="h-3.5 w-3.5 text-ink-400" /> {contact.email || '—'}
              </div>
              <div className="flex items-center gap-2 text-sm text-ink-700 dark:text-navy-200 sm:col-span-2">
                <Building2 className="h-3.5 w-3.5 text-ink-400" /> {contact.company || '—'}
              </div>
            </div>
            {contact.tags?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {contact.tags.map((tag) => (
                  <Badge key={tag} tone="neutral">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            {contact.notes && (
              <p className="mt-3 whitespace-pre-wrap text-sm text-ink-600 dark:text-navy-300">{contact.notes}</p>
            )}
          </div>

          <div className="rounded-xl border border-ink-100 bg-white p-4 dark:border-navy-800 dark:bg-navy-900">
            <h2 className="mb-3 text-sm font-semibold text-ink-900 dark:text-white">
              Conversations ({contact.interactions?.length || 0})
            </h2>
            {!contact.interactions?.length ? (
              <p className="text-xs text-ink-400 dark:text-navy-500">No conversations linked yet.</p>
            ) : (
              <div className="space-y-1.5">
                {contact.interactions.map((link) => (
                  <button
                    key={link.interactionId}
                    onClick={() => openInteraction(link.interactionId)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-ink-50 dark:hover:bg-navy-800"
                  >
                    <ChannelIcon channel={link.channel?.toUpperCase?.()} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink-800 dark:text-navy-100">
                        {channelLabel(link.channel?.toUpperCase?.())} conversation
                      </p>
                      <p className="text-[11px] text-ink-400 dark:text-navy-500">
                        Linked {formatFullDateTime(link.assignedAt)}
                      </p>
                    </div>
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 text-ink-300 dark:text-navy-600" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: activity timeline */}
        <div className="rounded-xl border border-ink-100 bg-white p-4 dark:border-navy-800 dark:bg-navy-900">
          <h2 className="mb-3 text-sm font-semibold text-ink-900 dark:text-white">Activity</h2>
          {activity.length === 0 ? (
            <p className="text-xs text-ink-400 dark:text-navy-500">No activity yet.</p>
          ) : (
            <ol className="relative space-y-4 border-l border-ink-100 pl-4 dark:border-navy-800">
              {activity.map((item) => {
                const Icon = ACTIVITY_ICON[item.type] || PencilLine
                return (
                  <li key={item._id} className="relative">
                    <span className="absolute -left-[21px] flex h-5 w-5 items-center justify-center rounded-full bg-ink-100 text-ink-500 ring-4 ring-white dark:bg-navy-800 dark:text-navy-300 dark:ring-navy-900">
                      <Icon className="h-2.5 w-2.5" />
                    </span>
                    <p className="text-xs text-ink-700 dark:text-navy-200">{item.detail}</p>
                    <p className="mt-0.5 text-[10px] text-ink-400 dark:text-navy-500">
                      {formatFullDateTime(item.createdAt)}
                    </p>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}