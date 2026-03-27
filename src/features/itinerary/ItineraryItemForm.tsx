import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import type { ItineraryItem, ItineraryItemInput } from '@/types'

const ITEM_TYPES = [
  { value: 'flight', label: 'Flight' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'activity', label: 'Activity' },
  { value: 'transport', label: 'Transport' },
  { value: 'custom', label: 'Custom' },
]

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['flight', 'hotel', 'activity', 'transport', 'custom']),
  day_date: z.string().min(1, 'Date is required'),
  start_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

type FormData = z.infer<typeof schema>

interface ItineraryItemFormProps {
  onSubmit: (data: Omit<ItineraryItemInput, 'trip_id' | 'trip_day_id' | 'is_completed' | 'sort_order'>) => void
  onCancel: () => void
  loading?: boolean
  defaultValues?: Partial<ItineraryItem>
  defaultDate?: string
}

export function ItineraryItemForm({
  onSubmit,
  onCancel,
  loading,
  defaultValues,
  defaultDate,
}: ItineraryItemFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title || '',
      type: defaultValues?.type || 'activity',
      day_date: defaultValues?.day_date || defaultDate || '',
      start_time: defaultValues?.start_time || '',
      end_time: defaultValues?.end_time || '',
      location: defaultValues?.location || '',
      notes: defaultValues?.notes || '',
    },
  })

  const handleFormSubmit = (data: FormData) => {
    onSubmit({
      ...data,
      start_time: data.start_time || null,
      end_time: data.end_time || null,
      location: data.location || null,
      notes: data.notes || null,
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 space-y-3">
      <Input
        label="Title"
        placeholder="e.g. Check-in, City Tour"
        error={errors.title?.message}
        {...register('title')}
      />

      <Select
        label="Type"
        options={ITEM_TYPES}
        {...register('type')}
      />

      <Input
        label="Date"
        type="date"
        error={errors.day_date?.message}
        {...register('day_date')}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Start Time"
          type="time"
          {...register('start_time')}
        />
        <Input
          label="End Time"
          type="time"
          {...register('end_time')}
        />
      </div>

      <Input
        label="Location"
        placeholder="Address or place name"
        {...register('location')}
      />

      <Textarea
        label="Notes"
        placeholder="Any additional details..."
        {...register('notes')}
      />

      <div className="flex gap-2 pt-1">
        <Button variant="outline" type="button" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          {defaultValues ? 'Save Changes' : 'Add Item'}
        </Button>
      </div>
    </form>
  )
}
