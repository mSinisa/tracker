import { addDays, startOfMonth, type Day } from '../domain/day'
import { periodStart } from '../domain/goal'
import { progressFor } from '../domain/progress'
import { streakFor } from '../domain/streak'
import type { CategoryOverview, ForSeeingProgress, MonthView } from '../ports/in'
import type { ForGettingToday, ForStoringCategories, ForStoringEntries } from '../ports/out'

/** How far back a streak is looked for. */
const STREAK_LOOKBACK_DAYS = 366

/** Implements the read-only use cases behind the Today and Calendar screens. */
export class ProgressService implements ForSeeingProgress {
  constructor(
    private readonly categories: ForStoringCategories,
    private readonly entries: ForStoringEntries,
    private readonly clock: ForGettingToday,
  ) {}

  async getTodayOverview(): Promise<CategoryOverview[]> {
    const today = this.clock.today()
    const categories = await this.categories.list()
    return Promise.all(
      categories.map(async (category) => {
        const daily = category.goal.type === 'daily'
        // A monthly or weekly goal only needs its current period; a daily streak needs history.
        const from = daily
          ? addDays(today, -STREAK_LOOKBACK_DAYS)
          : periodStart(category.goal, today)
        const days = (await this.entries.listBetween(category.id, from, today)).map((e) => e.date)
        return {
          category,
          progress: progressFor(category.goal, days, today),
          streak: daily ? streakFor(days, today) : null,
          checkedInToday: days.includes(today),
        }
      }),
    )
  }

  async getMonth(anyDayInMonth: Day): Promise<MonthView> {
    const first = startOfMonth(anyDayInMonth)
    // The 1st of the next month, minus one day: works for 28, 29, 30 and 31-day months.
    const last = addDays(startOfMonth(addDays(first, 31)), -1)
    const days: Record<string, string[]> = {}
    for (const category of await this.categories.list()) {
      for (const entry of await this.entries.listBetween(category.id, first, last)) {
        ;(days[entry.date] ??= []).push(category.id)
      }
    }
    return { month: first, days }
  }
}
