import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, CheckSquare } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageSpinner } from '@/components/ui/Spinner'
import { ActionItem } from './ActionItem'
import { ActionForm } from './ActionForm'
import { useActions, useCreateAction } from '@/hooks/useActions'
import { canWrite } from '@/store/tripStore'
import { useTripStore } from '@/store/tripStore'
import { cn } from '@/lib/utils/cn'
import type { TripActionInput } from '@/types'

export function ActionsPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState<'pending' | 'completed'>('pending')
  const { userRole } = useTripStore()

  const { data: actions, isLoading } = useActions(tripId)
  const createAction = useCreateAction()

  const filtered = actions?.filter((a) => a.status === filter) ?? []

  const handleCreate = async (data: Omit<TripActionInput, 'trip_id'>) => {
    await createAction.mutateAsync({ ...data, trip_id: tripId! })
    setShowCreate(false)
  }

  return (
    <>
      <TopBar
        title="Actions"
        showBack
        actions={
          canWrite(userRole) ? (
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus size={16} />
            </Button>
          ) : null
        }
      />

      {/* Filter tabs */}
      <div className="flex border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        {(['pending', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={cn(
              'flex-1 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors',
              filter === tab
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-text-muted)]'
            )}
          >
            {tab}
            {actions && (
              <span className="ml-1.5 text-xs">
                ({actions.filter((a) => a.status === tab).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <PageContainer>
        {isLoading ? (
          <PageSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title={filter === 'pending' ? 'No pending actions' : 'No completed actions'}
            description={
              filter === 'pending'
                ? 'Create actions to track tasks for this trip'
                : 'Complete some actions to see them here'
            }
            action={
              filter === 'pending' && canWrite(userRole)
                ? { label: 'Create Action', onClick: () => setShowCreate(true) }
                : undefined
            }
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((action) => (
              <ActionItem key={action.id} action={action} />
            ))}
          </div>
        )}
      </PageContainer>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Action">
        <ActionForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
          loading={createAction.isPending}
        />
      </Modal>
    </>
  )
}
