import { useState } from 'react'
import { Plus, MapPin } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageSpinner } from '@/components/ui/Spinner'
import { TripCard } from './TripCard'
import { TripForm } from './TripForm'
import { useTrips, useCreateTrip } from '@/hooks/useTrips'
import type { TripInput } from '@/types'

export function TripsPage() {
  const [showCreate, setShowCreate] = useState(false)
  const { data: trips, isLoading } = useTrips()
  const createTrip = useCreateTrip()

  const handleCreate = async (data: TripInput) => {
    await createTrip.mutateAsync(data)
    setShowCreate(false)
  }

  return (
    <>
      <TopBar
        title="My Trips"
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            New Trip
          </Button>
        }
      />

      <PageContainer>
        {isLoading ? (
          <PageSpinner />
        ) : !trips?.length ? (
          <EmptyState
            icon={MapPin}
            title="No trips yet"
            description="Create your first trip to start planning your adventure"
            action={{ label: 'Create Trip', onClick: () => setShowCreate(true) }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </PageContainer>

      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Trip"
      >
        <TripForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
          loading={createTrip.isPending}
        />
      </Modal>
    </>
  )
}
