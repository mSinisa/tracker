import { createCategory } from '../domain/category'
import { parseDay } from '../domain/day'
import { createEntry } from '../domain/entry'
import type { Backup, ForBackingUp, ImportResult } from '../ports/in'
import type { ForGettingToday, ForStoringCategories, ForStoringEntries } from '../ports/out'

/** Implements export and import of all categories and entries as one JSON-friendly object. */
export class BackupService implements ForBackingUp {
  constructor(
    private readonly categories: ForStoringCategories,
    private readonly entries: ForStoringEntries,
    private readonly clock: ForGettingToday,
  ) {}

  async exportData(): Promise<Backup> {
    return {
      version: 1,
      exportedOn: this.clock.today(),
      categories: await this.categories.list(),
      entries: await this.entries.listAll(),
    }
  }

  /**
   * Merges a backup into the current data. A file from outside is never trusted:
   * every category and entry goes through the same domain rules as normal use.
   */
  async importData(data: unknown): Promise<ImportResult> {
    const backup = data as Partial<Backup> | null
    if (
      backup?.version !== 1 ||
      !Array.isArray(backup.categories) ||
      !Array.isArray(backup.entries)
    ) {
      throw new Error('This is not a Tracker backup file')
    }

    // Categories: all valid or nothing, because entries depend on them.
    const categories = backup.categories.map((c) => createCategory(c))
    for (const category of categories) await this.categories.save(category)

    // Entries: invalid ones are skipped and counted, so one bad line doesn't block the rest.
    const today = this.clock.today()
    const known = new Set((await this.categories.list()).map((c) => c.id))
    let entries = 0
    let skipped = 0
    for (const raw of backup.entries) {
      try {
        if (!known.has(raw.categoryId)) throw new Error('Unknown category')
        if (raw.source !== 'button' && raw.source !== 'calendar') throw new Error('Bad source')
        await this.entries.save(createEntry(raw.categoryId, parseDay(raw.date), today, raw.source))
        entries++
      } catch {
        skipped++
      }
    }
    return { categories: categories.length, entries, skipped }
  }
}
