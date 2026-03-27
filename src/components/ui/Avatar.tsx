import { cn } from '@/lib/utils/cn'

interface AvatarProps {
  name?: string | null
  src?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const COLORS = [
  'bg-purple-200 text-purple-700',
  'bg-blue-200 text-blue-700',
  'bg-green-200 text-green-700',
  'bg-yellow-200 text-yellow-700',
  'bg-pink-200 text-pink-700',
  'bg-orange-200 text-orange-700',
]

function getColorClass(name: string): string {
  let hash = 0
  for (const char of name) hash = char.charCodeAt(0) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const sizeClass = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  }[size]

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'User'}
        className={cn('rounded-full object-cover', sizeClass, className)}
      />
    )
  }

  const displayName = name || '?'
  const colorClass = getColorClass(displayName)

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold flex-shrink-0',
        colorClass,
        sizeClass,
        className
      )}
    >
      {getInitials(displayName)}
    </div>
  )
}
