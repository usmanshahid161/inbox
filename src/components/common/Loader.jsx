import { Loader2 } from 'lucide-react'

export default function Loader({ label = 'Loading', size = 'md', fullHeight = false }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' }
  return (
    <div className={`flex items-center justify-center gap-2 text-ink-400 ${fullHeight ? 'h-full py-16' : 'py-8'}`}>
      <Loader2 className={`${sizes[size]} animate-spin`} />
      {label && <span className="text-sm">{label}</span>}
    </div>
  )
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-ink-100 ${className}`} />
}
