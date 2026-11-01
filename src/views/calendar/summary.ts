import type { Category } from '@/core/domain/category'
import type { Progress } from '@/core/domain/progress'
import type { MonthView } from '@/core/ports/in'

/**
 * One line under the month name, per category: "6 of 8" for a monthly goal, else a count.
 * A weekly goal shows "2 of 3 this week" when this week's progress is given (current month only),
 * because a week can start in the previous month.
 */
export interface SummaryLine {
  categoryId: string
  name: string
  text: string
}

export function monthSummary(
  view: MonthView,
  categories: Category[],
  thisWeek: Record<string, Progress> = {}, // by category id
): SummaryLine[] {
  return categories.map((category) => {
    const week = thisWeek[category.id]
    if (category.goal.type === 'perWeek' && week) {
      const text = `${week.done} of ${category.goal.target} this week`
      return { categoryId: category.id, name: category.name, text }
    }
    const done = Object.values(view.days).filter((ids) => ids.includes(category.id)).length
    const text =
      category.goal.type === 'perMonth'
        ? `${done} of ${category.goal.target}`
        : `${done} ${done === 1 ? 'day' : 'days'}`
    return { categoryId: category.id, name: category.name, text }
  })
}
