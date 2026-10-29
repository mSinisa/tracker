import type { Day } from './day'

export type EntrySource = 'button' | 'calendar'

export interface Entry {
  categoryId: string
  date: Day
  source: EntrySource
}

/** The Firestore document id: one entry per category per day. */
export function entryId(entry: Pick<Entry, 'categoryId' | 'date'>): string {
  return `${entry.categoryId}_${entry.date}`
}

export function createEntry(categoryId: string, date: Day, today: Day, source: EntrySource): Entry {
  if (date > today) throw new Error('Future days cannot be checked in')
  return { categoryId, date, source }
}
