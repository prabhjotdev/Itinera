import { useUIStore } from '@/store/uiStore'

export function useToast() {
  const { addToast } = useUIStore()

  return {
    success: (message: string) => addToast({ type: 'success', message }),
    error: (message: string) => addToast({ type: 'error', message }),
    info: (message: string) => addToast({ type: 'info', message }),
    warning: (message: string) => addToast({ type: 'warning', message }),
  }
}
