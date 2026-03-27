import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { PageContainer } from '@/components/layout/PageContainer'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageSpinner } from '@/components/ui/Spinner'
import { NextItemHighlight } from './NextItemHighlight'
import { TodayTimeline } from './TodayTimeline'
import { useTrips } from '@/hooks/useTrips'
import { useItinerary } from '@/hooks/useItinerary'
import { todayString, isDateInRange } from '@/lib/utils/date'

export function TodayPage() {
  const today = todayString()
  const { data: trips, isLoading: tripsLoading } = useTrips()
  const [currentTime, setCurrentTime] = useState(new Date())

  // Find active trip
  const activeTrip = trips?.find((t) => isDateInRange(today, t.start_date, t.end_date))

  const { data: allItems, isLoading: itemsLoading } = useItinerary(activeTrip?.id)

  // Update clock every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  const todayItems = allItems?.filter((item) => item.day_date === today) ?? []
  const sortedItems = [...todayItems].sort((a, b) => {
    if (!a.start_time) return 1
    if (!b.start_time) return -1
    return a.start_time.localeCompare(b.start_time)
  })

  // Find next upcoming item
  const nowStr = currentTime.toTimeString().slice(0, 5)
  const nextItem = sortedItems.find(
    (item) => !item.is_completed && item.start_time && item.start_time > nowStr
  )

  if (tripsLoading || itemsLoading) return <PageSpinner />

  return (
    <>
      <TopBar title="Today" />
      <PageContainer>
        {!activeTrip ? (
          <EmptyState
            icon={Clock}
            title="No active trip today"
            description="You don't have any trips scheduled for today. Plan your next adventure!"
          />
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-[var(--color-text-muted)] font-medium uppercase tracking-wide mb-1">
                Active Trip
              </p>
              <p className="text-base font-semibold text-[var(--color-text)]">{activeTrip.title}</p>
              <p className="text-sm text-[var(--color-text-muted)]">{activeTrip.destination}</p>
            </div>

            {nextItem && (
              <NextItemHighlight item={nextItem} currentTime={currentTime} />
            )}

            {sortedItems.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="Nothing planned for today"
                description="Add items to today's itinerary to see them here"
              />
            ) : (
              <TodayTimeline
                items={sortedItems}
                currentTime={currentTime}
                tripId={activeTrip.id}
              />
            )}
          </div>
        )}
      </PageContainer>
    </>
  )
}
