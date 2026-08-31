import { FileText, Download, Play } from 'lucide-react'
import { formatFileSize } from '../../utils/formatters'
import { MESSAGE_TYPE } from '../../utils/constants'

import {
  MapPin,
  User,
  Phone,
  ExternalLink,
} from 'lucide-react'

const LocationPreview = ({ data = {} }) => {
  const latitude = data?.latitude
  const longitude = data?.longitude

  const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`

  return (
    <div className="w-full max-w-sm overflow-hidden rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-navy-900">

      {/* Map placeholder */}
      <a
        href={mapUrl}
        target="_blank"
        rel="noreferrer"
        className="flex h-36 items-center justify-center bg-ink-100 dark:bg-navy-800"
      >
        <div className="flex flex-col items-center gap-2">
          <MapPin className="h-10 w-10 text-red-500" />

          <span className="text-xs font-medium">
            View location
          </span>
        </div>
      </a>

      {/* Location details */}
      <div className="flex items-start gap-3 p-3">

        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

        <div className="min-w-0 flex-1">

          {data?.title && (
            <p className="text-sm font-semibold">
              {data?.title}
            </p>
          )}

          {data?.url && (
            <p className="mt-0.5 text-xs opacity-60">
              {data?.url}
            </p>
          )}

          <p className="mt-1 text-[10px] opacity-50">
            {latitude}, {longitude}
          </p>

        </div>

        <a
          href={mapUrl}
          target="_blank"
          rel="noreferrer"
          className="shrink-0"
        >
          <ExternalLink className="h-4 w-4 opacity-50" />
        </a>

      </div>
    </div>
  )
}

const ContactPreview = ({ data = {} }) => {
  const name =
    data?.name ||
    data?.displayName ||
    data?.contact?.name ||
    'Unknown contact'

  const phone =
    data?.phone ||
    data?.phoneNumber ||
    data?.contact?.phone ||
    data?.contact?.phoneNumber

  return (
    <div className="flex w-full max-w-sm items-center gap-3 rounded-xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-navy-900">

      {/* Avatar */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink-100 dark:bg-navy-800">
        <User className="h-5 w-5 opacity-60" />
      </div>

      {/* Information */}
      <div className="min-w-0 flex-1">

        <p className="truncate text-sm font-semibold">
          {name}
        </p>

        {phone && (
          <div className="mt-1 flex items-center gap-1.5">
            <Phone className="h-3 w-3 opacity-50" />

            <a
              href={`tel:${phone}`}
              className="text-xs opacity-60 hover:underline"
            >
              {phone}
            </a>
          </div>
        )}

      </div>

    </div>
  )
}

export default function AttachmentPreview({ attachment }) {
  const { type, size, data } = attachment
  const url = data?.url

  if (type === MESSAGE_TYPE.IMAGE) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg">
        <img src={url} alt={ 'Attachment'} className="max-h-64 w-full max-w-xs object-cover" loading="lazy" />
      </a>
    )
  }

  if (type === MESSAGE_TYPE.VIDEO) {
    return (
      <div className="relative max-w-xs overflow-hidden rounded-lg bg-ink-900">
        <video src={url} controls className="max-h-64 w-full" preload="metadata" />
      </div>
    )
  }

  if (type === MESSAGE_TYPE.AUDIO) {
    return (
      <div className="flex w-full max-w-xs items-center gap-2 rounded-lg bg-black/5 px-3 py-2.5">
        <audio src={url} controls  />
      </div>
    )
  }

  if(type === MESSAGE_TYPE.LOCATION) {
    return (<LocationPreview data={data} />)
  }

  if(type === MESSAGE_TYPE.CONTACT) {
    return (<ContactPreview data={data} />)
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex max-w-xs items-center gap-2.5 rounded-lg border border-black/10 bg-black/5 px-3 py-2.5 hover:bg-black/10"
    >
      <FileText className="h-6 w-6 shrink-0 opacity-70" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{'Document'}</p>
        {/*{size && <p className="text-[11px] opacity-60">{formatFileSize(size)}</p>}*/}
      </div>
      {/*<Download className="h-3.5 w-3.5 shrink-0 opacity-60" />*/}
    </a>
  )
}
