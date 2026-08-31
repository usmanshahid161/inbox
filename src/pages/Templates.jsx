import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { LayoutTemplate } from 'lucide-react'
import TemplateFilters from '../components/templates/TemplateFilters'
import TemplateList from '../components/templates/TemplateList'
import TemplateFormModal from '../components/templates/TemplateFormModal'
import TemplatePreview from '../components/templates/TemplatePreview'
import EmptyState from '../components/common/EmptyState'
import {
  fetchTemplates,
  selectAllTemplates,
  selectSelectedTemplateId,
  selectTemplatesStatus,
} from '../features/templates/templatesSlice'

export default function Templates() {
  const dispatch = useDispatch()
  const status = useSelector(selectTemplatesStatus)
  const templates = useSelector(selectAllTemplates)
  const selectedId = useSelector(selectSelectedTemplateId)
  const selectedTemplate = templates?.find((t) => t?._id === selectedId)

  useEffect(() => {
    if (status === 'idle') dispatch(fetchTemplates())
  }, [status, dispatch])

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-ink-100 px-5 py-4 dark:border-navy-800">
          <LayoutTemplate className="h-5 w-5 text-emerald-600" />
          <div>
            <h1 className="text-base font-semibold text-ink-900 dark:text-ink-50">WhatsApp Templates</h1>
            <p className="text-xs text-ink-400">Create and manage message templates for WhatsApp Business</p>
          </div>
        </div>

        <TemplateFilters />
        <TemplateList />
      </div>

      {/* Side preview panel for the selected template */}
      <div className="hidden w-80 shrink-0 border-l border-ink-100 dark:border-navy-800 lg:block">
        {selectedTemplate ? (
          <TemplatePreview template={selectedTemplate} />
        ) : (
          <EmptyState
            icon={LayoutTemplate}
            title="No template selected"
            description="Select a template from the list to preview how it looks on WhatsApp."
          />
        )}
      </div>

      <TemplateFormModal />
    </div>
  )
}
