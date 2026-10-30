import { parseDay } from '../domain/day'
import { createEntry, type Entry } from '../domain/entry'
import type { ForCheckingIn } from '../ports/in'
import type { ForGettingToday, ForStoringCategories, ForStoringEntries } from '../ports/out'

/** Implements the check-in use cases. Knows the ports, never the adapters behind them. */
export class CheckInService implements ForCheckingIn {
  constructor(
    private readonly categories: ForStoringCategories,
    private readonly entries: ForStoringEntries,
    private readonly clock: ForGettingToday,
  ) {}

  async checkInToday(categoryId: string): Promise<Entry> {
    await this.requireCategory(categoryId)
    const today = this.clock.today()
    const entry = createEntry(categoryId, today, today, 'button')
    await this.entries.save(entry)
    return entry
  }

  async undoCheckIn(categoryId: string): Promise<void> {
    await this.entries.remove(categoryId, this.clock.today())
  }

  async toggleDay(categoryId: string, date: string): Promise<boolean> {
    await this.requireCategory(categoryId)
    const day = parseDay(date)
    const existing = await this.entries.listBetween(categoryId, day, day)
    if (existing.length > 0) {
      await this.entries.remove(categoryId, day)
      return false
    }
    await this.entries.save(createEntry(categoryId, day, this.clock.today(), 'calendar'))
    return true
  }

  private async requireCategory(categoryId: string): Promise<void> {
    if (!(await this.categories.get(categoryId))) {
      throw new Error(`Unknown category: ${categoryId}`)
    }
  }
}
