import type { Category } from '@/core/domain/category'
import type { MonthView } from '@/core/ports/in'

/** One line under the month name, per category: "6 of 8" for a monthly goal, else a count. */
export interface SummaryLine {
  categoryId: string
  name: string
  text: string
}

export function monthSummary(view: MonthView, categories: Category[]): SummaryLine[] {
  return categories.map((category) => {
    const done = Object.values(view.days).filter((ids) => ids.includes(category.id)).length
    const text =
      category.goal.type === 'perMonth'
        ? `${done} of ${category.goal.target}`
        : `${done} ${done === 1 ? 'day' : 'days'}`
    return { categoryId: category.id, name: category.name, text }
  })
}
