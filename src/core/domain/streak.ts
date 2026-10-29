import { type Day, addDays } from './day'

/** Consecutive days up to today. Today doesn't break the streak until it's over. */
export function streakFor(days: Day[], today: Day): number {
  const done = new Set(days)
  let day = done.has(today) ? today : addDays(today, -1)
  let count = 0
  while (done.has(day)) {
    count++
    day = addDays(day, -1)
  }
  return count
}
