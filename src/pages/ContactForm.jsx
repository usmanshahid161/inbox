import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, X } from 'lucide-react'
import Button from '../components/common/Button'
import {
  fetchContacts,
  createContact,
  updateContact,
  clearContactSaveError,
  selectContactById,
  selectContactSaving,
  selectContactSaveError
} from '../features/contacts/contactsSlice'
import { selectCurrentUser } from '../features/auth/authSlice'
import { showToast } from '../features/ui/uiSlice'

const inputClass =
  'w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white'
const labelClass = 'text-xs font-medium text-ink-600 dark:text-navy-300'

export default function ContactForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const currentUser = useSelector(selectCurrentUser)

  const editing = useSelector((state) => (isEditing ? selectContactById(state, id) : null))
  const saving = useSelector(selectContactSaving)
  const saveError = useSelector(selectContactSaveError)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    dispatch(fetchContacts())
  }, [dispatch])

  useEffect(() => {
    dispatch(clearContactSaveError())
    if (editing) {
      setName(editing.name || '')
      setPhone(editing.phone || '')
      setEmail(editing.email || '')
      setCompany(editing.company || '')
      setNotes(editing.notes || '')
      setTags(editing.tags || [])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, editing])

  const addTag = (e) => {
    if (e.key !== 'Enter' || !tagInput.trim()) return
    e.preventDefault()
    if (!tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()])
    setTagInput('')
  }

  const removeTag = (tag) => setTags(tags.filter((t) => t !== tag))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      company: company.trim(),
      notes: notes.trim(),
      tags,
      actorName: currentUser?.name
    }

    const action = isEditing ? updateContact({ id, payload }) : createContact(payload)
    dispatch(action).then((res) => {
      if (!res.error) {
        dispatch(showToast({ message: isEditing ? 'Contact updated' : 'Contact created', tone: 'success' }))
        navigate(isEditing ? `/app/contacts/${id}` : '/app/contacts')
      }
    })
  }

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 lg:p-6">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/app/contacts')}
          className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 dark:text-navy-400 dark:hover:bg-navy-800"
          aria-label="Back to contacts"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-ink-900 dark:text-white">
            {isEditing ? 'Edit contact' : 'New contact'}
          </h1>
          <p className="text-xs text-ink-500 dark:text-navy-400">
            {isEditing ? 'Update this contact\'s details.' : 'Add a contact you can link to conversations.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <div className="space-y-1.5">
          <label className={labelClass}>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className={labelClass}>Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 0100" className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Company</label>
          <input value={company} onChange={(e) => setCompany(e.target.value)} className={inputClass} />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Tags</label>
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={addTag}
            placeholder="Type a tag and press Enter"
            className={inputClass}
          />
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2 py-1 text-xs text-ink-700 dark:bg-navy-700 dark:text-navy-200"
                >
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="rounded-full p-0.5 hover:bg-ink-200 dark:hover:bg-navy-600">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Anything worth remembering about this contact"
            className={inputClass}
          />
        </div>

        {saveError && <p className="text-sm text-red-600">{saveError}</p>}

        <div className="flex gap-2 pt-2">
          <Button type="submit" isLoading={saving}>
            {isEditing ? 'Save changes' : 'Create contact'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/app/contacts')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}