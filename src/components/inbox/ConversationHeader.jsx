import { useState, useRef, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  ArrowLeft,
  PanelRightClose,
  PanelRightOpen,
  ChevronDown,
  Check,
  X,
  Search,
  Clock
} from 'lucide-react'

import { selectCurrentUser } from '../../features/auth/authSlice.js'
import Avatar from '../common/Avatar'
import { channelLabel } from '../common/ChannelIcon'
import Badge from '../common/Badge'

import {
  interactionActions,
  addWorkCode,
  deleteWorkCode
} from '../../features/interactions/interactionsSlice'

import { selectAllTags } from '../../features/tags/tagsSlice'
import { selectQueueById } from '../../features/queues/queuesSlice'

import {
  toggleCustomerDetails,
  openCustomerDetailsDrawer,
  selectIsCustomerDetailsCollapsed
} from '../../features/ui/uiSlice'

import { INTERACTION_STATUS } from '../../utils/constants'
import { getWhatsappWindowStatus, formatRemainingWindow } from '../../utils/whatsappWindow'
import TransferShareControl from './TransferShareControl'
import ConversationInfoPopover from './ConversationInfoPopover'

// Ticks once a minute — a live countdown of the WhatsApp 24-hour customer
// window, shown next to the Open/Closed badge. Once it hits zero, only
// Template messages can go out (enforced in MessageComposer + backend).
function WindowTimer({ lastCustomerMessageAt }) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(id)
  }, [])

  const { open, remainingMs } = getWhatsappWindowStatus(lastCustomerMessageAt, now)

  if (!lastCustomerMessageAt) return null

  if (!open) {
    return (
      <Badge tone="danger" className="hidden sm:inline-flex">
        <Clock className="h-3 w-3" />
        Window closed
      </Badge>
    )
  }

  const urgent = remainingMs < 60 * 60 * 1000 // under an hour left

  return (
    <Badge tone={urgent ? 'warning' : 'neutral'} className="hidden sm:inline-flex" title="Time left to send a free-form reply before only templates are allowed">
      <Clock className="h-3 w-3" />
      {formatRemainingWindow(remainingMs)} left
    </Badge>
  )
}

export default function ConversationHeader({
                                             interaction,
                                             onBack
                                           }) {
  const dispatch = useDispatch()

  const currentUser = useSelector(selectCurrentUser)
  const queue = useSelector((state) => selectQueueById(state, interaction?.queue))
  const collapsed = useSelector(
    selectIsCustomerDetailsCollapsed
  )

  const [workCodeOpen, setWorkCodeOpen] = useState(false)
  const [search, setSearch] = useState('')

  const dropdownRef = useRef(null)
  const searchRef = useRef(null)

  const {
    caller,
    channel,
    status,
    participants = [],
    connect,
    workCodes = [],
    lastCustomerMessageAt
  } = interaction

  // Tenant's admin-managed Tags (Admin > Tags), loaded once at login —
  // this dropdown is where an agent actually applies one to a
  // conversation. Kept in the existing workCodes shape ({id, text}) since
  // that's what's already wired end-to-end (add/remove, realtime sync,
  // display in CustomerDetails) — only the source of "what's available to
  // pick" changed, from a hardcoded list to the real tenant tags.
  const tenantTags = useSelector(selectAllTags)
  const availableWorkCodes = tenantTags.map((tag) => ({
    id: tag._id,
    text: tag.name,
    color: tag.color
  }))

  const isClosed =
    status === INTERACTION_STATUS.CLOSED

  const currentUserId =
    currentUser?._id || currentUser?.id

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target
        )
      ) {
        setWorkCodeOpen(false)
        setSearch('')
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      )
    }
  }, [])

  /*
   * Focus search when dropdown opens
   */
  useEffect(() => {
    if (workCodeOpen) {
      setTimeout(() => {
        searchRef.current?.focus()
      }, 50)
    }
  }, [workCodeOpen])

  const activeAgentParticipants =
    participants.filter(
      (participant) =>
        participant?.role === 'agent' &&
        participant?.status === true
    )

  const currentUserParticipant =
    activeAgentParticipants.find(
      (participant) =>
        participant?.id === currentUserId
    )

  const isCurrentUserParticipant =
    !!currentUserParticipant

  const isCurrentUserOnlyAgent =
    isCurrentUserParticipant &&
    activeAgentParticipants.length === 1

  const getConversationAction = () => {
    if (!connect) {
      return {
        type: 'assign',
        label: 'Assign Conversation'
      }
    }

    if (!isCurrentUserParticipant) {
      return {
        type: 'join',
        label: 'Join Conversation'
      }
    }

    if (isCurrentUserOnlyAgent) {
      return {
        type: 'close',
        label: 'End Conversation'
      }
    }

    return {
      type: 'leave',
      label: 'Leave Conversation'
    }
  }

  const conversationAction =
    getConversationAction()

  const handleConversationAction = () => {
    const agent = {
      id: currentUserId,
      name:
        currentUser?.name ||
        'Usman Shahid',
      role: currentUser?.role
    }

    dispatch(
      interactionActions({
        interactionId: interaction._id,
        type: conversationAction.type,
        agent
      })
    )
  }

  /*
   * Check selected work code
   *
   * Compare IDs as strings so:
   * 1 === "1" does not cause duplicate selection.
   */
  const isWorkCodeSelected = (workCodeId) => {
    return workCodes.some(
      (item) =>
        String(item?.id) ===
        String(workCodeId)
    )
  }

  /*
   * Search work codes
   */
  const filteredWorkCodes = useMemo(() => {
    const value =
      search.trim().toLowerCase()

    if (!value) {
      return availableWorkCodes
    }

    return availableWorkCodes.filter(
      (workCode) =>
        workCode?.text
          ?.toLowerCase()
          .includes(value) ||
        String(workCode?.id)
          .toLowerCase()
          .includes(value)
    )
  }, [search])

  /*
   * Add / Delete work code
   */
  const handleWorkCodeToggle = (
    workCode
  ) => {
    const id = workCode?.id
    const selected =
      isWorkCodeSelected(id)

    if (selected) {
      dispatch(
        deleteWorkCode({
          interactionId:
          interaction?._id,
          id
        })
      )
      return
    }

    dispatch(
      addWorkCode({
        interactionId:
        interaction._id,
        workCode: {
          id,
          text: workCode.text,
          agentId: currentUserId,
          agentName:
            currentUser?.name ||
            'Unknown Agent'
        }
      })
    )
  }

  return (
    <div className="flex h-16 shrink-0 items-center gap-3 border-b border-ink-100 bg-white px-3 dark:border-navy-800 dark:bg-navy-900 lg:px-4">

      {/* Back */}
      <button
        onClick={onBack}
        className="rounded-md p-1.5 text-ink-500 hover:bg-ink-100 dark:text-navy-300 dark:hover:bg-navy-800 lg:hidden"
        aria-label="Back to list"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      {/* Avatar */}
      <Avatar
        name={caller.name}
        color="#219c89"
        presence={
          caller.online
            ? 'ONLINE'
            : 'OFFLINE'
        }
      />

      {/* Customer */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">
          {caller.name}
        </p>

        <p className="flex items-center gap-1 truncate text-xs text-ink-500 dark:text-navy-400">
          {channelLabel(channel)}
          &middot;

          <span
            className={
              caller.online
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-ink-400'
            }
          >
            {caller.online
              ? 'Online'
              : 'Offline'}
          </span>
        </p>
      </div>

      {/* Status */}
      <Badge
        tone={
          isClosed
            ? 'neutral'
            : 'success'
        }
        className="hidden sm:inline-flex"
      >
        {isClosed
          ? 'Closed'
          : 'Open'}
      </Badge>

      {queue?.name && (
        <Badge tone="brand" className="hidden sm:inline-flex">
          {queue.name}
        </Badge>
      )}

      {channel?.toUpperCase?.() === 'WHATSAPP' && (
        <WindowTimer lastCustomerMessageAt={lastCustomerMessageAt} />
      )}

      {/* Info */}
      <ConversationInfoPopover interaction={interaction} />

      {
        isCurrentUserParticipant &&
        <TransferShareControl interaction={interaction} />
      }

      {/* ================= WORK CODES ================= */}

      {
        isCurrentUserParticipant &&
        <div
        ref={ dropdownRef }
        className="relative hidden sm:block"
      >
        <button
          type="button"
          onClick={ () => {
            setWorkCodeOpen(
              (prev) => !prev
            )

            if (workCodeOpen) {
              setSearch('')
            }
          } }
          className={ `flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
            workCodeOpen
              ? 'border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-700 dark:bg-brand-950/30 dark:text-brand-300'
              : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-200 dark:hover:bg-navy-800'
          }` }
        >
          <span>Tags</span>

          { workCodes.length > 0 && (
            <span
              className="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[9px] font-semibold text-white">
              { workCodes.length }
            </span>
          ) }

          <ChevronDown
            className={ `h-3.5 w-3.5 transition-transform ${
              workCodeOpen
                ? 'rotate-180'
                : ''
            }` }
          />
        </button>

        { workCodeOpen && (
          <div
            className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-xl dark:border-navy-700 dark:bg-navy-900">

            {/* Header */ }
            <div className="border-b border-ink-100 p-3 dark:border-navy-800">
              <p className="text-xs font-semibold text-ink-800 dark:text-white">
                Tags
              </p>

              <p className="mt-0.5 text-[10px] text-ink-400 dark:text-navy-500">
                Select multiple Tags
              </p>

              {/* Search */ }
              <div className="relative mt-2.5">
                <Search
                  className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400 dark:text-navy-500"/>

                <input
                  ref={ searchRef }
                  value={ search }
                  onChange={ (e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  onClick={ (e) =>
                    e.stopPropagation()
                  }
                  placeholder="Search tags..."
                  className="h-8 w-full rounded-md border border-ink-200 bg-ink-50 pl-8 pr-2 text-xs text-ink-800 outline-none placeholder:text-ink-400 focus:border-brand-400 focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white dark:placeholder:text-navy-500"
                />
              </div>
            </div>

            {/* Selected codes */ }
            { workCodes.length > 0 && (
              <div className="border-b border-ink-100 px-3 py-2.5 dark:border-navy-800">
                <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-ink-400 dark:text-navy-500">
                  Selected
                </p>

                <div className="flex flex-wrap gap-1.5">
                  { workCodes.map(
                    (workCode) => (
                      <span
                        key={ String(
                          workCode.id
                        ) }
                        className="inline-flex max-w-full items-center gap-1 rounded-md bg-brand-50 px-2 py-1 text-[10px] font-medium text-brand-700 dark:bg-brand-950/30 dark:text-brand-300"
                      >
                        <span className="max-w-[150px] truncate">
                          { workCode.text }
                        </span>

                        <button
                          type="button"
                          onClick={ () =>
                            handleWorkCodeToggle(
                              workCode
                            )
                          }
                          className="shrink-0 rounded hover:bg-brand-100 dark:hover:bg-brand-900/50"
                        >
                          <X className="h-3 w-3"/>
                        </button>
                      </span>
                    )
                  ) }
                </div>
              </div>
            ) }

            {/* Available */ }
            <div className="max-h-64 overflow-y-auto p-1.5">
              { filteredWorkCodes.length ===
              0 ? (
                <div className="px-3 py-6 text-center">
                  <p className="text-xs text-ink-400 dark:text-navy-500">
                    { availableWorkCodes.length === 0 ? 'No tags created yet' : 'No tags found' }
                  </p>

                  { search && availableWorkCodes.length > 0 && (
                    <p className="mt-1 text-[10px] text-ink-300 dark:text-navy-600">
                      Try another search
                    </p>
                  ) }
                </div>
              ) : (
                filteredWorkCodes.map(
                  (workCode) => {
                    const selected =
                      isWorkCodeSelected(
                        workCode.id
                      )

                    return (
                      <button
                        key={ String(
                          workCode.id
                        ) }
                        type="button"
                        onClick={ () =>
                          handleWorkCodeToggle(
                            workCode
                          )
                        }
                        className={ `flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                          selected
                            ? 'bg-brand-50 dark:bg-brand-950/30'
                            : 'hover:bg-ink-50 dark:hover:bg-navy-800'
                        }` }
                      >
                        {/* Checkbox */ }
                        <span
                          className={ `flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                            selected
                              ? 'border-brand-500 bg-brand-500 text-white'
                              : 'border-ink-300 dark:border-navy-600'
                          }` }
                        >
                          { selected && (
                            <Check className="h-3 w-3"/>
                          ) }
                        </span>

                        {/* Color dot */ }
                        { workCode.color && (
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={ { backgroundColor: workCode.color } }
                          />
                        ) }

                        {/* Text */ }
                        <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink-800 dark:text-navy-100">
                          { workCode.text }
                        </span>
                      </button>
                    )
                  }
                )
              ) }
            </div>
          </div>
        ) }
      </div>

      }

      {/* Conversation action */}
      <button
        onClick={handleConversationAction}
        className="hidden rounded-md px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-100 dark:text-navy-300 dark:hover:bg-navy-800 sm:block"
        title={conversationAction.label}
      >
        {conversationAction.label}
      </button>

      {/* Mobile customer details */}
      <button
        onClick={() =>
          dispatch(
            openCustomerDetailsDrawer()
          )
        }
        className="rounded-full p-1.5 text-ink-500 hover:bg-ink-100 dark:text-navy-300 dark:hover:bg-navy-800 lg:hidden"
        aria-label="View customer details"
      >
        <PanelRightOpen className="h-5 w-5" />
      </button>

      {/* Desktop customer details */}
      <button
        onClick={() =>
          dispatch(
            toggleCustomerDetails()
          )
        }
        className="hidden rounded-full p-1.5 text-ink-500 hover:bg-ink-100 dark:text-navy-300 dark:hover:bg-navy-800 lg:block"
        aria-label={
          collapsed
            ? 'Show customer details'
            : 'Hide customer details'
        }
      >
        {collapsed ? (
          <PanelRightOpen className="h-4 w-4" />
        ) : (
          <PanelRightClose className="h-4 w-4" />
        )}
      </button>
    </div>
  )
}