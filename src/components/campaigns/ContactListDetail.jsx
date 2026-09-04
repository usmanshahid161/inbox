import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Plus, Upload, Trash2, X } from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { Skeleton } from '../common/Loader'
import {
  fetchContacts,
  addContact,
  removeContact,
  importCsv,
  clearImportResult,
  selectContacts,
  selectContactsStatus,
  selectImportResult,
  selectImporting
} from '../../features/campaigns/campaignsSlice'

export default function ContactListDetail({ list, onClose }) {
  const dispatch = useDispatch()
  const contacts = useSelector(selectContacts)
  const status = useSelector(selectContactsStatus)
  const importResult = useSelector(selectImportResult)
  const importing = useSelector(selectImporting)
  const fileInputRef = useRef(null)
  const listId = list._id

  const [phone, setPhone] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  // Free-form — whatever columns this business wants to track per
  // contact (name, city, invoice_no, ...). Which of these line up with
  // a template's variables gets decided later, at campaign-creation.
  const [variableRows, setVariableRows] = useState([{ key: '', value: '' }])
  const [addError, setAddError] = useState(null)

  useEffect(() => {
    dispatch(fetchContacts({ listId }))
    dispatch(clearImportResult())
  }, [dispatch, listId])

  const updateVariableRow = (index, field, value) => {
    setVariableRows((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }
  const addVariableRow = () => setVariableRows((rows) => [...rows, { key: '', value: '' }])
  const removeVariableRow = (index) => setVariableRows((rows) => rows.filter((_, i) => i !== index))

  const handleAdd = async () => {
    if (!phone.trim()) return
    setAddError(null)

    const variables = {}
    variableRows.forEach(({ key, value }) => {
      if (key.trim()) variables[key.trim()] = value
    })

    try {
      await dispatch(
        addContact({ listId, payload: { phone: phone.trim(), variables, mediaUrl: mediaUrl || undefined } })
      ).unwrap()
      setPhone('')
      setMediaUrl('')
      setVariableRows([{ key: '', value: '' }])
    } catch (err) {
      setAddError(err)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) dispatch(importCsv({ listId, file }))
  }

  return (
    <Modal open={Boolean(list)} onClose={onClose} title={`Contacts — ${list.name}`} size="lg">
      <div className="space-y-4">
        {/* Manual add */}
        <div className="rounded-lg border border-ink-100 p-3 dark:border-navy-800">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-400">Add manually</p>

          <div className="flex flex-wrap gap-2">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+92 300 1234567"
              className="min-w-[160px] flex-1 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm dark:border-navy-700 dark:bg-navy-900 dark:text-ink-100"
            />
            <input
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="Media URL (optional)"
              className="min-w-[200px] flex-1 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm dark:border-navy-700 dark:bg-navy-900 dark:text-ink-100"
            />
          </div>

          <div className="mt-2 space-y-1.5">
            <p className="text-[11px] text-ink-400">
              Any fields you like — name, city, invoice_no. What matters for a template gets matched up when you build a campaign.
            </p>
            {variableRows.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={row.key}
                  onChange={(e) => updateVariableRow(i, 'key', e.target.value)}
                  placeholder="field name, e.g. name"
                  className="w-32 rounded-md border border-ink-200 bg-white px-2 py-1 text-xs dark:border-navy-700 dark:bg-navy-900"
                />
                <input
                  value={row.value}
                  onChange={(e) => updateVariableRow(i, 'value', e.target.value)}
                  placeholder="value, e.g. Ali"
                  className="flex-1 rounded-md border border-ink-200 bg-white px-2 py-1 text-xs dark:border-navy-700 dark:bg-navy-900"
                />
                {variableRows.length > 1 && (
                  <button onClick={() => removeVariableRow(i)}>
                    <X className="h-3.5 w-3.5 text-ink-300 hover:text-rose-500" />
                  </button>
                )}
              </div>
            ))}
            <button onClick={addVariableRow} className="flex items-center gap-1 text-xs text-brand-600 hover:underline">
              <Plus className="h-3 w-3" /> Add another field
            </button>
          </div>

          <Button size="sm" icon={Plus} onClick={handleAdd} className="mt-2">Add contact</Button>
          {addError && <p className="mt-1.5 text-xs text-rose-500">{addError}</p>}
        </div>

        {/* CSV import */}
        <div className="rounded-lg border border-dashed border-ink-200 p-3 dark:border-navy-700">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-400">Import CSV</p>
          <p className="mb-2 text-[11px] text-ink-400">
            Must have a <code>phone</code> column. <code>media_url</code> is optional. Any other column becomes a field
            on each contact.
          </p>
          <Button variant="secondary" size="sm" icon={Upload} onClick={() => fileInputRef.current?.click()} isLoading={importing}>
            Choose CSV file
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileSelect} />

          {importResult && !importResult.error && (
            <div className="mt-2 rounded-md bg-emerald-50 p-2 text-xs text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
              Imported {importResult.imported} of {importResult.totalRows} rows.
              {importResult.invalid > 0 && ` ${importResult.invalid} invalid.`}
              {importResult.duplicatesInFile > 0 && ` ${importResult.duplicatesInFile} duplicate in file.`}
              {importResult.duplicatesAlreadyOnList > 0 && ` ${importResult.duplicatesAlreadyOnList} already on list.`}
            </div>
          )}
          {importResult?.error && <p className="mt-2 text-xs text-rose-500">{importResult.error}</p>}
        </div>

        {/* Contacts table */}
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-400">
            Contacts ({contacts.total})
          </p>
          {status === 'loading' ? (
            <div className="space-y-1.5">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-md" />)}
            </div>
          ) : contacts.items.length === 0 ? (
            <p className="py-6 text-center text-xs text-ink-400">No contacts yet.</p>
          ) : (
            <div className="max-h-64 overflow-y-auto scroll-thin rounded-lg border border-ink-100 dark:border-navy-800">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-ink-50 dark:bg-navy-800">
                  <tr>
                    <th className="px-3 py-2 font-medium">Phone</th>
                    <th className="px-3 py-2 font-medium">Fields</th>
                    <th className="px-3 py-2 font-medium">Media</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 dark:divide-navy-800">
                  {contacts.items.map((c) => (
                    <tr key={c._id}>
                      <td className="px-3 py-2">{c.phone}</td>
                      <td className="px-3 py-2 text-ink-500">{Object.entries(c.variables || {}).map(([k, v]) => `${k}: ${v}`).join(', ') || '—'}</td>
                      <td className="px-3 py-2 text-ink-500">{c.mediaUrl ? 'Yes' : '—'}</td>
                      <td className="px-3 py-2 text-right">
                        <button onClick={() => dispatch(removeContact({ listId, entryId: c._id }))}>
                          <Trash2 className="h-3.5 w-3.5 text-ink-300 hover:text-rose-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
