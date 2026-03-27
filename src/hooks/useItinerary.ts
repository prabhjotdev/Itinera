import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { idbGetByIndex, idbPut, idbDelete, idbClearAndPutMany } from '@/lib/db'
import { enqueue } from '@/lib/db/syncQueue'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import type { ItineraryItem, ItineraryItemInput } from '@/types'

export function useItinerary(tripId: string | undefined) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['itinerary', tripId],
    queryFn: async (): Promise<ItineraryItem[]> => {
      if (!tripId) return []

      if (!navigator.onLine) {
        return idbGetByIndex<ItineraryItem>('itinerary_items', 'by_trip', tripId)
      }

      const { data, error } = await supabase
        .from('itinerary_items')
        .select('*')
        .eq('trip_id', tripId)
        .order('day_date', { ascending: true })
        .order('start_time', { ascending: true, nullsFirst: false })
        .order('sort_order', { ascending: true })

      if (error) {
        return idbGetByIndex<ItineraryItem>('itinerary_items', 'by_trip', tripId)
      }

      const items = data as ItineraryItem[]
      await idbClearAndPutMany('itinerary_items', items as unknown as Record<string, unknown>[])
      return items
    },
    enabled: !!tripId && !!user,
  })
}

export function useTodayItems(tripId: string | undefined, todayDate: string) {
  const { data: items } = useItinerary(tripId)
  return items?.filter((item) => item.day_date === todayDate) ?? []
}

export function useCreateItineraryItem() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const toast = useToast()

  return useMutation({
    mutationFn: async (input: ItineraryItemInput): Promise<ItineraryItem> => {
      const newItem = { ...input, created_by: user!.id }

      if (!navigator.onLine) {
        const id = crypto.randomUUID()
        const item: ItineraryItem = {
          ...newItem,
          id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        await idbPut('itinerary_items', item as unknown as Record<string, unknown>)
        await enqueue('itinerary_items', 'insert', id, item as unknown as Record<string, unknown>)
        return item
      }

      const { data, error } = await supabase
        .from('itinerary_items')
        .insert(newItem)
        .select()
        .single()

      if (error) throw new Error(error.message)
      const item = data as ItineraryItem
      await idbPut('itinerary_items', item as unknown as Record<string, unknown>)
      return item
    },
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: ['itinerary', item.trip_id] })
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateItineraryItem() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: async ({
      id,
      trip_id,
      ...updates
    }: Partial<ItineraryItem> & { id: string; trip_id: string }): Promise<ItineraryItem> => {
      if (!navigator.onLine) {
        const existing = await idbGetByIndex<ItineraryItem>('itinerary_items', 'by_trip', trip_id)
        const item = existing.find((i) => i.id === id)!
        const updated: ItineraryItem = { ...item, ...updates, updated_at: new Date().toISOString() }
        await idbPut('itinerary_items', updated as unknown as Record<string, unknown>)
        await enqueue('itinerary_items', 'update', id, updated as unknown as Record<string, unknown>)
        return updated
      }

      const { data, error } = await supabase
        .from('itinerary_items')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw new Error(error.message)
      await idbPut('itinerary_items', data as unknown as Record<string, unknown>)
      return data as ItineraryItem
    },
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: ['itinerary', item.trip_id] })
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteItineraryItem() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: async ({ id, trip_id }: { id: string; trip_id: string }): Promise<{ trip_id: string }> => {
      await idbDelete('itinerary_items', id)

      if (!navigator.onLine) {
        await enqueue('itinerary_items', 'delete', id, { id })
        return { trip_id }
      }

      const { error } = await supabase.from('itinerary_items').delete().eq('id', id)
      if (error) throw new Error(error.message)
      return { trip_id }
    },
    onSuccess: ({ trip_id }) => {
      queryClient.invalidateQueries({ queryKey: ['itinerary', trip_id] })
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
