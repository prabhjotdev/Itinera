import { CheckCircle, Circle, MapPin, Clock } from 'lucide-react'
import { ItemTypeIcon } from '@/features/itinerary/ItemTypeIcon'
import { formatTime } from '@/lib/utils/date'
import { useUpdateItineraryItem } from '@/hooks/useItinerary'
import { ITEM_TYPE_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils/cn'
import type { ItineraryItem } from '@/types'

interface TodayTimelineProps {
  items: ItineraryItem[]
  currentTime: Date
  tripId: string
}

export function TodayTimeline({ items, currentTime }: TodayTimelineProps) {
  const updateItem = useUpdateItineraryItem()
  const nowStr = currentTime.toTimeString().slice(0, 5)

  const toggleComplete = (item: ItineraryItem) => {
    updateItem.mutate({
      id: item.id,
      trip_id: item.trip_id,
      is_completed: !item.is_completed,
    })
  }

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)] mb-3">
        Today's Schedule
      </p>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-0 bottom-0 w-px bg-[var(--color-border)]" />

        <div className="space-y-3">
          {items.map((item, idx) => {
            const isPast = item.start_time ? item.start_time < nowStr : false
            const isCurrent =
              item.start_time &&
              item.end_time &&
              item.start_time <= nowStr &&
              item.end_time >= nowStr
            const color = ITEM_TYPE_COLORS[item.type] || '#c084fc'

            return (
              <div key={item.id} className="flex gap-3 items-start">
                {/* Timeline dot */}
                <div className="relative z-10 flex-shrink-0 mt-1">
                  <div
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center border-2',
                      item.is_completed
                        ? 'bg-[var(--color-surface-2)] border-[var(--color-border)]'
                        : isCurrent
                        ? 'border-current shadow-md'
                        : isPast
                        ? 'bg-[var(--color-surface)] border-[var(--color-border)]'
                        : 'bg-[var(--color-surface)] border-[var(--color-border)]'
                    )}
                    style={
                      !item.is_completed && (isCurrent || (!isPast && idx === 0))
                        ? { borderColor: color, backgroundColor: color + '20' }
                        : undefined
                    }
                  >
                    <ItemTypeIcon
                      type={item.type}
                      size={16}
                    />
                  </div>
                </div>

                {/* Card */}
                <div
                  className={cn(
                    'flex-1 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]',
                    'p-3 shadow-card transition-opacity',
                    item.is_completed && 'opacity-50'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-sm font-medium text-[var(--color-text)] leading-tight',
                          item.is_completed && 'line-through'
                        )}
                      >
                        {item.title}
                      </p>

                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                        {item.start_time && (
                          <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                            <Clock size={10} />
                            <span>
                              {formatTime(item.start_time)}
                              {item.end_time && ` – ${formatTime(item.end_time)}`}
                            </span>
                          </div>
                        )}
                        {item.location && (
                          <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                            <MapPin size={10} />
                            <span className="truncate max-w-[150px]">{item.location}</span>
                          </div>
                        )}
                      </div>

                      {item.notes && (
                        <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-2">
                          {item.notes}
                        </p>
                      )}
                    </div>

                    {/* Complete toggle */}
                    <button
                      onClick={() => toggleComplete(item)}
                      className="flex-shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                    >
                      {item.is_completed ? (
                        <CheckCircle size={18} className="text-[var(--color-success)]" />
                      ) : (
                        <Circle size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
