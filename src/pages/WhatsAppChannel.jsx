import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, MoreVertical, Trash2, Settings2, Radio, CheckCircle2, CircleOff } from 'lucide-react'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import Badge from '../components/common/Badge'
import Dropdown, { DropdownItem } from '../components/common/Dropdown'
import EmptyState from '../components/common/EmptyState'
import ChannelIcon from '../components/common/ChannelIcon'
import { Skeleton } from '../components/common/Loader'
import {
  fetchWhatsappNumbers,
  createWhatsappNumber,
  updateWhatsappNumberAssignment,
  subscribeWhatsappNumber,
  unsubscribeWhatsappNumber,
  deleteWhatsappNumber,
  openAddNumberForm,
  closeAddNumberForm,
  openConfigureForm,
  closeConfigureForm,
  selectWhatsappNumbers,
  selectWhatsappNumbersStatus,
  selectIsAddNumberFormOpen,
  selectAddingNumber,
  selectAddNumberError,
  selectIsConfigureFormOpen,
  selectConfiguringNumber,
  selectAssignmentSaving,
  selectAssignmentSaveError,
  selectSubscribing,
  selectSubscribeError
} from '../features/whatsappChannel/whatsappNumbersSlice'
import { fetchQueues, selectQueueOptions } from '../features/queues/queuesSlice'
import { fetchFlows, selectFlowsList } from '../features/flows/flowsSlice'
import { openConfirmDialog, showToast } from '../features/ui/uiSlice'

const inputClass =
  'w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white'
const labelClass = 'text-xs font-medium text-ink-600 dark:text-navy-300'

function AddNumberModal() {
  const dispatch = useDispatch()
  const open = useSelector(selectIsAddNumberFormOpen)
  const adding = useSelector(selectAddingNumber)
  const addError = useSelector(selectAddNumberError)

  const [phoneNumber, setPhoneNumber] = useState('')
  const [displayName, setDisplayName] = useState('')

  useEffect(() => {
    if (open) {
      setPhoneNumber('')
      setDisplayName('')
    }
  }, [open])

  const handleSubmit = () => {
    if (!phoneNumber.trim() || !displayName.trim()) return
    dispatch(createWhatsappNumber({ phoneNumber: phoneNumber.trim(), displayName: displayName.trim() }))
  }

  return (
    <Modal
      open={open}
      onClose={() => dispatch(closeAddNumberForm())}
      title="Add WhatsApp number"
      footer={
        <>
          <Button variant="secondary" onClick={() => dispatch(closeAddNumberForm())}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={adding}>
            Add number
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className={labelClass}>Phone number</label>
          <input
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1 312 555 0148"
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>Display name</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Support Line"
            className={inputClass}
          />
        </div>
        <p className="text-xs text-ink-400 dark:text-navy-500">
          After this you'll assign a queue (required) and, optionally, a flow — then subscribe the number.
        </p>
        {addError && <p className="text-xs text-red-600">{addError}</p>}
      </div>
    </Modal>
  )
}

function ConfigureNumberModal() {
  const dispatch = useDispatch()
  const open = useSelector(selectIsConfigureFormOpen)
  const number = useSelector(selectConfiguringNumber)
  const saving = useSelector(selectAssignmentSaving)
  const saveError = useSelector(selectAssignmentSaveError)
  const subscribing = useSelector(selectSubscribing)
  const subscribeError = useSelector(selectSubscribeError)
  const queueOptions = useSelector(selectQueueOptions)
  const flows = useSelector(selectFlowsList)

  const [queue, setQueue] = useState('')
  const [flow, setFlow] = useState('')

  useEffect(() => {
    if (open) {
      setQueue(number?.queue || '')
      setFlow(number?.flow || '')
    }
  }, [open, number])

  const handleSave = () => {
    if (!queue) return
    dispatch(
      updateWhatsappNumberAssignment({
        id: number._id,
        payload: { queue, flow: flow || null }
      })
    ).then((res) => {
      if (!res.error) dispatch(showToast({ message: 'Assignment saved', tone: 'success' }))
    })
  }

  const handleSubscribe = () => {
    const doSubscribe = () => {
      dispatch(subscribeWhatsappNumber(number._id)).then((res) => {
        if (!res.error) dispatch(showToast({ message: 'Number subscribed', tone: 'success' }))
      })
    }

    // Meta only ever delivers a number's webhook to whichever subscription
    // is currently active for it — subscribing again immediately moves
    // delivery here and silently drops whatever was subscribed before
    // (this workspace or a different system entirely). Confirm first so
    // that's never accidental.
    if (number.subscribed) {
      dispatch(
        openConfirmDialog({
          title: 'Re-subscribe this number?',
          description:
            'A WhatsApp number can only be subscribed in one place at a time. Re-subscribing will move webhook delivery here and immediately disconnect whatever was subscribed before — including a different workspace or system, if that\'s where it currently points.',
          confirmLabel: 'Re-subscribe',
          tone: 'danger',
          onConfirm: doSubscribe
        })
      )
    } else {
      doSubscribe()
    }
  }

  const handleUnsubscribe = () => {
    dispatch(
      openConfirmDialog({
        title: 'Unsubscribe this number?',
        description:
          'This number will stop receiving WhatsApp messages here entirely, until you subscribe it again.',
        confirmLabel: 'Unsubscribe',
        tone: 'danger',
        onConfirm: () => {
          dispatch(unsubscribeWhatsappNumber(number._id)).then((res) => {
            if (!res.error) dispatch(showToast({ message: 'Number unsubscribed', tone: 'default' }))
          })
        }
      })
    )
  }

  if (!number) return null

  const hasUnsavedQueueChanges = queue !== (number.queue || '') || flow !== (number.flow || '')

  return (
    <Modal
      open={open}
      onClose={() => dispatch(closeConfigureForm())}
      title={`Configure — ${number.displayName}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={() => dispatch(closeConfigureForm())}>
            Close
          </Button>
          {number.subscribed && (
            <Button variant="secondary" onClick={handleUnsubscribe} isLoading={subscribing} icon={CircleOff}>
              Unsubscribe
            </Button>
          )}
          <Button variant="secondary" onClick={handleSave} isLoading={saving} disabled={!queue}>
            Save assignment
          </Button>
          <Button
            onClick={handleSubscribe}
            isLoading={subscribing}
            disabled={!queue || hasUnsavedQueueChanges}
            icon={number.subscribed ? CheckCircle2 : Radio}
          >
            {number.subscribed ? 'Re-subscribe' : 'Subscribe'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 text-xs dark:bg-navy-800">
          <span className="text-ink-500 dark:text-navy-400">{number.phoneNumber}</span>
          <Badge tone={number.subscribed ? 'success' : 'neutral'}>
            {number.subscribed ? 'Subscribed' : 'Not subscribed'}
          </Badge>
        </div>
        <p className="text-xs text-ink-400 dark:text-navy-500">
          Only one place can be subscribed to a number at a time — Meta delivers its webhook there exclusively.
          Subscribing here will take over delivery even if the number is currently pointed elsewhere.
        </p>

        <div className="space-y-1.5">
          <label className={labelClass}>Queue (required — one per number, this drives message routing)</label>
          <select value={queue} onChange={(e) => setQueue(e.target.value)} className={inputClass}>
            <option value="">Select a queue...</option>
            {queueOptions.map((q) => (
              <option key={q.id} value={q.id}>
                {q.label}
              </option>
            ))}
          </select>
          {queueOptions.length === 0 && (
            <p className="text-xs text-ink-400 dark:text-navy-500">
              No queues created yet — add queues first from the Queues module.
            </p>
          )}
        </div>
        {!queue && <p className="text-xs text-red-600">Pick a queue before subscribing.</p>}

        <div className="space-y-1.5">
          <label className={labelClass}>Flow (optional — only one active at a time for this number)</label>
          <select value={flow} onChange={(e) => setFlow(e.target.value)} className={inputClass}>
            <option value="">No flow</option>
            {flows?.map((f) => (
              <option key={f._id} value={f._id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        {hasUnsavedQueueChanges && (
          <p className="text-xs text-amber-600">You have unsaved changes — save the assignment before subscribing.</p>
        )}
        {saveError && <p className="text-xs text-red-600">{saveError}</p>}
        {subscribeError && <p className="text-xs text-red-600">{subscribeError}</p>}
      </div>
    </Modal>
  )
}

export default function WhatsAppChannel() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const numbers = useSelector(selectWhatsappNumbers)
  const status = useSelector(selectWhatsappNumbersStatus)
  const queueOptions = useSelector(selectQueueOptions)

  useEffect(() => {
    dispatch(fetchWhatsappNumbers())
    dispatch(fetchQueues())
    dispatch(fetchFlows())
  }, [dispatch])

  const handleDelete = (number) => {
    dispatch(
      openConfirmDialog({
        title: 'Remove number',
        description: `"${number.displayName}" (${number.phoneNumber}) will stop receiving messages through this workspace.`,
        confirmLabel: 'Remove',
        tone: 'danger',
        onConfirm: () => {
          dispatch(deleteWhatsappNumber(number._id)).then((res) => {
            if (!res.error) dispatch(showToast({ message: 'Number removed', tone: 'default' }))
          })
        }
      })
    )
  }

  const handleUnsubscribeFromRow = (number) => {
    dispatch(
      openConfirmDialog({
        title: 'Unsubscribe this number?',
        description: 'This number will stop receiving WhatsApp messages here entirely, until you subscribe it again.',
        confirmLabel: 'Unsubscribe',
        tone: 'danger',
        onConfirm: () => {
          dispatch(unsubscribeWhatsappNumber(number._id)).then((res) => {
            if (!res.error) dispatch(showToast({ message: 'Number unsubscribed', tone: 'default' }))
          })
        }
      })
    )
  }

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 lg:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/channels')}
            className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 dark:text-navy-400 dark:hover:bg-navy-800"
            aria-label="Back to channels"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <ChannelIcon channel="WHATSAPP" size="lg" />
          <div>
            <h1 className="text-base font-semibold text-ink-900 dark:text-white">WhatsApp</h1>
            <p className="text-xs text-ink-500 dark:text-navy-400">Numbers connected through the WhatsApp Cloud API</p>
          </div>
        </div>
        <Button icon={Plus} onClick={() => dispatch(openAddNumberForm())}>
          Add number
        </Button>
      </div>

      {status === 'loading' && numbers.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : numbers.length === 0 ? (
        <EmptyState
          icon={Radio}
          title="No numbers connected"
          description="Add a WhatsApp number, assign it a queue, and subscribe it to start receiving messages."
          action={
            <Button icon={Plus} onClick={() => dispatch(openAddNumberForm())}>
              Add number
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink-100 bg-white dark:border-navy-800 dark:bg-navy-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wide text-ink-500 dark:border-navy-800 dark:bg-navy-800/60 dark:text-navy-400">
              <tr>
                <th className="px-4 py-3 font-medium">Number</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Queue</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Flow</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-navy-800">
              {numbers.map((number) => (
                <tr key={number._id} className="hover:bg-ink-50 dark:hover:bg-navy-800/60">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-900 dark:text-white">{number.displayName}</p>
                    <p className="text-xs text-ink-500 dark:text-navy-400">{number.phoneNumber}</p>
                  </td>
                  <td className="hidden px-4 py-3 text-ink-500 dark:text-navy-400 sm:table-cell">
                    {queueOptions.find((q) => q.id === number.queue)?.label || '—'}
                  </td>
                  <td className="hidden px-4 py-3 text-ink-500 dark:text-navy-400 md:table-cell">
                    {number.flow ? 'Assigned' : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={number.subscribed ? 'success' : 'neutral'}>
                      {number.subscribed ? 'Subscribed' : 'Not subscribed'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Dropdown
                      align="right"
                      trigger={() => (
                        <button className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 dark:text-navy-400 dark:hover:bg-navy-800">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      )}
                    >
                      <DropdownItem icon={Settings2} onClick={() => dispatch(openConfigureForm(number._id))}>
                        Configure
                      </DropdownItem>
                      {number.subscribed && (
                        <DropdownItem icon={CircleOff} onClick={() => handleUnsubscribeFromRow(number)}>
                          Unsubscribe
                        </DropdownItem>
                      )}
                      <DropdownItem icon={Trash2} danger onClick={() => handleDelete(number)}>
                        Remove
                      </DropdownItem>
                    </Dropdown>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddNumberModal />
      <ConfigureNumberModal />
    </div>
  )
}
