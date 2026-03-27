import { cn } from '@/lib/utils/cn'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ children, className, onClick, padding = 'md' }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-[var(--color-surface)] rounded-lg shadow-card border border-[var(--color-border)]',
        onClick && 'cursor-pointer hover:shadow-lg transition-shadow active:scale-[0.99]',
        {
          'p-0': padding === 'none',
          'p-3': padding === 'sm',
          'p-4': padding === 'md',
          'p-5': padding === 'lg',
        },
        className
      )}
    >
      {children}
    </div>
  )
}
