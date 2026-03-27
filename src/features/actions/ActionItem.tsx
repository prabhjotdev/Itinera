import { useState } from 'react'
import { CheckCircle, Circle, Calendar, Edit2, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { ActionForm } from './ActionForm'
import { useUpdateAction, useDeleteAction } from '@/hooks/useActions'
import { formatDateShort } from '@/lib/utils/date'
import { canWrite } from '@/store/tripStore'
import { useTripStore } from '@/store/tripStore'
import { cn } from '@/lib/utils/cn'
import type { TripAction, TripActionInput } from '@/types'

interface ActionItemProps {
  action: TripAction
}

export function ActionItem({ action }: ActionItemProps) {
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const { userRole } = useTripStore()
  const updateAction = useUpdateAction()
  const deleteAction = useDeleteAction()

  const toggleComplete = () => {
    updateAction.mutate({
      id: action.id,
      trip_id: action.trip_id,
      status: action.status === 'completed' ? 'pending' : 'completed',
    })
  }

  const handleUpdate = async (data: Omit<TripActionInput, 'trip_id'>) => {
    await updateAction.mutateAsync({
      id: action.id,
      trip_id: action.trip_id,
      ...data,
    })
    setShowEdit(false)
  }

  return (
    <>
      <Card
        padding="sm"
        className={cn('transition-opacity', action.status === 'completed' && 'opacity-60')}
      >
        <div className="flex items-start gap-3">
          <button
            onClick={toggleComplete}
            className="mt-0.5 flex-shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
          >
            {action.status === 'completed' ? (
              <CheckCircle size={18} className="text-[var(--color-success)]" />
            ) : (
              <Circle size={18} />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <p
              className={cn(
                'text-sm font-medium text-[var(--color-text)]',
                action.status === 'completed' && 'line-through'
              )}
            >
              {action.title}
            </p>

            {action.due_date && (
              <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] mt-0.5">
                <Calendar size={10} />
                <span>{formatDateShort(action.due_date)}</span>
              </div>
            )}

            {action.notes && (
              <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-2">
                {action.notes}
              </p>
            )}
          </div>

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

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Action">
        <ActionForm
          onSubmit={handleUpdate}
          onCancel={() => setShowEdit(false)}
          loading={updateAction.isPending}
          defaultValues={action}
        />
      </Modal>

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={() => deleteAction.mutate({ id: action.id, trip_id: action.trip_id })}
        title="Delete Action"
        message="Are you sure you want to delete this action?"
        loading={deleteAction.isPending}
      />
    </>
  )
}
