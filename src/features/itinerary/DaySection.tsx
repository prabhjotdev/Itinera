import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ItineraryItemCard } from './ItineraryItemCard'
import { ItineraryItemForm } from './ItineraryItemForm'
import { useCreateItineraryItem } from '@/hooks/useItinerary'
import { formatDateShort, isToday } from '@/lib/utils/date'
import { canWrite } from '@/store/tripStore'
import { useTripStore } from '@/store/tripStore'
import { cn } from '@/lib/utils/cn'
import type { ItineraryItem, ItineraryItemInput } from '@/types'

interface DaySectionProps {
  date: string
  dayNumber: number
  items: ItineraryItem[]
  tripId: string
}

export function DaySection({ date, dayNumber, items, tripId }: DaySectionProps) {
  const [showAdd, setShowAdd] = useState(false)
  const { userRole } = useTripStore()
  const createItem = useCreateItineraryItem()
  const today = isToday(new Date(date + 'T12:00:00'))

  const handleCreate = async (
    data: Omit<ItineraryItemInput, 'trip_id' | 'trip_day_id' | 'is_completed' | 'sort_order'>
  ) => {
    await createItem.mutateAsync({
      ...data,
      trip_id: tripId,
      trip_day_id: null,
      is_completed: false,
      sort_order: items.length,
    })
    setShowAdd(false)
  }

  return (
    <div className="mb-4">
      {/* Day header */}
      <div
        className={cn(
          'flex items-center gap-2 px-1 mb-2',
          today && 'text-[var(--color-primary)]'
        )}
      >
        <div
          className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
            today
              ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)]'
              : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)]'
          )}
        >
          {dayNumber}
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--color-text)]">
            {formatDateShort(date)}
          </p>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2 ml-2">
        {items.map((item) => (
          <ItineraryItemCard key={item.id} item={item} />
        ))}

        {canWrite(userRole) && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors py-1"
          >
            <Plus size={14} />
            Add item
          </button>
        )}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Item">
        <ItineraryItemForm
          onSubmit={handleCreate}
          onCancel={() => setShowAdd(false)}
          loading={createItem.isPending}
          defaultDate={date}
        />
      </Modal>
    </div>
  )
}
