import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Modal({ isOpen, onClose, title, children, size = 'md', className }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
    }
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative w-full bg-[var(--color-surface)] shadow-modal z-10',
          'rounded-t-xl sm:rounded-xl',
          'max-h-[90vh] overflow-y-auto',
          {
            'sm:max-w-sm': size === 'sm',
            'sm:max-w-md': size === 'md',
            'sm:max-w-lg': size === 'lg',
          },
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
            <h2 className="text-base font-semibold text-[var(--color-text)]">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-[var(--color-surface-2)] transition-colors"
            >
              <X size={18} className="text-[var(--color-text-muted)]" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  )
}
