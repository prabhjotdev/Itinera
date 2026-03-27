import { Calendar } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { PageContainer } from '@/components/layout/PageContainer'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageSpinner } from '@/components/ui/Spinner'
import { WeekDayCard } from './WeekDayCard'
import { useTrips } from '@/hooks/useTrips'
import { useItinerary } from '@/hooks/useItinerary'
import { getNext7Days, isDateInRange, todayString } from '@/lib/utils/date'

export function WeekPage() {
  const today = todayString()
  const days = getNext7Days()
  const { data: trips, isLoading: tripsLoading } = useTrips()

  // Find all trips that overlap with the next 7 days
  const relevantTrips = trips?.filter((t) =>
    days.some((d) => isDateInRange(d, t.start_date, t.end_date))
  ) ?? []

  // Use the first active/upcoming trip
  const activeTrip = trips?.find((t) => isDateInRange(today, t.start_date, t.end_date))
    || relevantTrips[0]

  const { data: items, isLoading: itemsLoading } = useItinerary(activeTrip?.id)

  if (tripsLoading || itemsLoading) return <PageSpinner />

  const itemsByDate: Record<string, typeof items> = {}
  items?.forEach((item) => {
    if (!itemsByDate[item.day_date]) itemsByDate[item.day_date] = []
    itemsByDate[item.day_date]!.push(item)
  })

  return (
    <>
      <TopBar title="This Week" />
      <PageContainer>
        {!activeTrip ? (
          <EmptyState
            icon={Calendar}
            title="No trips this week"
            description="You don't have any trips planned for the next 7 days"
          />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[var(--color-text-muted)]">
              {activeTrip.title} · {activeTrip.destination}
            </p>
            {days.map((date) => (
              <WeekDayCard
                key={date}
                date={date}
                items={
                  isDateInRange(date, activeTrip.start_date, activeTrip.end_date)
                    ? (itemsByDate[date] ?? [])
                    : null
                }
              />
            ))}
          </div>
        )}
      </PageContainer>
    </>
  )
}
