import { useState } from 'react'
import {
  User,
  Palette,
  Cloud,
  Download,
  Upload,
  Trash2,
  LogOut,
  RefreshCw,
  ChevronRight,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { TopBar } from '@/components/layout/TopBar'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { useSync } from '@/hooks/useSync'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { getDB } from '@/lib/db'
import { exportToJSON, exportExpensesToCSV } from '@/lib/utils/export'
import { parseImportFile } from '@/lib/utils/import'
import { idbPut } from '@/lib/db'
import { CURRENCIES, TIMEZONES } from '@/lib/constants'
import type { ThemeName } from '@/types'
import { cn } from '@/lib/utils/cn'

const THEMES: { name: ThemeName; label: string; colors: string[] }[] = [
  { name: 'pastel', label: 'Pastel', colors: ['#c084fc', '#f0abfc', '#818cf8'] },
  { name: 'minimal', label: 'Minimal', colors: ['#374151', '#6b7280', '#111827'] },
  { name: 'sunset', label: 'Sunset', colors: ['#f97316', '#fb923c', '#ec4899'] },
  { name: 'dark', label: 'Dark', colors: ['#a78bfa', '#7c3aed', '#38bdf8'] },
]

export function SettingsPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { theme, applyTheme } = useTheme()
  const { isOnline, isSyncing, queueCount, lastSyncedAt, triggerSync } = useSync()
  const toast = useToast()
  const { clearAuth } = useAuthStore()

  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showDeleteAll, setShowDeleteAll] = useState(false)
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [currency, setCurrency] = useState(profile?.currency || 'USD')
  const [timezone, setTimezone] = useState(profile?.timezone || 'UTC')
  const [savingProfile, setSavingProfile] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    clearAuth()
    navigate('/login')
  }

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName, currency, timezone })
      .eq('id', user!.id)

    setSavingProfile(false)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Profile updated!')
      setShowEditProfile(false)
    }
  }

  const handleExportJSON = async () => {
    try {
      const db = await getDB()
      const [trips, items, actions, expenses, bookings] = await Promise.all([
        db.getAll('trips'),
        db.getAll('itinerary_items'),
        db.getAll('actions'),
        db.getAll('expenses'),
        db.getAll('bookings'),
      ])

      exportToJSON({
        version: 1,
        exported_at: new Date().toISOString(),
        trips: trips as never[],
        itinerary_items: items as never[],
        actions: actions as never[],
        expenses: expenses as never[],
        bookings: bookings as never[],
      })
      toast.success('Data exported!')
    } catch {
      toast.error('Export failed')
    }
  }

  const handleExportCSV = async () => {
    try {
      const db = await getDB()
      const expenses = await db.getAll('expenses')
      exportExpensesToCSV(expenses as never[], 'all-trips')
      toast.success('Expenses exported!')
    } catch {
      toast.error('Export failed')
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const data = await parseImportFile(file)
      await Promise.all([
        ...data.trips.map((t) => idbPut('trips', t as unknown as Record<string, unknown>)),
        ...data.itinerary_items.map((i) =>
          idbPut('itinerary_items', i as unknown as Record<string, unknown>)
        ),
        ...data.actions.map((a) => idbPut('actions', a as unknown as Record<string, unknown>)),
        ...data.expenses.map((e) => idbPut('expenses', e as unknown as Record<string, unknown>)),
        ...data.bookings.map((b) => idbPut('bookings', b as unknown as Record<string, unknown>)),
      ])
      toast.success(`Imported ${data.trips.length} trip(s)`)
    } catch (err) {
      toast.error((err as Error).message)
    }

    e.target.value = ''
  }

  const handleDeleteAll = async () => {
    try {
      const db = await getDB()
      await Promise.all([
        db.clear('trips'),
        db.clear('itinerary_items'),
        db.clear('actions'),
        db.clear('expenses'),
        db.clear('bookings'),
        db.clear('sync_queue'),
      ])
      await handleSignOut()
    } catch {
      toast.error('Failed to delete data')
    }
  }

  return (
    <>
      <TopBar title="Settings" />

      <PageContainer className="space-y-5">
        {/* Profile */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
            Profile
          </p>
          <Card padding="md">
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={profile?.display_name || user?.email} size="md" />
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  {profile?.display_name || 'User'}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditProfile(true)}
              className="w-full"
            >
              Edit Profile
            </Button>
          </Card>
        </section>

        {/* Appearance */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
            Appearance
          </p>
          <Card padding="md">
            <p className="text-sm font-medium text-[var(--color-text)] mb-3">Theme</p>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.name}
                  onClick={() => applyTheme(t.name)}
                  className={cn(
                    'flex items-center gap-2 p-2.5 rounded-lg border-2 transition-all text-left',
                    theme === t.name
                      ? 'border-[var(--color-primary)] bg-[var(--color-surface-2)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                  )}
                >
                  <div className="flex gap-1">
                    {t.colors.map((color, i) => (
                      <div
                        key={i}
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium text-[var(--color-text)]">{t.label}</span>
                </button>
              ))}
            </div>
          </Card>
        </section>

        {/* Sync */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
            Sync
          </p>
          <Card padding="md">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">Sync Status</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {isOnline ? 'Connected' : 'Offline'}
                  {lastSyncedAt && ` · Last synced ${lastSyncedAt.toLocaleTimeString()}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {queueCount > 0 && (
                  <Badge variant="warning">{queueCount} pending</Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={triggerSync}
                  loading={isSyncing}
                  disabled={!isOnline}
                >
                  <RefreshCw size={14} />
                  Sync
                </Button>
              </div>
            </div>
          </Card>
        </section>

        {/* Data */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
            Data
          </p>
          <Card padding="none" className="overflow-hidden">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--color-surface-2)] transition-colors border-b border-[var(--color-border)]"
            >
              <Download size={16} className="text-[var(--color-primary)]" />
              <div className="flex-1 text-left">
                <p className="text-sm text-[var(--color-text)]">Export All Data</p>
                <p className="text-xs text-[var(--color-text-muted)]">Download as JSON</p>
              </div>
              <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--color-surface-2)] transition-colors border-b border-[var(--color-border)]"
            >
              <Download size={16} className="text-green-500" />
              <div className="flex-1 text-left">
                <p className="text-sm text-[var(--color-text)]">Export Expenses</p>
                <p className="text-xs text-[var(--color-text-muted)]">Download as CSV</p>
              </div>
              <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
            </button>

            <label className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer border-b border-[var(--color-border)]">
              <Upload size={16} className="text-blue-500" />
              <div className="flex-1 text-left">
                <p className="text-sm text-[var(--color-text)]">Import Data</p>
                <p className="text-xs text-[var(--color-text-muted)]">From JSON file</p>
              </div>
              <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </Card>
        </section>

        {/* Danger zone */}
        <section>
          <Card padding="none" className="overflow-hidden">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--color-surface-2)] transition-colors border-b border-[var(--color-border)]"
            >
              <LogOut size={16} className="text-[var(--color-text-muted)]" />
              <span className="text-sm text-[var(--color-text)]">Sign Out</span>
            </button>

            <button
              onClick={() => setShowDeleteAll(true)}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={16} className="text-red-500" />
              <span className="text-sm text-red-600">Delete All Data</span>
            </button>
          </Card>
        </section>

        <div className="pb-4 text-center text-xs text-[var(--color-text-muted)]">
          Itinera v0.1.0
        </div>
      </PageContainer>

      {/* Edit Profile Modal */}
      <Modal isOpen={showEditProfile} onClose={() => setShowEditProfile(false)} title="Edit Profile">
        <div className="p-4 space-y-3">
          <Input
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <Select
            label="Default Currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} – ${c.name}` }))}
          />
          <Select
            label="Home Timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            options={TIMEZONES.map((tz) => ({ value: tz, label: tz }))}
          />
          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={() => setShowEditProfile(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} loading={savingProfile} className="flex-1">
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete all confirm */}
      <ConfirmDialog
        isOpen={showDeleteAll}
        onClose={() => setShowDeleteAll(false)}
        onConfirm={handleDeleteAll}
        title="Delete All Data"
        message="This will permanently delete ALL your trips, itinerary items, expenses, and bookings. This cannot be undone."
        confirmLabel="Delete Everything"
      />
    </>
  )
}
