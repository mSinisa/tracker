import { InMemoryCategoryStore } from '@/adapters/storage/InMemoryCategoryStore'
import { InMemoryEntryStore } from '@/adapters/storage/InMemoryEntryStore'
import { FixedClock } from '@/adapters/clock/FixedClock'
import type { Category } from '@/core/domain/category'
import { parseDay } from '@/core/domain/day'
import type { Entry } from '@/core/domain/entry'

export const office: Category = {
  id: 'office-days',
  name: 'Office days',
  color: 'blue',
  goal: { type: 'perMonth', target: 8 },
}

export const workout: Category = {
  id: 'workout',
  name: 'Workout',
  color: 'green',
  goal: { type: 'perWeek', target: 3 },
}

export const reading: Category = {
  id: 'reading',
  name: 'Reading',
  color: 'orange',
  goal: { type: 'daily' },
}

/** A check-in made with the button, e.g. entry('office-days', '2026-10-02'). */
export const entry = (categoryId: string, date: string): Entry => ({
  categoryId,
  date: parseDay(date),
  source: 'button',
})

/** Fresh in-memory adapters, with "today" frozen on Thursday 29 October 2026. */
export function setup(categories: Category[] = [office], entries: Entry[] = []) {
  return {
    categories: new InMemoryCategoryStore(categories),
    entries: new InMemoryEntryStore(entries),
    clock: new FixedClock(parseDay('2026-10-29')),
  }
}
