export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  TODAY: '/today',
  WEEK: '/week',
  SETTINGS: '/settings',
  TRIP_DETAIL: '/trips/:tripId',
  TRIP_ITINERARY: '/trips/:tripId/itinerary',
  TRIP_ACTIONS: '/trips/:tripId/actions',
  TRIP_EXPENSES: '/trips/:tripId/expenses',
  TRIP_BOOKINGS: '/trips/:tripId/bookings',
  TRIP_MEMBERS: '/trips/:tripId/members',
} as const

export function tripPath(tripId: string) {
  return `/trips/${tripId}`
}

export function tripItineraryPath(tripId: string) {
  return `/trips/${tripId}/itinerary`
}

export function tripActionsPath(tripId: string) {
  return `/trips/${tripId}/actions`
}

export function tripExpensesPath(tripId: string) {
  return `/trips/${tripId}/expenses`
}

export function tripBookingsPath(tripId: string) {
  return `/trips/${tripId}/bookings`
}

export function tripMembersPath(tripId: string) {
  return `/trips/${tripId}/members`
}
