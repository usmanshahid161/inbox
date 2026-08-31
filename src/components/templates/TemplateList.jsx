import { useDispatch, useSelector } from 'react-redux'
import { Pencil, Trash2, Send, Eye, FileText, Image as ImageIcon, MoreVertical } from 'lucide-react'
import { useState } from 'react'
import {
  selectFilteredTemplates,
  selectTemplatesStatus,
  openEditForm,
  deleteTemplate,
  submitTemplateForReview,
  selectTemplate,
} from '../../features/templates/templatesSlice'
import { TemplateStatusBadge, TemplateCategoryBadge, QualityDot } from './TemplateStatusBadge'
import { isTemplateEditable } from '../../features/templates/waConstants'
import EmptyState from '../common/EmptyState'

function formatDate(dateString) {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function RowMenu({ template, onEdit, onDelete, onSubmit, onPreview }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-600 dark:hover:bg-navy-800 dark:hover:text-ink-200"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-44 overflow-hidden rounded-lg border border-ink-100 bg-white py-1 shadow-lg dark:border-navy-700 dark:bg-navy-900">
          <button
            onClick={onPreview}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-navy-800"
          >
            <Eye className="h-4 w-4" /> Preview
          </button>
          {isTemplateEditable(template.status) && (
            <button
              onClick={onEdit}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-navy-800"
            >
              <Pencil className="h-4 w-4" /> Edit
            </button>
          )}
          {template?.status === 'DRAFT' && (
            <button
              onClick={onSubmit}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-navy-800"
            >
              <Send className="h-4 w-4" /> Submit for review
            </button>
          )}
          <button
            onClick={onDelete}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      )}
    </div>
  )
}

export default function TemplateList() {
  const dispatch = useDispatch()
  const templates = useSelector(selectFilteredTemplates)
  const status = useSelector(selectTemplatesStatus)

  if (status === 'loading') {
    return (
      <div className="flex flex-1 items-center justify-center p-10 text-sm text-ink-400">
        Loading templates...
      </div>
    )
  }

  if (!templates?.length) {
    return (
      <EmptyState
        icon={FileText}
        title="No templates yet"
        description="Create your first WhatsApp message template to get started."
      />
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 bg-white dark:bg-navy-950">
          <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400 dark:border-navy-800">
            <th className="px-4 py-3 font-medium">Template</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium">Language</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Quality</th>
            <th className="px-4 py-3 font-medium">Created</th>
            <th className="px-4 py-3 font-medium">Updated</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100 dark:divide-navy-800">
          {templates.map((t) => (
            <tr
              key={t._id}
              className="cursor-pointer hover:bg-ink-50 dark:hover:bg-navy-900/60"
              onClick={() => dispatch(selectTemplate(t._id))}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {t.components?.header?.type === 'IMAGE' ? (
                    <ImageIcon className="h-4 w-4 shrink-0 text-ink-400" />
                  ) : (
                    <FileText className="h-4 w-4 shrink-0 text-ink-400" />
                  )}
                  <div>
                    <p className="font-medium text-ink-900 dark:text-ink-50">{t.name}</p>
                    {t.status === 'REJECTED' && t.rejectionReason && (
                      <p className="mt-0.5 max-w-xs truncate text-xs text-rose-500">{t.rejectionReason}</p>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <TemplateCategoryBadge category={t.category} />
              </td>
              <td className="px-4 py-3 text-ink-600 dark:text-ink-300">{t.language}</td>
              <td className="px-4 py-3">
                <TemplateStatusBadge status={t.status} />
              </td>
              <td className="px-4 py-3">
                <QualityDot rating={t.qualityRating} />
              </td>
              <td className="px-4 py-3 text-ink-500 dark:text-ink-400">{formatDate(t.createdAt)}</td>
              <td className="px-4 py-3 text-ink-500 dark:text-ink-400">{formatDate(t.updatedAt)}</td>
              <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                <RowMenu
                  template={t}
                  onPreview={() => dispatch(selectTemplate(t._id))}
                  onEdit={() => dispatch(openEditForm(t._id))}
                  onSubmit={() => dispatch(submitTemplateForReview(t._id))}
                  onDelete={() => {
                    if (confirm(`Delete template "${t.name}"? This cannot be undone.`)) {
                      dispatch(deleteTemplate(t._id))
                    }
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
