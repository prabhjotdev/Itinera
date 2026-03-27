import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { ToastContainer } from '@/components/ui/Toast'

export function AppShell() {
  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)]">
      {/* Main scrollable content */}
      <main className="flex-1 overflow-y-auto pb-[60px]">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <BottomNav />

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  )
}
