export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
]

export const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Vancouver',
  'America/Sao_Paulo',
  'America/Mexico_City',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Amsterdam',
  'Europe/Stockholm',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Pacific/Auckland',
  'Pacific/Honolulu',
]

export const EXPENSE_CATEGORIES = [
  { value: 'accommodation', label: 'Accommodation', color: '#818cf8' },
  { value: 'food', label: 'Food & Drink', color: '#f97316' },
  { value: 'transport', label: 'Transport', color: '#06b6d4' },
  { value: 'activities', label: 'Activities', color: '#a78bfa' },
  { value: 'shopping', label: 'Shopping', color: '#ec4899' },
  { value: 'health', label: 'Health', color: '#4ade80' },
  { value: 'communication', label: 'Communication', color: '#fbbf24' },
  { value: 'other', label: 'Other', color: '#9ca3af' },
] as const

export const ITEM_TYPE_COLORS: Record<string, string> = {
  flight: '#60a5fa',
  hotel: '#a78bfa',
  activity: '#4ade80',
  transport: '#fb923c',
  custom: '#e879f9',
}

export const DB_NAME = 'itinera-db'
export const DB_VERSION = 1
