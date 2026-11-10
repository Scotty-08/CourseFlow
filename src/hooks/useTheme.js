import { useCallback, useState } from 'react'

const KEY = 'courseflow:theme'

function currentTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
}

/** Dark/light switch. index.html sets the first value before paint; this keeps it in sync. */
export function useTheme() {
  const [theme, setTheme] = useState(currentTheme)

  const toggle = useCallback(() => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    try {
      window.localStorage.setItem(KEY, next)
    } catch {
      // Storage blocked: the theme still changes for this visit.
    }
    setTheme(next)
  }, [])

  return { theme, toggle }
}
