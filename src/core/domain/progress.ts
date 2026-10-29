import type { Day } from './day'
import { type Goal, periodStart } from './goal'

export interface Progress {
  done: number
  target: number | null
  left: number
  reached: boolean
}

export function progressFor(goal: Goal, days: Day[], today: Day): Progress {
  const start = periodStart(goal, today)
  const done = new Set(days.filter((d) => d >= start && d <= today)).size
  if (goal.type === 'daily') return { done, target: null, left: 0, reached: done > 0 }
  const left = Math.max(goal.target - done, 0)
  return { done, target: goal.target, left, reached: done >= goal.target }
}
