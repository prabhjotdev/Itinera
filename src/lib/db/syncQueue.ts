import { getDB } from './index'
import type { SyncQueueItem, SyncOperation } from '@/types'

export async function enqueue(
  table: string,
  operation: SyncOperation,
  record_id: string,
  payload: Record<string, unknown>
): Promise<void> {
  const db = await getDB()
  const item: SyncQueueItem = {
    table,
    operation,
    record_id,
    payload,
    status: 'pending',
    retry_count: 0,
    created_at: Date.now(),
  }
  await db.add('sync_queue', item)
}

export async function getPendingItems(): Promise<SyncQueueItem[]> {
  const db = await getDB()
  return db.getAllFromIndex('sync_queue', 'by_status', 'pending')
}

export async function markProcessed(id: number): Promise<void> {
  const db = await getDB()
  await db.delete('sync_queue', id)
}

export async function markFailed(id: number, item: SyncQueueItem): Promise<void> {
  const db = await getDB()
  await db.put('sync_queue', {
    ...item,
    id,
    status: 'failed',
    retry_count: item.retry_count + 1,
  })
}

export async function getPendingCount(): Promise<number> {
  const db = await getDB()
  const pending = await db.getAllFromIndex('sync_queue', 'by_status', 'pending')
  return pending.length
}
