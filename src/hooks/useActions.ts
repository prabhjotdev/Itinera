import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { idbGetByIndex, idbPut, idbDelete } from '@/lib/db'
import { enqueue } from '@/lib/db/syncQueue'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import type { TripAction, TripActionInput } from '@/types'

export function useActions(tripId: string | undefined) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['actions', tripId],
    queryFn: async (): Promise<TripAction[]> => {
      if (!tripId) return []

      if (!navigator.onLine) {
        return idbGetByIndex<TripAction>('actions', 'by_trip', tripId)
      }

      const { data, error } = await supabase
        .from('actions')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false })

      if (error) {
        return idbGetByIndex<TripAction>('actions', 'by_trip', tripId)
      }

      const actions = data as TripAction[]
      for (const action of actions) {
        await idbPut('actions', action as unknown as Record<string, unknown>)
      }
      return actions
    },
    enabled: !!tripId && !!user,
  })
}

export function useCreateAction() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const toast = useToast()

  return useMutation({
    mutationFn: async (input: TripActionInput): Promise<TripAction> => {
      const newAction = { ...input, created_by: user!.id }

      if (!navigator.onLine) {
        const id = crypto.randomUUID()
        const action: TripAction = {
          ...newAction,
          id,
          completed_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        await idbPut('actions', action as unknown as Record<string, unknown>)
        await enqueue('actions', 'insert', id, action as unknown as Record<string, unknown>)
        return action
      }

      const { data, error } = await supabase.from('actions').insert(newAction).select().single()
      if (error) throw new Error(error.message)
      await idbPut('actions', data as unknown as Record<string, unknown>)
      return data as TripAction
    },
    onSuccess: (action) => {
      queryClient.invalidateQueries({ queryKey: ['actions', action.trip_id] })
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateAction() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: async ({
      id,
      trip_id,
      ...updates
    }: Partial<TripAction> & { id: string; trip_id: string }): Promise<TripAction> => {
      const completedAt =
        updates.status === 'completed' ? new Date().toISOString() : null

      if (!navigator.onLine) {
        const existing = await idbGetByIndex<TripAction>('actions', 'by_trip', trip_id)
        const action = existing.find((a) => a.id === id)!
        const updated: TripAction = {
          ...action,
          ...updates,
          completed_at: completedAt,
          updated_at: new Date().toISOString(),
        }
        await idbPut('actions', updated as unknown as Record<string, unknown>)
        await enqueue('actions', 'update', id, updated as unknown as Record<string, unknown>)
        return updated
      }

      const { data, error } = await supabase
        .from('actions')
        .update({ ...updates, completed_at: completedAt, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw new Error(error.message)
      await idbPut('actions', data as unknown as Record<string, unknown>)
      return data as TripAction
    },
    onSuccess: (action) => {
      queryClient.invalidateQueries({ queryKey: ['actions', action.trip_id] })
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteAction() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: async ({ id, trip_id }: { id: string; trip_id: string }): Promise<{ trip_id: string }> => {
      await idbDelete('actions', id)

      if (!navigator.onLine) {
        await enqueue('actions', 'delete', id, { id })
        return { trip_id }
      }

      const { error } = await supabase.from('actions').delete().eq('id', id)
      if (error) throw new Error(error.message)
      return { trip_id }
    },
    onSuccess: ({ trip_id }) => {
      queryClient.invalidateQueries({ queryKey: ['actions', trip_id] })
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
