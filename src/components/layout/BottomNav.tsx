import { NavLink, useParams } from 'react-router-dom'
import { Home, Calendar, Clock, List, Settings } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const baseLinks = [
  { to: '/', icon: Home, label: 'Trips' },
  { to: '/today', icon: Clock, label: 'Today' },
  { to: '/week', icon: Calendar, label: 'Week' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function BottomNav() {
  const { tripId } = useParams()

  const links = tripId
    ? [
        { to: '/', icon: Home, label: 'Trips' },
        { to: `/trips/${tripId}/itinerary`, icon: List, label: 'Itinerary' },
        { to: '/today', icon: Clock, label: 'Today' },
        { to: '/week', icon: Calendar, label: 'Week' },
        { to: '/settings', icon: Settings, label: 'Settings' },
      ]
    : baseLinks

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] z-40 safe-bottom">
      <div className="flex items-stretch">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors min-h-[52px]',
                isActive
                  ? 'text-[var(--color-primary)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              )
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
