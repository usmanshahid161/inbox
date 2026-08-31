import { useEffect, useState } from 'react'

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = (e) => setMatches(e.matches)
    mql.addEventListener('change', handler)
    setMatches(mql.matches)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}

// Convenience breakpoints matching the Tailwind config defaults.
export function useIsTablet() {
  return useMediaQuery('(max-width: 1024px)')
}
export function useIsMobile() {
  return useMediaQuery('(max-width: 767px)')
}
