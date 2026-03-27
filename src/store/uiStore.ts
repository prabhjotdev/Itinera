import { create } from 'zustand'
import type { ThemeName } from '@/types'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
}

interface UIState {
  theme: ThemeName
  isSidebarOpen: boolean
  toasts: Toast[]
  setTheme: (theme: ThemeName) => void
  toggleSidebar: () => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'pastel',
  isSidebarOpen: false,
  toasts: [],
  setTheme: (theme) => set({ theme }),
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  addToast: (toast) =>
    set((s) => ({
      toasts: [
        ...s.toasts,
        { ...toast, id: crypto.randomUUID() },
      ],
    })),
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
