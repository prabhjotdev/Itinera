import { create } from 'zustand'
import type { Trip, MemberRole } from '@/types'

interface TripState {
  activeTripId: string | null
  activeTrip: Trip | null
  userRole: MemberRole | null
  setActiveTrip: (trip: Trip, role: MemberRole) => void
  clearActiveTrip: () => void
}

export const useTripStore = create<TripState>((set) => ({
  activeTripId: null,
  activeTrip: null,
  userRole: null,
  setActiveTrip: (trip, role) =>
    set({ activeTripId: trip.id, activeTrip: trip, userRole: role }),
  clearActiveTrip: () =>
    set({ activeTripId: null, activeTrip: null, userRole: null }),
}))

export function canWrite(role: MemberRole | null): boolean {
  return role === 'owner' || role === 'editor'
}

export function isOwner(role: MemberRole | null): boolean {
  return role === 'owner'
}
