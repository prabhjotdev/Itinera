import { Plane, Hotel, Zap, Bus, Star } from 'lucide-react'
import { ITEM_TYPE_COLORS } from '@/lib/constants'
import type { ItemType } from '@/types'

const ICONS: Record<ItemType, React.ElementType> = {
  flight: Plane,
  hotel: Hotel,
  activity: Zap,
  transport: Bus,
  custom: Star,
}

interface ItemTypeIconProps {
  type: ItemType
  size?: number
  className?: string
}

export function ItemTypeIcon({ type, size = 16, className }: ItemTypeIconProps) {
  const Icon = ICONS[type] || Star
  const color = ITEM_TYPE_COLORS[type] || '#9ca3af'

  return <Icon size={size} color={color} className={className} />
}
