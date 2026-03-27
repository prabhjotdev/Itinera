import { create } from 'zustand'

interface SyncState {
  isOnline: boolean
  isSyncing: boolean
  queueCount: number
  lastSyncedAt: Date | null
  setOnline: (online: boolean) => void
  setSyncing: (syncing: boolean) => void
  setQueueCount: (n: number) => void
  setLastSyncedAt: (date: Date) => void
}

export const useSyncStore = create<SyncState>((set) => ({
  isOnline: navigator.onLine,
  isSyncing: false,
  queueCount: 0,
  lastSyncedAt: null,
  setOnline: (isOnline) => set({ isOnline }),
  setSyncing: (isSyncing) => set({ isSyncing }),
  setQueueCount: (queueCount) => set({ queueCount }),
  setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
}))
