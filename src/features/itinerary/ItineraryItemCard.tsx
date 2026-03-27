import { useState } from 'react'
import { MapPin, Clock, Edit2, Trash2, CheckCircle, Circle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { ItemTypeIcon } from './ItemTypeIcon'
import { ItineraryItemForm } from './ItineraryItemForm'
import { useUpdateItineraryItem, useDeleteItineraryItem } from '@/hooks/useItinerary'
import { formatTime } from '@/lib/utils/date'
import { canWrite } from '@/store/tripStore'
import { useTripStore } from '@/store/tripStore'
import { cn } from '@/lib/utils/cn'
import type { ItineraryItem, ItineraryItemInput } from '@/types'

interface ItineraryItemCardProps {
  item: ItineraryItem
}

export function ItineraryItemCard({ item }: ItineraryItemCardProps) {
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const { userRole } = useTripStore()
  const updateItem = useUpdateItineraryItem()
  const deleteItem = useDeleteItineraryItem()

  const toggleComplete = () => {
    updateItem.mutate({
      id: item.id,
      trip_id: item.trip_id,
      is_completed: !item.is_completed,
    })
  }

  const handleUpdate = async (
    data: Omit<ItineraryItemInput, 'trip_id' | 'trip_day_id' | 'is_completed' | 'sort_order'>
  ) => {
    await updateItem.mutateAsync({ id: item.id, trip_id: item.trip_id, ...data })
    setShowEdit(false)
  }

  const handleDelete = async () => {
    await deleteItem.mutateAsync({ id: item.id, trip_id: item.trip_id })
  }

  return (
    <>
      <Card padding="sm" className={cn('transition-opacity', item.is_completed && 'opacity-60')}>
        <div className="flex items-start gap-3">
          {/* Complete toggle */}
          <button
            onClick={toggleComplete}
            className="mt-0.5 flex-shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
          >
            {item.is_completed ? (
              <CheckCircle size={18} className="text-[var(--color-success)]" />
            ) : (
              <Circle size={18} />
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <ItemTypeIcon type={item.type} size={14} />
              <span
                className={cn(
                  'text-sm font-medium text-[var(--color-text)] truncate',
                  item.is_completed && 'line-through'
                )}
              >
                {item.title}
              </span>
            </div>

            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
              {item.start_time && (
                <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                  <Clock size={10} />
                  <span>
                    {formatTime(item.start_time)}
                    {item.end_time && ` – ${formatTime(item.end_time)}`}
                  </span>
                </div>
              )}
              {item.location && (
                <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                  <MapPin size={10} />
                  <span className="truncate max-w-[150px]">{item.location}</span>
                </div>
              )}
            </div>

            {item.notes && (
              <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-2">
                {item.notes}
              </p>
            )}
          </div>

          {/* Actions */}
          {canWrite(userRole) && (
            <div className="flex gap-1 flex-shrink-0">
              <Button variant="ghost" size="sm" onClick={() => setShowEdit(true)} className="px-1.5 py-1">
                <Edit2 size={13} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDelete(true)}
                className="px-1.5 py-1"
              >
                <Trash2 size={13} className="text-red-400" />
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Item">
        <ItineraryItemForm
          onSubmit={handleUpdate}
          onCancel={() => setShowEdit(false)}
          loading={updateItem.isPending}
          defaultValues={item}
        />
      </Modal>

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Item"
        message="Are you sure you want to delete this item?"
        loading={deleteItem.isPending}
      />
    </>
  )
}
