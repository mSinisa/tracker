import type { Category } from '../../domain/category'
import type { Day } from '../../domain/day'
import type { Progress } from '../../domain/progress'

export interface CategoryOverview {
  category: Category
  progress: Progress
  streak: number | null // only for daily goals
  checkedInToday: boolean
}

export interface MonthView {
  month: Day // the 1st of the month
  days: Record<string, string[]> // date -> ids of the categories checked in that day
}

/** What the app offers for looking at progress. Called by the Today and Calendar screens. */
export interface ForSeeingProgress {
  /** One card per category for the Today screen. */
  getTodayOverview(): Promise<CategoryOverview[]>
  /** Every check-in of one month, across all categories, for the Calendar screen. */
  getMonth(anyDayInMonth: Day): Promise<MonthView>
}
