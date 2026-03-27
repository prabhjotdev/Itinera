import { Cloud, CloudOff, RefreshCw } from 'lucide-react'
import { useSync } from '@/hooks/useSync'
import { cn } from '@/lib/utils/cn'

export function SyncStatusBadge() {
  const { isOnline, isSyncing, queueCount } = useSync()

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
        <CloudOff size={13} className="text-yellow-500" />
        <span>Offline</span>
      </div>
    )
  }

  if (isSyncing) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
        <RefreshCw size={13} className="animate-spin text-[var(--color-primary)]" />
        <span>Syncing…</span>
      </div>
    )
  }

  if (queueCount > 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-yellow-600">
        <Cloud size={13} />
        <span>{queueCount} pending</span>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]')}>
      <Cloud size={13} className="text-green-500" />
      <span>Synced</span>
    </div>
  )
}
