import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import type { Booking, BookingInput } from '@/types'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['flight', 'hotel', 'car', 'activity', 'other']),
  confirmation_code: z.string().nullable().optional(),
  provider: z.string().nullable().optional(),
  booking_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

type FormData = z.infer<typeof schema>

const BOOKING_TYPES = [
  { value: 'flight', label: 'Flight' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'car', label: 'Car Rental' },
  { value: 'activity', label: 'Activity' },
  { value: 'other', label: 'Other' },
]

interface BookingFormProps {
  onSubmit: (data: Omit<BookingInput, 'trip_id' | 'itinerary_item_id'>) => void
  onCancel: () => void
  loading?: boolean
  defaultValues?: Partial<Booking>
}

export function BookingForm({ onSubmit, onCancel, loading, defaultValues }: BookingFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title || '',
      type: defaultValues?.type || 'other',
      confirmation_code: defaultValues?.confirmation_code || '',
      provider: defaultValues?.provider || '',
      booking_date: defaultValues?.booking_date || '',
      notes: defaultValues?.notes || '',
    },
  })

  return (
    <form
      onSubmit={handleSubmit((data) =>
        onSubmit({
          ...data,
          check_in: null,
          check_out: null,
          attachment_url: null,
          confirmation_code: data.confirmation_code || null,
          provider: data.provider || null,
          booking_date: data.booking_date || null,
          notes: data.notes || null,
        })
      )}
      className="p-4 space-y-3"
    >
      <Input
        label="Title"
        placeholder="e.g. Flight to Paris, Hotel Lumiere"
        error={errors.title?.message}
        {...register('title')}
      />

      <Select
        label="Type"
        options={BOOKING_TYPES}
        {...register('type')}
      />

      <Input
        label="Confirmation Code"
        placeholder="ABC123"
        {...register('confirmation_code')}
      />

      <Input
        label="Provider / Airline"
        placeholder="e.g. Air France, Marriott"
        {...register('provider')}
      />

      <Input
        label="Booking Date"
        type="date"
        {...register('booking_date')}
      />

      <Textarea
        label="Notes"
        placeholder="Any other details..."
        {...register('notes')}
      />

      <div className="flex gap-2 pt-1">
        <Button variant="outline" type="button" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          {defaultValues ? 'Save Changes' : 'Add Booking'}
        </Button>
      </div>
    </form>
  )
}
