import type { Day } from '../domain/day'
import type { Entry } from '../domain/entry'

/** What the core needs from wherever check-ins are kept. */
export interface EntryStore {
  save(entry: Entry): Promise<void> // saving the same category and day twice keeps one
  remove(categoryId: string, date: Day): Promise<void>
  listBetween(categoryId: string, from: Day, to: Day): Promise<Entry[]> // inclusive range
  listAll(): Promise<Entry[]> // for export
  removeAllFor(categoryId: string): Promise<void> // when a category is deleted
}
