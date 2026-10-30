import type { Day } from '@/core/domain/day'
import { entryId, type Entry } from '@/core/domain/entry'
import type { ForStoringEntries } from '@/core/ports/out'

/** Keeps entries in memory, one per category and day. Used by tests. */
export class InMemoryEntryStore implements ForStoringEntries {
  private readonly items = new Map<string, Entry>()

  constructor(initial: Entry[] = []) {
    initial.forEach((e) => this.items.set(entryId(e), { ...e }))
  }

  async save(entry: Entry): Promise<void> {
    this.items.set(entryId(entry), { ...entry })
  }

  async remove(categoryId: string, date: Day): Promise<void> {
    this.items.delete(entryId({ categoryId, date }))
  }

  async listBetween(categoryId: string, from: Day, to: Day): Promise<Entry[]> {
    return this.sorted().filter(
      (e) => e.categoryId === categoryId && e.date >= from && e.date <= to,
    )
  }

  async listAll(): Promise<Entry[]> {
    return this.sorted()
  }

  async removeAllFor(categoryId: string): Promise<void> {
    for (const [id, entry] of this.items) {
      if (entry.categoryId === categoryId) this.items.delete(id)
    }
  }

  private sorted(): Entry[] {
    return [...this.items.values()]
      .map((e) => ({ ...e }))
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  }
}
