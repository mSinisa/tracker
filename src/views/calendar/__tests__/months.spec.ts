import { describe, it, expect } from 'vitest'
import { parseDay, type Day } from '@/core/domain/day'
import { addMonths, dayLabel, dayNumber, monthGrid, monthLabel } from '../months'

const numbers = (weeks: (Day | null)[][]) =>
  weeks.map((week) => week.map((day) => (day ? dayNumber(day) : 0)))

describe('monthGrid', () => {
  it('starts on Monday, so a month starting on Sunday gets 6 empty cells first', () => {
    const weeks = monthGrid(parseDay('2026-11-15')) // 1 Nov 2026 is a Sunday
    expect(weeks).toHaveLength(6)
    expect(numbers(weeks)[0]).toEqual([0, 0, 0, 0, 0, 0, 1])
    expect(numbers(weeks)[5]).toEqual([30, 0, 0, 0, 0, 0, 0])
  })

  it('lays out a 31-day month starting on Thursday in 5 weeks', () => {
    const weeks = monthGrid(parseDay('2026-10-29'))
    expect(numbers(weeks)).toEqual([
      [0, 0, 0, 1, 2, 3, 4],
      [5, 6, 7, 8, 9, 10, 11],
      [12, 13, 14, 15, 16, 17, 18],
      [19, 20, 21, 22, 23, 24, 25],
      [26, 27, 28, 29, 30, 31, 0],
    ])
  })

  it('fits a February starting on Monday into exactly 4 weeks', () => {
    const weeks = monthGrid(parseDay('2027-02-10'))
    expect(weeks).toHaveLength(4)
    expect(numbers(weeks)[3]).toEqual([22, 23, 24, 25, 26, 27, 28])
  })

  it('includes the 29th in a leap-year February', () => {
    const weeks = numbers(monthGrid(parseDay('2028-02-01'))) // 1 Feb 2028 is a Tuesday
    expect(weeks[0]).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(weeks[weeks.length - 1]).toEqual([28, 29, 0, 0, 0, 0, 0])
  })

  it('returns real days', () => {
    expect(monthGrid(parseDay('2026-11-01'))[0]?.[6]).toBe('2026-11-01')
  })
})

describe('addMonths', () => {
  it('moves to the 1st of a later or earlier month, across years', () => {
    expect(addMonths(parseDay('2026-11-15'), 1)).toBe('2026-12-01')
    expect(addMonths(parseDay('2026-12-31'), 1)).toBe('2027-01-01')
    expect(addMonths(parseDay('2026-01-31'), -1)).toBe('2025-12-01')
    expect(addMonths(parseDay('2026-11-01'), -13)).toBe('2025-10-01')
  })
})

describe('monthLabel', () => {
  it('names the month and year', () => {
    expect(monthLabel(parseDay('2026-11-15'))).toBe('November 2026')
    expect(monthLabel(parseDay('2027-01-01'))).toBe('January 2027')
  })
})

describe('dayLabel', () => {
  it('names the weekday, day and month', () => {
    expect(dayLabel(parseDay('2026-10-21'))).toBe('Wed 21 October')
  })
})
