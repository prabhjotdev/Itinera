import { openDB, type IDBPDatabase } from 'idb'
import { DB_NAME, DB_VERSION } from '@/lib/constants'
import type { SyncQueueItem } from '@/types'

export interface ItineraDB {
  trips: {
    key: string
    value: Record<string, unknown>
  }
  trip_members: {
    key: string
    value: Record<string, unknown>
    indexes: { by_trip: string }
  }
  trip_days: {
    key: string
    value: Record<string, unknown>
    indexes: { by_trip: string }
  }
  itinerary_items: {
    key: string
    value: Record<string, unknown>
    indexes: { by_trip: string; by_day: [string, string] }
  }
  actions: {
    key: string
    value: Record<string, unknown>
    indexes: { by_trip: string; by_status: [string, string] }
  }
  expenses: {
    key: string
    value: Record<string, unknown>
    indexes: { by_trip: string }
  }
  bookings: {
    key: string
    value: Record<string, unknown>
    indexes: { by_trip: string }
  }
  sync_queue: {
    key: number
    value: SyncQueueItem
    indexes: { by_status: string }
  }
  metadata: {
    key: string
    value: { key: string; value: unknown }
  }
}

let dbPromise: Promise<IDBPDatabase<ItineraDB>> | null = null

export function getDB(): Promise<IDBPDatabase<ItineraDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ItineraDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // trips
        if (!db.objectStoreNames.contains('trips')) {
          db.createObjectStore('trips', { keyPath: 'id' })
        }

        // trip_members
        if (!db.objectStoreNames.contains('trip_members')) {
          const tripMembersStore = db.createObjectStore('trip_members', { keyPath: 'id' })
          tripMembersStore.createIndex('by_trip', 'trip_id')
        }

        // trip_days
        if (!db.objectStoreNames.contains('trip_days')) {
          const tripDaysStore = db.createObjectStore('trip_days', { keyPath: 'id' })
          tripDaysStore.createIndex('by_trip', 'trip_id')
        }

        // itinerary_items
        if (!db.objectStoreNames.contains('itinerary_items')) {
          const itemsStore = db.createObjectStore('itinerary_items', { keyPath: 'id' })
          itemsStore.createIndex('by_trip', 'trip_id')
          itemsStore.createIndex('by_day', ['trip_id', 'day_date'])
        }

        // actions
        if (!db.objectStoreNames.contains('actions')) {
          const actionsStore = db.createObjectStore('actions', { keyPath: 'id' })
          actionsStore.createIndex('by_trip', 'trip_id')
          actionsStore.createIndex('by_status', ['trip_id', 'status'])
        }

        // expenses
        if (!db.objectStoreNames.contains('expenses')) {
          const expensesStore = db.createObjectStore('expenses', { keyPath: 'id' })
          expensesStore.createIndex('by_trip', 'trip_id')
        }

        // bookings
        if (!db.objectStoreNames.contains('bookings')) {
          const bookingsStore = db.createObjectStore('bookings', { keyPath: 'id' })
          bookingsStore.createIndex('by_trip', 'trip_id')
        }

        // sync_queue
        if (!db.objectStoreNames.contains('sync_queue')) {
          const queueStore = db.createObjectStore('sync_queue', {
            keyPath: 'id',
            autoIncrement: true,
          })
          queueStore.createIndex('by_status', 'status')
        }

        // metadata
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' })
        }
      },
    })
  }
  return dbPromise
}

// Generic helpers
export async function idbGetAll<T>(
  storeName: keyof ItineraDB
): Promise<T[]> {
  const db = await getDB()
  return db.getAll(storeName as string) as Promise<T[]>
}

export async function idbGetByIndex<T>(
  storeName: keyof ItineraDB,
  indexName: string,
  key: IDBValidKey
): Promise<T[]> {
  const db = await getDB()
  return db.getAllFromIndex(storeName as string, indexName, key) as Promise<T[]>
}

export async function idbPut(
  storeName: keyof ItineraDB,
  value: Record<string, unknown>
): Promise<void> {
  const db = await getDB()
  await db.put(storeName as string, value)
}

export async function idbPutMany(
  storeName: keyof ItineraDB,
  values: Record<string, unknown>[]
): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(storeName as string, 'readwrite')
  await Promise.all([...values.map((v) => tx.store.put(v)), tx.done])
}

export async function idbDelete(
  storeName: keyof ItineraDB,
  key: string
): Promise<void> {
  const db = await getDB()
  await db.delete(storeName as string, key)
}

export async function idbClearAndPutMany(
  storeName: keyof ItineraDB,
  values: Record<string, unknown>[]
): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(storeName as string, 'readwrite')
  await tx.store.clear()
  await Promise.all([...values.map((v) => tx.store.put(v)), tx.done])
}
