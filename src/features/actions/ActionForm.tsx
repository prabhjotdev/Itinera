import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { TripAction, TripActionInput } from '@/types'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  notes: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  status: z.enum(['pending', 'completed']).default('pending'),
})

type FormData = z.infer<typeof schema>

interface ActionFormProps {
  onSubmit: (data: Omit<TripActionInput, 'trip_id'>) => void
  onCancel: () => void
  loading?: boolean
  defaultValues?: Partial<TripAction>
}

export function ActionForm({ onSubmit, onCancel, loading, defaultValues }: ActionFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title || '',
      notes: defaultValues?.notes || '',
      due_date: defaultValues?.due_date || '',
      status: defaultValues?.status || 'pending',
    },
  })

  const handleFormSubmit = (data: FormData) => {
    onSubmit({
      ...data,
      notes: data.notes ?? null,
      due_date: data.due_date ?? null,
      itinerary_item_id: null,
      assigned_to: null,
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 space-y-3">
      <Input
        label="Title"
        placeholder="e.g. Book airport transfer"
        error={errors.title?.message}
        {...register('title')}
      />
      <Input
        label="Due Date (optional)"
        type="date"
        {...register('due_date')}
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
          {defaultValues ? 'Save Changes' : 'Create Action'}
        </Button>
      </div>
    </form>
  )
}
