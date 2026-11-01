import { describe, it, expect } from 'vitest'
import type { Category } from '@/core/domain/category'
import type { CategoryOverview } from '@/core/ports/in'
import { describeCard, formatToday } from '../describe'

const office: Category = {
  id: 'office-days',
  name: 'Office days',
  color: 'blue',
  goal: { type: 'perMonth', target: 8 },
}

const card = (overrides: Partial<CategoryOverview>): CategoryOverview => ({
  category: office,
  progress: { done: 5, target: 8, left: 3, reached: false },
  streak: null,
  checkedInToday: false,
  ...overrides,
})

describe('describeCard', () => {
  it('shows a monthly goal in progress', () => {
    expect(describeCard(card({}))).toEqual({
      big: '5 of 8',
      under: 'this month',
      status: '3 left this month',
    })
  })

  it('says when the monthly goal is reached', () => {
    const reached = card({ progress: { done: 8, target: 8, left: 0, reached: true } })
    expect(describeCard(reached).status).toBe('Goal reached this month, you can stop here')
  })

  it('says how many more than needed', () => {
    const over = card({ progress: { done: 9, target: 8, left: 0, reached: true } })
    expect(describeCard(over).status).toBe('Goal reached, 1 more than needed this month')
  })

  it('uses "this week" for a weekly goal', () => {
    const weekly = card({
      category: { ...office, goal: { type: 'perWeek', target: 3 } },
      progress: { done: 1, target: 3, left: 2, reached: false },
    })
    expect(describeCard(weekly)).toEqual({
      big: '1 of 3',
      under: 'this week',
      status: '2 left this week',
    })
  })

  it('shows a streak for a daily goal', () => {
    const daily = { ...office, goal: { type: 'daily' } } as const
    expect(describeCard(card({ category: daily, streak: 12, checkedInToday: true }))).toEqual({
      big: '12',
      under: 'day streak',
      status: 'Done today',
    })
    expect(describeCard(card({ category: daily, streak: 3 })).status).toBe(
      'Check in today to keep your streak',
    )
    expect(describeCard(card({ category: daily, streak: 0 })).status).toBe('Not done today')
  })
})

describe('formatToday', () => {
  it('formats a date like "Sun 1 November"', () => {
    expect(formatToday(new Date(2026, 10, 1, 9, 0))).toBe('Sun 1 November')
  })
})
