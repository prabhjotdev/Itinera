import { useState, useEffect } from 'react'
import { useParams, useNavigate, NavLink } from 'react-router-dom'
import { Edit2, Trash2, Users, DollarSign, BookOpen, List } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Badge } from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'
import { TripForm } from './TripForm'
import { useTrip, useUpdateTrip, useDeleteTrip } from '@/hooks/useTrips'
import { useTripStore, isOwner, canWrite } from '@/store/tripStore'
import { useAuth } from '@/hooks/useAuth'
import { formatDate, isDateInRange, todayString } from '@/lib/utils/date'
import {
  tripItineraryPath,
  tripActionsPath,
  tripExpensesPath,
  tripBookingsPath,
  tripMembersPath,
} from '@/router/routes'
import { cn } from '@/lib/utils/cn'
import type { TripInput } from '@/types'
import { supabase } from '@/lib/supabase'

export function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { setActiveTrip, clearActiveTrip, userRole } = useTripStore()

  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  const { data: trip, isLoading } = useTrip(tripId)
  const updateTrip = useUpdateTrip()
  const deleteTrip = useDeleteTrip()

  // Fetch user role and set active trip
  useEffect(() => {
    if (trip && user) {
      supabase
        .from('trip_members')
        .select('role')
        .eq('trip_id', trip.id)
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setActiveTrip(trip, data.role as 'owner' | 'editor' | 'viewer')
        })
    }
    return () => clearActiveTrip()
  }, [trip?.id, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) return <PageSpinner />
  if (!trip) return <div className="p-4 text-[var(--color-text-muted)]">Trip not found</div>

  const today = todayString()
  const isActive = isDateInRange(today, trip.start_date, trip.end_date)

  const tabs = [
    { to: tripItineraryPath(trip.id), label: 'Itinerary', icon: List },
    { to: tripActionsPath(trip.id), label: 'Actions', icon: null },
    { to: tripExpensesPath(trip.id), label: 'Expenses', icon: DollarSign },
    { to: tripBookingsPath(trip.id), label: 'Bookings', icon: BookOpen },
    { to: tripMembersPath(trip.id), label: 'Members', icon: Users },
  ]

  const handleUpdate = async (data: TripInput) => {
    await updateTrip.mutateAsync({ id: trip.id, ...data })
    setShowEdit(false)
  }

  const handleDelete = async () => {
    await deleteTrip.mutateAsync(trip.id)
    navigate('/')
  }

  return (
    <>
      <TopBar
        title={trip.title}
        showBack
        actions={
          canWrite(userRole) ? (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => setShowEdit(true)}>
                <Edit2 size={15} />
              </Button>
              {isOwner(userRole) && (
                <Button variant="ghost" size="sm" onClick={() => setShowDelete(true)}>
                  <Trash2 size={15} className="text-red-400" />
                </Button>
              )}
            </div>
          ) : null
        }
      />

      {/* Trip header info */}
      <div className="px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <p className="text-sm text-[var(--color-text-muted)]">{trip.destination}</p>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
          {formatDate(trip.start_date, 'MMM d')} – {formatDate(trip.end_date, 'MMM d, yyyy')}
          {' · '}{trip.currency}
        </p>
        {isActive && (
          <Badge variant="success" className="mt-1.5">
            Active Trip
          </Badge>
        )}
      </div>

      {/* Tab navigation */}
      <div className="flex overflow-x-auto border-b border-[var(--color-border)] bg-[var(--color-surface)] scrollbar-hide">
        {tabs.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                isActive
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              )
            }
          >
            {label}
          </NavLink>
        ))}
      </div>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Trip">
        <TripForm
          onSubmit={handleUpdate}
          onCancel={() => setShowEdit(false)}
          loading={updateTrip.isPending}
          defaultValues={trip}
        />
      </Modal>

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Trip"
        message="This will permanently delete this trip and all its data. This action cannot be undone."
        loading={deleteTrip.isPending}
      />
    </>
  )
}
