import { addDays, parseDay, startOfMonth, startOfWeek, type Day } from '@/core/domain/day'

/** A month laid out as weeks starting on Monday. Empty cells (null) pad the first and last week. */
export function monthGrid(anyDayInMonth: Day): (Day | null)[][] {
  const first = startOfMonth(anyDayInMonth)
  const month = first.slice(0, 7) // "2026-11"
  const weeks: (Day | null)[][] = []
  let day = startOfWeek(first)
  while (weeks.length === 0 || day.startsWith(month)) {
    const week: (Day | null)[] = []
    for (let i = 0; i < 7; i++) {
      week.push(day.startsWith(month) ? day : null)
      day = addDays(day, 1)
    }
    weeks.push(week)
  }
  return weeks
}

/** The 1st of the month n months later (or earlier, for a negative n). */
export function addMonths(anyDayInMonth: Day, n: number): Day {
  const year = Number(anyDayInMonth.slice(0, 4))
  const month = Number(anyDayInMonth.slice(5, 7)) - 1 + n // 0-based, may run past 11 or below 0
  const y = year + Math.floor(month / 12)
  const m = ((month % 12) + 12) % 12
  return parseDay(`${y}-${String(m + 1).padStart(2, '0')}-01`)
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/** "November 2026". */
export function monthLabel(anyDayInMonth: Day): string {
  const name = MONTHS[Number(anyDayInMonth.slice(5, 7)) - 1] ?? ''
  return `${name} ${anyDayInMonth.slice(0, 4)}`
}

/** The day of the month as a number: "2026-11-01" -> 1. */
export function dayNumber(day: Day): number {
  return Number(day.slice(8, 10))
}

/** "Wed 21 October", for the day panel. */
export function dayLabel(day: Day): string {
  const date = new Date(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, dayNumber(day))
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  }).format(date)
}
