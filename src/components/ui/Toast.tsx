import { useEffect } from 'react'
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'
import { useUIStore, type Toast } from '@/store/uiStore'
import { cn } from '@/lib/utils/cn'

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useUIStore()

  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), 4000)
    return () => clearTimeout(timer)
  }, [toast.id, removeToast])

  const icons = {
    success: <CheckCircle size={16} className="text-green-500" />,
    error: <AlertCircle size={16} className="text-red-500" />,
    info: <Info size={16} className="text-blue-500" />,
    warning: <AlertTriangle size={16} className="text-yellow-500" />,
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 bg-[var(--color-surface)] border border-[var(--color-border)]',
        'shadow-modal rounded-lg px-4 py-3 min-w-[250px] max-w-sm animate-in slide-in-from-bottom-4'
      )}
    >
      {icons[toast.type]}
      <p className="text-sm text-[var(--color-text)] flex-1">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const { toasts } = useUIStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 sm:bottom-6 sm:right-4 sm:left-auto sm:translate-x-0">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
