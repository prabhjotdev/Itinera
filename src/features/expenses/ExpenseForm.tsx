import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { EXPENSE_CATEGORIES, CURRENCIES } from '@/lib/constants'
import { useAuth } from '@/hooks/useAuth'
import { useTrip } from '@/hooks/useTrips'
import type { Expense, ExpenseInput } from '@/types'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  currency: z.string(),
  category: z.enum(['accommodation', 'food', 'transport', 'activities', 'shopping', 'health', 'communication', 'other']),
  expense_date: z.string().min(1, 'Date is required'),
  notes: z.string().nullable().optional(),
})

type FormData = z.infer<typeof schema>

interface ExpenseFormProps {
  onSubmit: (data: Omit<ExpenseInput, 'trip_id' | 'paid_by' | 'itinerary_item_id'>) => void
  onCancel: () => void
  loading?: boolean
  defaultValues?: Partial<Expense>
  tripId: string
}

export function ExpenseForm({ onSubmit, onCancel, loading, defaultValues, tripId }: ExpenseFormProps) {
  const { user } = useAuth()
  const { data: trip } = useTrip(tripId)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title || '',
      amount: defaultValues?.amount || 0,
      currency: defaultValues?.currency || trip?.currency || 'USD',
      category: defaultValues?.category || 'other',
      expense_date: defaultValues?.expense_date || new Date().toISOString().split('T')[0],
      notes: defaultValues?.notes || '',
    },
  })

  const handleFormSubmit = (data: FormData) => {
    onSubmit({ ...data, notes: data.notes ?? null })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 space-y-3">
      <Input
        label="Title"
        placeholder="e.g. Hotel stay, Dinner"
        error={errors.title?.message}
        {...register('title')}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Amount"
          type="number"
          step="0.01"
          placeholder="0.00"
          error={errors.amount?.message}
          {...register('amount')}
        />
        <Select
          label="Currency"
          options={CURRENCIES.map((c) => ({ value: c.code, label: c.code }))}
          {...register('currency')}
        />
      </div>

      <Select
        label="Category"
        options={EXPENSE_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
        {...register('category')}
      />

      <Input
        label="Date"
        type="date"
        error={errors.expense_date?.message}
        {...register('expense_date')}
      />

      <Textarea
        label="Notes (optional)"
        placeholder="Additional details..."
        {...register('notes')}
      />

      <div className="flex gap-2 pt-1">
        <Button variant="outline" type="button" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          {defaultValues ? 'Save Changes' : 'Add Expense'}
        </Button>
      </div>
    </form>
  )
}
