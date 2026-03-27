import { useCallback } from 'react'
import { useUIStore } from '@/store/uiStore'
import type { ThemeName } from '@/types'

export function useTheme() {
  const { theme, setTheme } = useUIStore()

  const applyTheme = useCallback(
    (name: ThemeName) => {
      document.documentElement.setAttribute(
        'data-theme',
        name === 'pastel' ? '' : name
      )
      localStorage.setItem('itinera-theme', name)
      setTheme(name)
    },
    [setTheme]
  )

  return { theme, applyTheme }
}
