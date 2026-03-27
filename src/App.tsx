import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthInit } from '@/hooks/useAuth'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useTheme } from '@/hooks/useTheme'
import { AppShell } from '@/components/layout/AppShell'
import { AuthGuard } from '@/features/auth/AuthGuard'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { PageSpinner } from '@/components/ui/Spinner'
import type { ThemeName } from '@/types'

// Lazy-loaded pages
const TripsPage = lazy(() => import('@/features/trips/TripsPage').then(m => ({ default: m.TripsPage })))
const TripDetailPage = lazy(() => import('@/features/trips/TripDetailPage').then(m => ({ default: m.TripDetailPage })))
const TodayPage = lazy(() => import('@/features/today/TodayPage').then(m => ({ default: m.TodayPage })))
const WeekPage = lazy(() => import('@/features/week/WeekPage').then(m => ({ default: m.WeekPage })))
const ItineraryPage = lazy(() => import('@/features/itinerary/ItineraryPage').then(m => ({ default: m.ItineraryPage })))
const ActionsPage = lazy(() => import('@/features/actions/ActionsPage').then(m => ({ default: m.ActionsPage })))
const ExpensesPage = lazy(() => import('@/features/expenses/ExpensesPage').then(m => ({ default: m.ExpensesPage })))
const BookingsPage = lazy(() => import('@/features/bookings/BookingsPage').then(m => ({ default: m.BookingsPage })))
const MembersPage = lazy(() => import('@/features/members/MembersPage').then(m => ({ default: m.MembersPage })))
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage').then(m => ({ default: m.SettingsPage })))

function AppInit() {
  useAuthInit()
  useOnlineStatus()

  // Init theme from localStorage
  const { applyTheme } = useTheme()
  useEffect(() => {
    const saved = (localStorage.getItem('itinera-theme') || 'pastel') as ThemeName
    applyTheme(saved)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

export function App() {
  return (
    <BrowserRouter>
      <AppInit />
      <Suspense fallback={<div className="h-screen flex items-center justify-center bg-[var(--color-bg)]"><PageSpinner /></div>}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route
            element={
              <AuthGuard>
                <AppShell />
              </AuthGuard>
            }
          >
            <Route path="/" element={<TripsPage />} />
            <Route path="/today" element={<TodayPage />} />
            <Route path="/week" element={<WeekPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/trips/:tripId" element={<TripDetailPage />} />
            <Route path="/trips/:tripId/itinerary" element={<ItineraryPage />} />
            <Route path="/trips/:tripId/actions" element={<ActionsPage />} />
            <Route path="/trips/:tripId/expenses" element={<ExpensesPage />} />
            <Route path="/trips/:tripId/bookings" element={<BookingsPage />} />
            <Route path="/trips/:tripId/members" element={<MembersPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
