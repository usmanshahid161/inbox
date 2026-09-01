import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, MoreVertical, Trash2, Pencil, Users, Building2 } from 'lucide-react'
import Button from '../components/common/Button'
import Dropdown, { DropdownItem } from '../components/common/Dropdown'
import EmptyState from '../components/common/EmptyState'
import { Skeleton } from '../components/common/Loader'
import Avatar from '../components/common/Avatar'
import { useDebounce } from '../hooks/useDebounce'
import {
  fetchContacts,
  deleteContact,
  selectAllContacts,
  selectContactsStatus
} from '../features/contacts/contactsSlice'
import { openConfirmDialog, showToast } from '../features/ui/uiSlice'

export default function Contacts() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const contacts = useSelector(selectAllContacts)
  const status = useSelector(selectContactsStatus)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 300)

  useEffect(() => {
    dispatch(fetchContacts(debouncedSearch ? { search: debouncedSearch } : undefined))
  }, [dispatch, debouncedSearch])

  const handleDelete = (contact) => {
    dispatch(
      openConfirmDialog({
        title: 'Delete contact',
        description: `"${contact.name}" and their activity history will be permanently removed. Linked conversations stay, just no longer tied to this contact.`,
        confirmLabel: 'Delete',
        tone: 'danger',
        onConfirm: () => {
          dispatch(deleteContact(contact._id)).then((res) => {
            if (!res.error) dispatch(showToast({ message: 'Contact deleted', tone: 'default' }))
          })
        }
      })
    )
  }

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 lg:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search contacts..."
            className="w-full rounded-lg border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
          />
        </div>
        <Button icon={Plus} onClick={() => navigate('/app/contacts/new')}>
          New contact
        </Button>
      </div>

      {status === 'loading' && contacts.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No contacts yet"
          description="Create contacts to link with conversations and keep track of who you're talking to."
          action={
            <Button icon={Plus} onClick={() => navigate('/app/contacts/new')}>
              New contact
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink-100 bg-white dark:border-navy-800 dark:bg-navy-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wide text-ink-500 dark:border-navy-800 dark:bg-navy-800/60 dark:text-navy-400">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Phone</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Email</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">Company</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Conversations</th>
              <th className="px-4 py-3" />
            </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-navy-800">
            {contacts.map((contact) => (
              <tr
                key={contact._id}
                onClick={() => navigate(`/app/contacts/${contact._id}`)}
                className="cursor-pointer hover:bg-ink-50 dark:hover:bg-navy-800/60"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={contact.name} color="#219c89" size="sm" />
                    <p className="font-medium text-ink-900 dark:text-white">{contact.name}</p>
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-ink-500 dark:text-navy-400 sm:table-cell">
                  {contact.phone || '—'}
                </td>
                <td className="hidden px-4 py-3 text-ink-500 dark:text-navy-400 md:table-cell">
                  {contact.email || '—'}
                </td>
                <td className="hidden px-4 py-3 text-ink-500 dark:text-navy-400 lg:table-cell">
                  {contact.company || '—'}
                </td>
                <td className="hidden px-4 py-3 text-ink-500 dark:text-navy-400 sm:table-cell">
                  {contact.interactions?.length || 0}
                </td>
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <Dropdown
                    align="right"
                    trigger={() => (
                      <button className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 dark:text-navy-400 dark:hover:bg-navy-800">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    )}
                  >
                    <DropdownItem icon={Pencil} onClick={() => navigate(`/app/contacts/${contact._id}/edit`)}>
                      Edit
                    </DropdownItem>
                    <DropdownItem icon={Trash2} danger onClick={() => handleDelete(contact)}>
                      Delete
                    </DropdownItem>
                  </Dropdown>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}