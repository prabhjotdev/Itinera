import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, BookOpen, Plane, Hotel, Car, Zap, MoreHorizontal, Copy, Trash2 } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageSpinner } from '@/components/ui/Spinner'
import { BookingForm } from './BookingForm'
import { useBookings, useCreateBooking, useDeleteBooking } from '@/hooks/useBookings'
import { canWrite } from '@/store/tripStore'
import { useTripStore } from '@/store/tripStore'
import type { BookingInput } from '@/types'

const BOOKING_ICONS = {
  flight: Plane,
  hotel: Hotel,
  car: Car,
  activity: Zap,
  other: MoreHorizontal,
}

export function BookingsPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const [showCreate, setShowCreate] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { userRole } = useTripStore()

  const { data: bookings, isLoading } = useBookings(tripId)
  const createBooking = useCreateBooking()
  const deleteBooking = useDeleteBooking()

  const handleCreate = async (data: Omit<BookingInput, 'trip_id' | 'itinerary_item_id'>) => {
    await createBooking.mutateAsync({
      ...data,
      trip_id: tripId!,
      itinerary_item_id: null,
    })
    setShowCreate(false)
  }

  if (isLoading) return <PageSpinner />

  return (
    <>
      <TopBar
        title="Bookings"
        showBack
        actions={
          canWrite(userRole) ? (
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus size={16} />
            </Button>
          ) : null
        }
      />

      <PageContainer>
        {!bookings?.length ? (
          <EmptyState
            icon={BookOpen}
            title="No bookings yet"
            description="Store your reservation details here"
            action={
              canWrite(userRole)
                ? { label: 'Add Booking', onClick: () => setShowCreate(true) }
                : undefined
            }
          />
        ) : (
          <div className="space-y-2">
            {bookings.map((booking) => {
              const Icon = BOOKING_ICONS[booking.type] || MoreHorizontal
              return (
                <Card key={booking.id} padding="sm">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[var(--color-surface-2)] flex items-center justify-center flex-shrink-0">
                      <Icon size={16} className="text-[var(--color-primary)]" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-[var(--color-text)]">
                            {booking.title}
                          </p>
                          {booking.provider && (
                            <p className="text-xs text-[var(--color-text-muted)]">
                              {booking.provider}
                            </p>
                          )}
                        </div>
                        <Badge variant="default" className="flex-shrink-0 capitalize">
                          {booking.type}
                        </Badge>
                      </div>

                      {booking.confirmation_code && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="text-xs text-[var(--color-text-muted)]">Confirmation:</span>
                          <code className="text-xs font-mono bg-[var(--color-surface-2)] px-1.5 py-0.5 rounded">
                            {booking.confirmation_code}
                          </code>
                          <button
                            onClick={() => navigator.clipboard.writeText(booking.confirmation_code!)}
                            className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                      )}

                      {booking.notes && (
                        <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-2">
                          {booking.notes}
                        </p>
                      )}
                    </div>

                    {canWrite(userRole) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(booking.id)}
                        className="px-1.5 py-1 flex-shrink-0"
                      >
                        <Trash2 size={13} className="text-red-400" />
                      </Button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </PageContainer>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Booking">
        <BookingForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
          loading={createBooking.isPending}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deleteBooking.mutate({ id: deleteId, trip_id: tripId! })
          setDeleteId(null)
        }}
        title="Delete Booking"
        message="Are you sure you want to delete this booking?"
        loading={deleteBooking.isPending}
      />
    </>
  )
}
