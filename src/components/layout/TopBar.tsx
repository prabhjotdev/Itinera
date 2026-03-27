import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { SyncStatusBadge } from '@/components/ui/SyncStatusBadge'
import { cn } from '@/lib/utils/cn'

interface TopBarProps {
  title: string
  showBack?: boolean
  actions?: React.ReactNode
  className?: string
}

export function TopBar({ title, showBack, actions, className }: TopBarProps) {
  const navigate = useNavigate()

  return (
    <header
      className={cn(
        'flex items-center gap-3 px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)]',
        'sticky top-0 z-30',
        className
      )}
    >
      {showBack && (
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 -ml-1.5 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors"
        >
          <ChevronLeft size={20} className="text-[var(--color-text)]" />
        </button>
      )}

      <h1 className="flex-1 text-base font-semibold text-[var(--color-text)] truncate">
        {title}
      </h1>

      <SyncStatusBadge />

      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
