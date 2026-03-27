import { format, parseISO, isToday } from 'date-fns'
import { Clock, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ItemTypeIcon } from '@/features/itinerary/ItemTypeIcon'
import { formatTime } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import type { ItineraryItem } from '@/types'

interface WeekDayCardProps {
  date: string
  items: ItineraryItem[] | null // null = outside trip dates
}

export function WeekDayCard({ date, items }: WeekDayCardProps) {
  const d = parseISO(date)
  const today = isToday(d)
  const dayOfWeek = format(d, 'EEE')
  const dayOfMonth = format(d, 'd')
  const monthYear = format(d, 'MMM yyyy')

  const isOutsideTrip = items === null

  return (
    <Card
      padding="sm"
      className={cn(
        today && 'ring-2 ring-[var(--color-primary)] ring-offset-2',
        isOutsideTrip && 'opacity-40'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Date column */}
        <div className="flex flex-col items-center min-w-[40px]">
          <span className="text-xs text-[var(--color-text-muted)] font-medium">{dayOfWeek}</span>
          <span
            className={cn(
              'text-xl font-bold leading-tight',
              today ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'
            )}
          >
            {dayOfMonth}
          </span>
          <span className="text-[10px] text-[var(--color-text-muted)]">{monthYear}</span>
        </div>

        {/* Divider */}
        <div className="w-px bg-[var(--color-border)] self-stretch mx-1" />

        {/* Items column */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            {today && <Badge variant="info">Today</Badge>}
            {isOutsideTrip && (
              <span className="text-xs text-[var(--color-text-muted)]">Outside trip</span>
            )}
            {!isOutsideTrip && !today && items?.length === 0 && (
              <span className="text-xs text-[var(--color-text-muted)]">No items planned</span>
            )}
            {items && items.length > 0 && (
              <span className="text-xs text-[var(--color-text-muted)]">
                {items.length} item{items.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {items && items.length > 0 && (
            <div className="space-y-1.5">
              {items.slice(0, 4).map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <ItemTypeIcon type={item.type} size={13} />
                  <span
                    className={cn(
                      'text-xs text-[var(--color-text)] truncate flex-1',
                      item.is_completed && 'line-through opacity-50'
                    )}
                  >
                    {item.title}
                  </span>
                  {item.start_time && (
                    <span className="text-[10px] text-[var(--color-text-muted)] flex-shrink-0">
                      {formatTime(item.start_time)}
                    </span>
                  )}
                </div>
              ))}
              {items.length > 4 && (
                <p className="text-xs text-[var(--color-text-muted)]">
                  +{items.length - 4} more
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
