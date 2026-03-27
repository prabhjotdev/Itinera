import type { ExportData, Expense } from '@/types'

export function exportToJSON(data: ExportData): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `itinera-export-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportExpensesToCSV(expenses: Expense[], tripTitle: string): void {
  const headers = ['Date', 'Title', 'Category', 'Amount', 'Currency', 'Notes']
  const rows = expenses.map((e) => [
    e.expense_date,
    `"${e.title.replace(/"/g, '""')}"`,
    e.category,
    e.amount,
    e.currency,
    `"${(e.notes || '').replace(/"/g, '""')}"`,
  ])
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${tripTitle.replace(/\s+/g, '-').toLowerCase()}-expenses.csv`
  a.click()
  URL.revokeObjectURL(url)
}
