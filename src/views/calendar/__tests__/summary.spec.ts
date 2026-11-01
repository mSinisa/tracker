import { describe, it, expect } from 'vitest'
import type { Category } from '@/core/domain/category'
import { parseDay } from '@/core/domain/day'
import { monthSummary } from '../summary'

const office: Category = {
  id: 'office-days',
  name: 'Office days',
  color: 'blue',
  goal: { type: 'perMonth', target: 8 },
}
const workout: Category = {
  id: 'workout',
  name: 'Workout',
  color: 'green',
  goal: { type: 'perWeek', target: 3 },
}

const view = {
  month: parseDay('2026-10-01'),
  days: {
    '2026-10-02': ['office-days', 'workout'],
    '2026-10-07': ['office-days'],
    '2026-10-09': ['workout'],
  },
}

describe('monthSummary', () => {
  it('shows "x of target" for a monthly goal and a day count otherwise', () => {
    expect(monthSummary(view, [office, workout])).toEqual([
      { categoryId: 'office-days', name: 'Office days', text: '2 of 8' },
      { categoryId: 'workout', name: 'Workout', text: '2 days' },
    ])
  })

  it('says "1 day" and "0 of 8" correctly', () => {
    const one = { ...view, days: { '2026-10-09': ['workout'] } }
    expect(monthSummary(one, [office, workout]).map((l) => l.text)).toEqual(['0 of 8', '1 day'])
  })
})
