import { useEffect } from 'react'
import { useSyncStore } from '@/store/syncStore'
import { processQueue } from '@/lib/sync/processQueue'
import { getPendingCount } from '@/lib/db/syncQueue'

export function useSync() {
  const { isOnline, isSyncing, queueCount, lastSyncedAt, setQueueCount } =
    useSyncStore()

  // Sync when coming back online
  useEffect(() => {
    if (isOnline) {
      processQueue()
    }
  }, [isOnline])

  // Update queue count periodically
  useEffect(() => {
    getPendingCount().then(setQueueCount)
    const interval = setInterval(() => {
      getPendingCount().then(setQueueCount)
    }, 10000)
    return () => clearInterval(interval)
  }, [setQueueCount])

  return { isOnline, isSyncing, queueCount, lastSyncedAt, triggerSync: processQueue }
}
