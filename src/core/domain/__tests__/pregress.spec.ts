import { describe, it, expect } from 'vitest'
import { parseDay, type Day } from '../day'
import { progressFor } from '../progress'

const days = (...values: string[]): Day[] => values.map(parseDay)
const today = parseDay('2026-10-29')
const office = { type: 'perMonth', target: 8 } as const

describe('progressFor', () => {
  it('counts days done this month and what is left', () => {
    const p = progressFor(
      office,
      days('2026-10-02', '2026-10-07', '2026-10-13', '2026-10-16', '2026-10-22'),
      today,
    )
    expect(p).toEqual({ done: 5, target: 8, left: 3, reached: false })
  })
  it('is reached at 8 and never goes below 0 left', () => {
    const nine = days(
      '2026-10-01',
      '2026-10-02',
      '2026-10-05',
      '2026-10-06',
      '2026-10-07',
      '2026-10-08',
      '2026-10-09',
      '2026-10-12',
      '2026-10-13',
    )
    const p = progressFor(office, nine, today)
    expect(p.reached).toBe(true)
    expect(p.left).toBe(0)
    expect(p.done).toBe(9)
  })
  it('ignores days from last month', () => {
    expect(progressFor(office, days('2026-09-30'), today).done).toBe(0)
  })
  it('counts the same day only once', () => {
    expect(progressFor(office, days('2026-10-02', '2026-10-02'), today).done).toBe(1)
  })
  it('counts a weekly goal from Monday', () => {
    const p = progressFor(
      { type: 'perWeek', target: 3 },
      days('2026-10-25', '2026-10-26', '2026-10-28'),
      today,
    )
    expect(p).toEqual({ done: 2, target: 3, left: 1, reached: false }) // Sunday 25th is last week
  })
})
