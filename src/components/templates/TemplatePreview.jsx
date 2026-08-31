import { Image as ImageIcon, FileText as FileIcon, Video, MapPin, Phone, Link2, Copy } from 'lucide-react'

function fillExamples(text = '', examples = []) {
  return text.replace(/\{\{\s*(\d+)\s*\}\}/g, (_, n) => {
    const val = examples[Number(n) - 1]
    return val ? val : `[${n}]`
  })
}

export default function TemplatePreview({ template }) {
  const header = template?.components?.header
  const body = template?.components?.body
  const footer = template?.components?.footer
  const buttons = template?.components?.buttons || []

  const bodyText = fillExamples(body?.text || 'Your message body will appear here...', body?.examples)
  const headerText = header?.type === 'TEXT' ? fillExamples(header.text || '', header.example ? [header.example] : []) : ''

  return (
    <div className="flex h-full flex-col items-center justify-start rounded-xl bg-[#0b141a] p-6">
      <div className="w-full max-w-sm rounded-2xl bg-[#efeae2] p-3 shadow-xl dark:bg-[#0b141a]">
        <div className="relative rounded-lg bg-white p-3 shadow-sm before:absolute before:-left-2 before:top-3 before:h-3 before:w-3 before:rotate-45 before:bg-white">
          {header?.type === 'TEXT' && headerText && (
            <p className="mb-1.5 text-[15px] font-bold text-ink-900">{headerText || 'Header text'}</p>
          )}
          {header?.type === 'IMAGE' && (
            <div className="mb-2 flex h-32 items-center justify-center rounded-md bg-ink-100 text-ink-400">
              <ImageIcon className="h-8 w-8" />
            </div>
          )}
          {header?.type === 'VIDEO' && (
            <div className="mb-2 flex h-32 items-center justify-center rounded-md bg-ink-100 text-ink-400">
              <Video className="h-8 w-8" />
            </div>
          )}
          {header?.type === 'DOCUMENT' && (
            <div className="mb-2 flex items-center gap-2 rounded-md bg-ink-100 p-3 text-ink-500">
              <FileIcon className="h-6 w-6" />
              <span className="text-xs">document.pdf</span>
            </div>
          )}
          {header?.type === 'LOCATION' && (
            <div className="mb-2 flex h-28 items-center justify-center rounded-md bg-ink-100 text-ink-400">
              <MapPin className="h-8 w-8" />
            </div>
          )}

          <p className="whitespace-pre-wrap text-[14.5px] leading-snug text-ink-900">
            {bodyText || 'Your message body will appear here...'}
          </p>

          {footer?.text && <p className="mt-1.5 text-xs text-ink-400">{footer.text}</p>}

          <div className="mt-1 flex justify-end">
            <span className="text-[11px] text-ink-400">12:30 PM</span>
          </div>
        </div>

        {buttons.length > 0 && (
          <div className="mt-1.5 space-y-1">
            {buttons.map((b, i) => (
              <div
                key={i}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-white py-2 text-sm font-medium text-sky-600 shadow-sm"
              >
                {b.type === 'URL' && <Link2 className="h-3.5 w-3.5" />}
                {b.type === 'PHONE_NUMBER' && <Phone className="h-3.5 w-3.5" />}
                {b.type === 'COPY_CODE' && <Copy className="h-3.5 w-3.5" />}
                {b.text || 'Button'}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
