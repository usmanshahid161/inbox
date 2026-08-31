import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectTheme } from '../features/ui/uiSlice'

// Applies the current theme to <html> so Tailwind's `dark:` variants take
// effect app-wide, and keeps the browser chrome color in sync.
export function useThemeEffect() {
  const theme = useSelector(selectTheme)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])
}
