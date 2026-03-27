import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, DollarSign, Trash2, Edit2 } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageSpinner } from '@/components/ui/Spinner'
import { ExpenseForm } from './ExpenseForm'
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from '@/hooks/useExpenses'
import { useTrip } from '@/hooks/useTrips'
import { canWrite } from '@/store/tripStore'
import { useTripStore } from '@/store/tripStore'
import { EXPENSE_CATEGORIES } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDateShort } from '@/lib/utils/date'
import type { Expense, ExpenseInput } from '@/types'

export function ExpensesPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const [showCreate, setShowCreate] = useState(false)
  const [editExpense, setEditExpense] = useState<Expense | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { userRole } = useTripStore()

  const { data: expenses, isLoading } = useExpenses(tripId)
  const { data: trip } = useTrip(tripId)
  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense()
  const deleteExpense = useDeleteExpense()

  const totalByCurrency: Record<string, number> = {}
  expenses?.forEach((e) => {
    totalByCurrency[e.currency] = (totalByCurrency[e.currency] || 0) + e.amount
  })

  const categoryTotals: Record<string, number> = {}
  expenses?.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount
  })

  const handleCreate = async (
    data: Omit<ExpenseInput, 'trip_id' | 'paid_by' | 'itinerary_item_id'>
  ) => {
    await createExpense.mutateAsync({
      ...data,
      trip_id: tripId!,
      paid_by: '',
      itinerary_item_id: null,
    })
    setShowCreate(false)
  }

  const handleUpdate = async (
    data: Omit<ExpenseInput, 'trip_id' | 'paid_by' | 'itinerary_item_id'>
  ) => {
    if (!editExpense) return
    await updateExpense.mutateAsync({ id: editExpense.id, trip_id: tripId!, ...data })
    setEditExpense(null)
  }

  if (isLoading) return <PageSpinner />

  const currency = trip?.currency || 'USD'
  const grandTotal = totalByCurrency[currency] || 0

  return (
    <>
      <TopBar
        title="Expenses"
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
        {/* Summary */}
        {expenses && expenses.length > 0 && (
          <Card className="mb-4" padding="md">
            <p className="text-xs text-[var(--color-text-muted)] font-medium uppercase tracking-wide mb-1">
              Total Spent
            </p>
            <p className="text-2xl font-bold text-[var(--color-text)]">
              {formatCurrency(grandTotal, currency)}
            </p>

            {/* Category breakdown */}
            <div className="mt-3 space-y-1.5">
              {EXPENSE_CATEGORIES.filter((c) => categoryTotals[c.value] > 0).map((cat) => {
                const amount = categoryTotals[cat.value] || 0
                const pct = grandTotal > 0 ? (amount / grandTotal) * 100 : 0
                return (
                  <div key={cat.value} className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-[var(--color-text-muted)]">{cat.label}</span>
                        <span className="text-[var(--color-text)] font-medium">
                          {formatCurrency(amount, currency)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: cat.color }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {!expenses?.length ? (
          <EmptyState
            icon={DollarSign}
            title="No expenses yet"
            description="Track your trip spending here"
            action={
              canWrite(userRole)
                ? { label: 'Add Expense', onClick: () => setShowCreate(true) }
                : undefined
            }
          />
        ) : (
          <div className="space-y-2">
            {expenses.map((expense) => {
              const catInfo = EXPENSE_CATEGORIES.find((c) => c.value === expense.category)
              return (
                <Card key={expense.id} padding="sm">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: catInfo?.color + '20' }}
                    >
                      <DollarSign size={14} style={{ color: catInfo?.color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-[var(--color-text)] truncate">
                          {expense.title}
                        </p>
                        <p className="text-sm font-bold text-[var(--color-text)] flex-shrink-0 ml-2">
                          {formatCurrency(expense.amount, expense.currency)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{ backgroundColor: (catInfo?.color ?? '#9ca3af') + '20', color: catInfo?.color }}
                        >
                          {catInfo?.label}
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {formatDateShort(expense.expense_date)}
                        </span>
                      </div>
                    </div>

                    {canWrite(userRole) && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditExpense(expense)}
                          className="px-1.5 py-1"
                        >
                          <Edit2 size={13} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(expense.id)}
                          className="px-1.5 py-1"
                        >
                          <Trash2 size={13} className="text-red-400" />
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </PageContainer>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Expense">
        <ExpenseForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
          loading={createExpense.isPending}
          tripId={tripId!}
        />
      </Modal>

      <Modal
        isOpen={!!editExpense}
        onClose={() => setEditExpense(null)}
        title="Edit Expense"
      >
        <ExpenseForm
          onSubmit={handleUpdate}
          onCancel={() => setEditExpense(null)}
          loading={updateExpense.isPending}
          defaultValues={editExpense || undefined}
          tripId={tripId!}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deleteExpense.mutate({ id: deleteId, trip_id: tripId! })
          setDeleteId(null)
        }}
        title="Delete Expense"
        message="Are you sure you want to delete this expense?"
        loading={deleteExpense.isPending}
      />
    </>
  )
}
