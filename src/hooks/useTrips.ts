import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { idbGetAll, idbPut, idbDelete, idbClearAndPutMany } from '@/lib/db'
import { enqueue } from '@/lib/db/syncQueue'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import type { Trip, TripInput } from '@/types'

export function useTrips() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['trips'],
    queryFn: async (): Promise<Trip[]> => {
      if (!navigator.onLine) {
        return idbGetAll<Trip>('trips')
      }

      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          trip_members!inner(user_id, role)
        `)
        .eq('trip_members.user_id', user!.id)
        .order('start_date', { ascending: false })

      if (error) {
        return idbGetAll<Trip>('trips')
      }

      const trips = data as Trip[]
      await idbClearAndPutMany('trips', trips as unknown as Record<string, unknown>[])
      return trips
    },
    enabled: !!user,
  })
}

export function useTrip(tripId: string | undefined) {
  return useQuery({
    queryKey: ['trips', tripId],
    queryFn: async (): Promise<Trip | null> => {
      if (!tripId) return null

      if (!navigator.onLine) {
        const all = await idbGetAll<Trip>('trips')
        return all.find((t) => t.id === tripId) || null
      }

      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single()

      if (error) {
        const all = await idbGetAll<Trip>('trips')
        return all.find((t) => t.id === tripId) || null
      }

      await idbPut('trips', data as unknown as Record<string, unknown>)
      return data as Trip
    },
    enabled: !!tripId,
  })
}

export function useCreateTrip() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const toast = useToast()

  return useMutation({
    mutationFn: async (input: TripInput): Promise<Trip> => {
      const newTrip = { ...input, created_by: user!.id }

      if (!navigator.onLine) {
        const id = crypto.randomUUID()
        const trip: Trip = {
          ...newTrip,
          id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        await idbPut('trips', trip as unknown as Record<string, unknown>)
        await enqueue('trips', 'insert', id, trip as unknown as Record<string, unknown>)
        return trip
      }

      const { data, error } = await supabase
        .from('trips')
        .insert(newTrip)
        .select()
        .single()

      if (error) throw new Error(error.message)
      await idbPut('trips', data as unknown as Record<string, unknown>)
      return data as Trip
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      toast.success('Trip created!')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateTrip() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<TripInput> & { id: string }): Promise<Trip> => {
      if (!navigator.onLine) {
        const all = await idbGetAll<Trip>('trips')
        const existing = all.find((t) => t.id === id)!
        const updated: Trip = { ...existing, ...input, updated_at: new Date().toISOString() }
        await idbPut('trips', updated as unknown as Record<string, unknown>)
        await enqueue('trips', 'update', id, updated as unknown as Record<string, unknown>)
        return updated
      }

      const { data, error } = await supabase
        .from('trips')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw new Error(error.message)
      await idbPut('trips', data as unknown as Record<string, unknown>)
      return data as Trip
    },
    onSuccess: (trip) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      queryClient.invalidateQueries({ queryKey: ['trips', trip.id] })
      toast.success('Trip updated!')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteTrip() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await idbDelete('trips', id)

      if (!navigator.onLine) {
        await enqueue('trips', 'delete', id, { id })
        return
      }

      const { error } = await supabase.from('trips').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      toast.success('Trip deleted')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
