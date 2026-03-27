import {
  format,
  parseISO,
  isToday,
  isTomorrow,
  isYesterday,
  differenceInDays,
  addDays,
  isBefore,
  isAfter,
  startOfDay,
} from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

export function formatDate(dateStr: string, fmt = 'MMM d, yyyy'): string {
  return format(parseISO(dateStr), fmt)
}

export function formatDateShort(dateStr: string): string {
  const d = parseISO(dateStr)
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'EEE, MMM d')
}

export function formatTime(timeStr: string): string {
  // timeStr is HH:MM
  const [hours, minutes] = timeStr.split(':').map(Number)
  const d = new Date()
  d.setHours(hours, minutes)
  return format(d, 'h:mm a')
}

export function todayString(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function todayInTimezone(timezone: string): string {
  const now = toZonedTime(new Date(), timezone)
  return format(now, 'yyyy-MM-dd')
}

export function nowInTimezone(timezone: string): Date {
  return toZonedTime(new Date(), timezone)
}

export function getDaysBetween(start: string, end: string): string[] {
  const days: string[] = []
  let current = parseISO(start)
  const endDate = parseISO(end)
  while (!isAfter(current, endDate)) {
    days.push(format(current, 'yyyy-MM-dd'))
    current = addDays(current, 1)
  }
  return days
}

export function getNext7Days(): string[] {
  const days: string[] = []
  for (let i = 0; i < 7; i++) {
    days.push(format(addDays(new Date(), i), 'yyyy-MM-dd'))
  }
  return days
}

export function daysUntil(dateStr: string): number {
  return differenceInDays(parseISO(dateStr), startOfDay(new Date()))
}

export function isDateInRange(dateStr: string, start: string, end: string): boolean {
  const d = parseISO(dateStr)
  return !isBefore(d, parseISO(start)) && !isAfter(d, parseISO(end))
}

export function currentTimeStr(): string {
  return format(new Date(), 'HH:mm')
}

export function isTimePast(timeStr: string): boolean {
  const now = format(new Date(), 'HH:mm')
  return timeStr < now
}

export function minutesUntilTime(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  const now = new Date()
  const target = new Date()
  target.setHours(h, m, 0, 0)
  return Math.round((target.getTime() - now.getTime()) / 60000)
}

export { toZonedTime, fromZonedTime, format, parseISO, isToday, isBefore, isAfter }
