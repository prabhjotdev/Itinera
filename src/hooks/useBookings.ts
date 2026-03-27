import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { idbGetByIndex, idbPut, idbDelete } from '@/lib/db'
import { enqueue } from '@/lib/db/syncQueue'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import type { Booking, BookingInput } from '@/types'

export function useBookings(tripId: string | undefined) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['bookings', tripId],
    queryFn: async (): Promise<Booking[]> => {
      if (!tripId) return []

      if (!navigator.onLine) {
        return idbGetByIndex<Booking>('bookings', 'by_trip', tripId)
      }

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false })

      if (error) {
        return idbGetByIndex<Booking>('bookings', 'by_trip', tripId)
      }

      const bookings = data as Booking[]
      for (const b of bookings) {
        await idbPut('bookings', b as unknown as Record<string, unknown>)
      }
      return bookings
    },
    enabled: !!tripId && !!user,
  })
}

export function useCreateBooking() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const toast = useToast()

  return useMutation({
    mutationFn: async (input: BookingInput): Promise<Booking> => {
      const newBooking = { ...input, created_by: user!.id }

      if (!navigator.onLine) {
        const id = crypto.randomUUID()
        const booking: Booking = {
          ...newBooking,
          id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        await idbPut('bookings', booking as unknown as Record<string, unknown>)
        await enqueue('bookings', 'insert', id, booking as unknown as Record<string, unknown>)
        return booking
      }

      const { data, error } = await supabase.from('bookings').insert(newBooking).select().single()
      if (error) throw new Error(error.message)
      await idbPut('bookings', data as unknown as Record<string, unknown>)
      return data as Booking
    },
    onSuccess: (b) => queryClient.invalidateQueries({ queryKey: ['bookings', b.trip_id] }),
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteBooking() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: async ({ id, trip_id }: { id: string; trip_id: string }): Promise<{ trip_id: string }> => {
      await idbDelete('bookings', id)

      if (!navigator.onLine) {
        await enqueue('bookings', 'delete', id, { id })
        return { trip_id }
      }

      const { error } = await supabase.from('bookings').delete().eq('id', id)
      if (error) throw new Error(error.message)
      return { trip_id }
    },
    onSuccess: ({ trip_id }) => queryClient.invalidateQueries({ queryKey: ['bookings', trip_id] }),
    onError: (err: Error) => toast.error(err.message),
  })
}
