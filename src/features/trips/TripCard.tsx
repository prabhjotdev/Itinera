import { useNavigate } from 'react-router-dom'
import { MapPin, Calendar, Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDate, daysUntil, isDateInRange, todayString } from '@/lib/utils/date'
import { tripPath } from '@/router/routes'
import type { Trip } from '@/types'

const GRADIENT_COLORS = [
  'from-purple-400 to-pink-400',
  'from-blue-400 to-cyan-400',
  'from-orange-400 to-yellow-400',
  'from-green-400 to-teal-400',
  'from-rose-400 to-orange-400',
  'from-indigo-400 to-purple-400',
]

function getTripGradient(id: string): string {
  let hash = 0
  for (const char of id) hash = char.charCodeAt(0) + ((hash << 5) - hash)
  return GRADIENT_COLORS[Math.abs(hash) % GRADIENT_COLORS.length]
}

interface TripCardProps {
  trip: Trip
}

export function TripCard({ trip }: TripCardProps) {
  const navigate = useNavigate()
  const today = todayString()
  const isActive = isDateInRange(today, trip.start_date, trip.end_date)
  const days = daysUntil(trip.start_date)

  const statusBadge = () => {
    if (isActive) return <Badge variant="success">Active</Badge>
    if (days > 0) return <Badge variant="info">In {days} day{days !== 1 ? 's' : ''}</Badge>
    return <Badge variant="default">Completed</Badge>
  }

  return (
    <Card
      padding="none"
      className="overflow-hidden"
      onClick={() => navigate(tripPath(trip.id))}
    >
      {/* Cover gradient */}
      <div className={`h-20 bg-gradient-to-r ${getTripGradient(trip.id)} relative`}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute bottom-2 left-3">
          {statusBadge()}
        </div>
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-[var(--color-text)] text-sm leading-tight mb-1 truncate">
          {trip.title}
        </h3>

        <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] mb-2">
          <MapPin size={11} />
          <span className="truncate">{trip.destination}</span>
        </div>

        <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
          <Calendar size={11} />
          <span>
            {formatDate(trip.start_date, 'MMM d')} – {formatDate(trip.end_date, 'MMM d, yyyy')}
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] mt-1">
          <Users size={11} />
          <span>{trip.currency}</span>
        </div>
      </div>
    </Card>
  )
}
