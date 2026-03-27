import { MapPin, Clock } from 'lucide-react'
import { ItemTypeIcon } from '@/features/itinerary/ItemTypeIcon'
import { formatTime, minutesUntilTime } from '@/lib/utils/date'
import { ITEM_TYPE_COLORS } from '@/lib/constants'
import type { ItineraryItem } from '@/types'

interface NextItemHighlightProps {
  item: ItineraryItem
  currentTime: Date
}

export function NextItemHighlight({ item }: NextItemHighlightProps) {
  const color = ITEM_TYPE_COLORS[item.type] || '#c084fc'
  const minutesUntil = item.start_time ? minutesUntilTime(item.start_time) : null

  const countdownText = () => {
    if (minutesUntil === null) return ''
    if (minutesUntil <= 0) return 'Now'
    if (minutesUntil < 60) return `In ${minutesUntil} min`
    const h = Math.floor(minutesUntil / 60)
    const m = minutesUntil % 60
    return `In ${h}h${m > 0 ? ` ${m}m` : ''}`
  }

  return (
    <div
      className="rounded-xl p-4 text-white relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${color}dd, ${color}88)` }}
    >
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-8 -left-4 w-32 h-32 rounded-full bg-white/10" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium uppercase tracking-wide opacity-80">Up Next</span>
          {minutesUntil !== null && (
            <span className="text-xs font-bold bg-white/20 rounded-full px-2.5 py-0.5">
              {countdownText()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mb-1">
          <ItemTypeIcon type={item.type} size={18} className="opacity-90" />
          <h3 className="text-lg font-bold leading-tight">{item.title}</h3>
        </div>

        <div className="flex flex-wrap gap-3 text-sm opacity-80">
          {item.start_time && (
            <div className="flex items-center gap-1">
              <Clock size={13} />
              <span>{formatTime(item.start_time)}</span>
            </div>
          )}
          {item.location && (
            <div className="flex items-center gap-1">
              <MapPin size={13} />
              <span className="truncate max-w-[150px]">{item.location}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
