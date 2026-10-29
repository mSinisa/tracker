export type Day = string & { readonly __brand: 'Day' }

export function dayOf(date: Date): Day {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}` as Day // local date, never toISOString()
}

function toDate(day: Day): Date {
  const y = Number(day.slice(0, 4))
  const m = Number(day.slice(5, 7))
  const d = Number(day.slice(8, 10))
  return new Date(y, m - 1, d) // local midnight
}

export function parseDay(value: string): Day {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || dayOf(toDate(value as Day)) !== value) {
    throw new Error(`Invalid day: ${value}`)
  }
  return value as Day
}

export function addDays(day: Day, n: number): Day {
  const date = toDate(day)
  date.setDate(date.getDate() + n)
  return dayOf(date)
}

export function startOfWeek(day: Day): Day {
  // weeks start on Monday
  return addDays(day, -((toDate(day).getDay() + 6) % 7))
}

export function startOfMonth(day: Day): Day {
  return `${day.slice(0, 8)}01` as Day
}
