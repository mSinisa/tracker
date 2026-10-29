import { type Day, startOfMonth, startOfWeek } from './day'

export type Goal =
  { type: 'perMonth'; target: number } | { type: 'perWeek'; target: number } | { type: 'daily' }

export function periodStart(goal: Goal, today: Day): Day {
  switch (goal.type) {
    case 'perMonth':
      return startOfMonth(today)
    case 'perWeek':
      return startOfWeek(today)
    case 'daily':
      return today
  }
}
