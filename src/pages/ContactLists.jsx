import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Plus, Trash2, Users } from 'lucide-react'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import { Skeleton } from '../components/common/Loader'
import ContactListDetail from '../components/campaigns/ContactListDetail'
import {
  fetchContactLists,
  createContactList,
  deleteContactList,
  selectContactLists,
  selectContactListsStatus
} from '../features/campaigns/campaignsSlice'

function CreateListModal({ open, onClose }) {
  const dispatch = useDispatch()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleCreate = async () => {
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      await dispatch(createContactList({ name: name.trim() })).unwrap()
      setName('')
      onClose()
    } catch (err) {
      setError(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New contact list"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} isLoading={saving}>Create</Button>
        </>
      }
    >
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-ink-600 dark:text-navy-300">List name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Karachi customers"
          autoFocus
          className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-navy-700 dark:bg-navy-900 dark:text-ink-100"
        />
        <p className="text-[11px] text-ink-400">
          Just a name — this list isn't tied to any template. Reuse it for as many campaigns as you like.
        </p>
        {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
      </div>
    </Modal>
  )
}

export default function ContactLists() {
  const dispatch = useDispatch()
  const lists = useSelector(selectContactLists)
  const status = useSelector(selectContactListsStatus)
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedList, setSelectedList] = useState(null)

  useEffect(() => {
    dispatch(fetchContactLists())
  }, [dispatch])

  const handleDelete = (e, id) => {
    e.stopPropagation()
    if (window.confirm('Delete this list and all its contacts? This cannot be undone.')) {
      dispatch(deleteContactList(id))
    }
  }

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 lg:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900 dark:text-white">Contact lists</h1>
          <p className="text-sm text-ink-500 dark:text-navy-400">Reusable audiences — pick a template when you build a campaign, not here.</p>
        </div>
        <Button icon={Plus} onClick={() => setCreateOpen(true)}>New list</Button>
      </div>

      {status === 'loading' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      )}

      {status === 'succeeded' && lists.length === 0 && (
        <p className="py-12 text-center text-sm text-ink-400 dark:text-navy-500">No contact lists yet — create one to get started.</p>
      )}

      {status === 'succeeded' && lists.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <button
              key={list._id}
              onClick={() => setSelectedList(list)}
              className="rounded-xl border border-ink-100 bg-white p-4 text-left hover:border-ink-200 hover:shadow-sm dark:border-navy-800 dark:bg-navy-900 dark:hover:border-navy-700"
            >
              <div className="flex items-start justify-between">
                <p className="font-medium text-ink-900 dark:text-white">{list.name}</p>
                <Trash2
                  className="h-4 w-4 shrink-0 text-ink-300 hover:text-rose-500"
                  onClick={(e) => handleDelete(e, list._id)}
                />
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-500 dark:text-navy-400">
                <Users className="h-3.5 w-3.5" /> {list.contactCount} contacts
              </p>
            </button>
          ))}
        </div>
      )}

      <CreateListModal open={createOpen} onClose={() => setCreateOpen(false)} />

      {selectedList && (
        <ContactListDetail list={selectedList} onClose={() => setSelectedList(null)} />
      )}
    </div>
  )
}
