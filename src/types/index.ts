// ─── Auth / Profile ───────────────────────────────────────────────────────────
export interface Profile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  currency: string
  timezone: string
  created_at: string
  updated_at: string
}

// ─── Trips ────────────────────────────────────────────────────────────────────
export interface Trip {
  id: string
  title: string
  destination: string
  start_date: string // YYYY-MM-DD
  end_date: string   // YYYY-MM-DD
  timezone: string
  currency: string
  cover_url: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export type TripInput = Omit<Trip, 'id' | 'created_by' | 'created_at' | 'updated_at'>

// ─── Trip Members ─────────────────────────────────────────────────────────────
export type MemberRole = 'owner' | 'editor' | 'viewer'

export interface TripMember {
  id: string
  trip_id: string
  user_id: string
  role: MemberRole
  invited_by: string | null
  joined_at: string
  // joined via query
  profile?: Profile
}

export interface TripInvitation {
  id: string
  trip_id: string
  invited_email: string
  role: MemberRole
  invited_by: string
  token: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  expires_at: string
  created_at: string
}

// ─── Trip Days ────────────────────────────────────────────────────────────────
export interface TripDay {
  id: string
  trip_id: string
  day_date: string // YYYY-MM-DD
  notes: string | null
}

// ─── Itinerary Items ──────────────────────────────────────────────────────────
export type ItemType = 'flight' | 'hotel' | 'activity' | 'transport' | 'custom'

export interface ItineraryItem {
  id: string
  trip_id: string
  trip_day_id: string | null
  day_date: string // YYYY-MM-DD
  type: ItemType
  title: string
  start_time: string | null // HH:MM
  end_time: string | null   // HH:MM
  location: string | null
  notes: string | null
  is_completed: boolean
  sort_order: number
  created_by: string
  created_at: string
  updated_at: string
}

export type ItineraryItemInput = Omit<
  ItineraryItem,
  'id' | 'created_by' | 'created_at' | 'updated_at'
>

// ─── Actions ──────────────────────────────────────────────────────────────────
export type ActionStatus = 'pending' | 'completed'

export interface TripAction {
  id: string
  trip_id: string
  itinerary_item_id: string | null
  title: string
  notes: string | null
  status: ActionStatus
  due_date: string | null // YYYY-MM-DD
  assigned_to: string | null
  created_by: string
  completed_at: string | null
  created_at: string
  updated_at: string
  // joined
  assigned_profile?: Profile
}

export type TripActionInput = Omit<
  TripAction,
  'id' | 'created_by' | 'created_at' | 'updated_at' | 'completed_at' | 'assigned_profile'
>

// ─── Expenses ─────────────────────────────────────────────────────────────────
export type ExpenseCategory =
  | 'accommodation'
  | 'food'
  | 'transport'
  | 'activities'
  | 'shopping'
  | 'health'
  | 'communication'
  | 'other'

export interface Expense {
  id: string
  trip_id: string
  itinerary_item_id: string | null
  title: string
  amount: number
  currency: string
  category: ExpenseCategory
  paid_by: string
  expense_date: string // YYYY-MM-DD
  notes: string | null
  created_at: string
  updated_at: string
  // joined
  paid_by_profile?: Profile
}

export type ExpenseInput = Omit<
  Expense,
  'id' | 'created_at' | 'updated_at' | 'paid_by_profile'
>

// ─── Bookings ─────────────────────────────────────────────────────────────────
export type BookingType = 'flight' | 'hotel' | 'car' | 'activity' | 'other'

export interface Booking {
  id: string
  trip_id: string
  itinerary_item_id: string | null
  type: BookingType
  title: string
  confirmation_code: string | null
  provider: string | null
  booking_date: string | null // YYYY-MM-DD
  check_in: string | null     // ISO datetime
  check_out: string | null    // ISO datetime
  notes: string | null
  attachment_url: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export type BookingInput = Omit<
  Booking,
  'id' | 'created_by' | 'created_at' | 'updated_at'
>

// ─── Theme ────────────────────────────────────────────────────────────────────
export type ThemeName = 'pastel' | 'minimal' | 'sunset' | 'dark'

// ─── Sync ─────────────────────────────────────────────────────────────────────
export type SyncOperation = 'insert' | 'update' | 'delete'
export type SyncStatus = 'pending' | 'processing' | 'failed'

export interface SyncQueueItem {
  id?: number
  table: string
  operation: SyncOperation
  record_id: string
  payload: Record<string, unknown>
  status: SyncStatus
  retry_count: number
  created_at: number
}

// ─── Export shape ─────────────────────────────────────────────────────────────
export interface ExportData {
  version: number
  exported_at: string
  trips: Trip[]
  itinerary_items: ItineraryItem[]
  actions: TripAction[]
  expenses: Expense[]
  bookings: Booking[]
}
