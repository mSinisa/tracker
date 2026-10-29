import { describe, it, expect } from 'vitest'
import { parseDay } from '../day'
import { periodStart, type Goal } from '../goal'

describe('periodStart', () => {
  it('starts a monthly goal on the 1st', () => {
    const goal: Goal = { type: 'perMonth', target: 8 }
    expect(periodStart(goal, parseDay('2026-10-29'))).toBe('2026-10-01')
  })

  it('starts a weekly goal on the Monday before a Sunday', () => {
    const goal: Goal = { type: 'perWeek', target: 3 }
    expect(periodStart(goal, parseDay('2026-11-01'))).toBe('2026-10-26')
  })

  it('keeps a weekly goal on Monday when today is Monday', () => {
    const goal: Goal = { type: 'perWeek', target: 3 }
    expect(periodStart(goal, parseDay('2026-10-26'))).toBe('2026-10-26')
  })

  it('starts a daily goal today', () => {
    const goal: Goal = { type: 'daily' }
    expect(periodStart(goal, parseDay('2026-10-29'))).toBe('2026-10-29')
  })
})
