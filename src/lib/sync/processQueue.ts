import { supabase } from '@/lib/supabase'
import {
  getPendingItems,
  markProcessed,
  markFailed,
  getPendingCount,
} from '@/lib/db/syncQueue'
import { useSyncStore } from '@/store/syncStore'
import type { SyncQueueItem } from '@/types'

const MAX_RETRIES = 3

async function processItem(item: SyncQueueItem): Promise<boolean> {
  const { table, operation, payload, record_id } = item

  try {
    switch (operation) {
      case 'insert':
        await supabase.from(table).upsert(payload)
        break
      case 'update':
        await supabase.from(table).update(payload).eq('id', record_id)
        break
      case 'delete':
        await supabase.from(table).delete().eq('id', record_id)
        break
    }
    return true
  } catch {
    return false
  }
}

export async function processQueue(): Promise<void> {
  const { isSyncing, setSyncing, setLastSyncedAt, setQueueCount } =
    useSyncStore.getState()

  if (isSyncing) return

  const pending = await getPendingItems()
  if (pending.length === 0) return

  setSyncing(true)

  for (const item of pending) {
    if ((item.retry_count ?? 0) >= MAX_RETRIES) continue

    const success = await processItem(item)
    if (success) {
      await markProcessed(item.id!)
    } else {
      await markFailed(item.id!, item)
    }
  }

  const remainingCount = await getPendingCount()
  setQueueCount(remainingCount)
  setLastSyncedAt(new Date())
  setSyncing(false)
}
