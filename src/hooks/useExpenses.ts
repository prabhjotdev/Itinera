import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { idbGetByIndex, idbPut, idbDelete } from '@/lib/db'
import { enqueue } from '@/lib/db/syncQueue'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import type { Expense, ExpenseInput } from '@/types'

export function useExpenses(tripId: string | undefined) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['expenses', tripId],
    queryFn: async (): Promise<Expense[]> => {
      if (!tripId) return []

      if (!navigator.onLine) {
        return idbGetByIndex<Expense>('expenses', 'by_trip', tripId)
      }

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('trip_id', tripId)
        .order('expense_date', { ascending: false })

      if (error) {
        return idbGetByIndex<Expense>('expenses', 'by_trip', tripId)
      }

      const expenses = data as Expense[]
      for (const e of expenses) {
        await idbPut('expenses', e as unknown as Record<string, unknown>)
      }
      return expenses
    },
    enabled: !!tripId && !!user,
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const toast = useToast()

  return useMutation({
    mutationFn: async (input: ExpenseInput): Promise<Expense> => {
      const newExpense = { ...input, paid_by: input.paid_by || user!.id }

      if (!navigator.onLine) {
        const id = crypto.randomUUID()
        const expense: Expense = {
          ...newExpense,
          id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        await idbPut('expenses', expense as unknown as Record<string, unknown>)
        await enqueue('expenses', 'insert', id, expense as unknown as Record<string, unknown>)
        return expense
      }

      const { data, error } = await supabase.from('expenses').insert(newExpense).select().single()
      if (error) throw new Error(error.message)
      await idbPut('expenses', data as unknown as Record<string, unknown>)
      return data as Expense
    },
    onSuccess: (expense) => {
      queryClient.invalidateQueries({ queryKey: ['expenses', expense.trip_id] })
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: async ({
      id,
      trip_id,
      ...updates
    }: Partial<Expense> & { id: string; trip_id: string }): Promise<Expense> => {
      const { data, error } = await supabase
        .from('expenses')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw new Error(error.message)
      await idbPut('expenses', data as unknown as Record<string, unknown>)
      return data as Expense
    },
    onSuccess: (expense) => {
      queryClient.invalidateQueries({ queryKey: ['expenses', expense.trip_id] })
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: async ({ id, trip_id }: { id: string; trip_id: string }): Promise<{ trip_id: string }> => {
      await idbDelete('expenses', id)

      if (!navigator.onLine) {
        await enqueue('expenses', 'delete', id, { id })
        return { trip_id }
      }

      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw new Error(error.message)
      return { trip_id }
    },
    onSuccess: ({ trip_id }) => {
      queryClient.invalidateQueries({ queryKey: ['expenses', trip_id] })
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
