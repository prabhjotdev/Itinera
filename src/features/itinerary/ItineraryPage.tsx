import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, CalendarDays } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageSpinner } from '@/components/ui/Spinner'
import { DaySection } from './DaySection'
import { ItineraryItemForm } from './ItineraryItemForm'
import { useItinerary, useCreateItineraryItem } from '@/hooks/useItinerary'
import { useTrip } from '@/hooks/useTrips'
import { getDaysBetween } from '@/lib/utils/date'
import { canWrite } from '@/store/tripStore'
import { useTripStore } from '@/store/tripStore'
import type { ItineraryItemInput } from '@/types'

export function ItineraryPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const [showAdd, setShowAdd] = useState(false)
  const { userRole } = useTripStore()

  const { data: trip } = useTrip(tripId)
  const { data: items, isLoading } = useItinerary(tripId)
  const createItem = useCreateItineraryItem()

  const days = trip ? getDaysBetween(trip.start_date, trip.end_date) : []

  const handleCreate = async (
    data: Omit<ItineraryItemInput, 'trip_id' | 'trip_day_id' | 'is_completed' | 'sort_order'>
  ) => {
    await createItem.mutateAsync({
      ...data,
      trip_id: tripId!,
      trip_day_id: null,
      is_completed: false,
      sort_order: 0,
    })
    setShowAdd(false)
  }

  if (isLoading) return <PageSpinner />

  const groupedItems: Record<string, typeof items> = {}
  items?.forEach((item) => {
    if (!groupedItems[item.day_date]) groupedItems[item.day_date] = []
    groupedItems[item.day_date]!.push(item)
  })

  return (
    <>
      <TopBar
        title="Itinerary"
        showBack
        actions={
          canWrite(userRole) ? (
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus size={16} />
            </Button>
          ) : null
        }
      />

      <PageContainer>
        {!days.length ? (
          <EmptyState
            icon={CalendarDays}
            title="No days in itinerary"
            description="Add dates to your trip to start planning"
          />
        ) : (
          <div>
            {days.map((date, i) => (
              <DaySection
                key={date}
                date={date}
                dayNumber={i + 1}
                items={groupedItems[date] || []}
                tripId={tripId!}
              />
            ))}
          </div>
        )}
      </PageContainer>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Item">
        <ItineraryItemForm
          onSubmit={handleCreate}
          onCancel={() => setShowAdd(false)}
          loading={createItem.isPending}
        />
      </Modal>
    </>
  )
}
