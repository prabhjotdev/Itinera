import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { CURRENCIES, TIMEZONES } from '@/lib/constants'
import type { Trip, TripInput } from '@/types'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  destination: z.string().min(1, 'Destination is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  timezone: z.string(),
  currency: z.string(),
  cover_url: z.string().nullable().optional(),
})

type FormData = z.infer<typeof schema>

interface TripFormProps {
  onSubmit: (data: TripInput) => void
  onCancel: () => void
  loading?: boolean
  defaultValues?: Partial<Trip>
}

export function TripForm({ onSubmit, onCancel, loading, defaultValues }: TripFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title || '',
      destination: defaultValues?.destination || '',
      start_date: defaultValues?.start_date || '',
      end_date: defaultValues?.end_date || '',
      timezone: defaultValues?.timezone || 'UTC',
      currency: defaultValues?.currency || 'USD',
      cover_url: defaultValues?.cover_url || null,
    },
  })

  const handleFormSubmit = (data: FormData) => {
    onSubmit({ ...data, cover_url: data.cover_url ?? null })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 space-y-4">
      <Input
        label="Trip Title"
        placeholder="Summer in Europe"
        error={errors.title?.message}
        {...register('title')}
      />
      <Input
        label="Destination"
        placeholder="Paris, France"
        error={errors.destination?.message}
        {...register('destination')}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Start Date"
          type="date"
          error={errors.start_date?.message}
          {...register('start_date')}
        />
        <Input
          label="End Date"
          type="date"
          error={errors.end_date?.message}
          {...register('end_date')}
        />
      </div>
      <Select
        label="Timezone"
        options={TIMEZONES.map((tz) => ({ value: tz, label: tz }))}
        error={errors.timezone?.message}
        {...register('timezone')}
      />
      <Select
        label="Currency"
        options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} – ${c.name}` }))}
        error={errors.currency?.message}
        {...register('currency')}
      />

      <div className="flex gap-2 pt-2">
        <Button variant="outline" type="button" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          {defaultValues ? 'Save Changes' : 'Create Trip'}
        </Button>
      </div>
    </form>
  )
}
