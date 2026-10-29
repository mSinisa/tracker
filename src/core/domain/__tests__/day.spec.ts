import { describe, it, expect } from 'vitest'
import { dayOf, parseDay, addDays, startOfWeek, startOfMonth } from '../day'

describe('Day', () => {
  it('uses the local date, not UTC', () => {
    // 00:30 on 1 Nov in Madrid is still 31 Oct in UTC
    expect(dayOf(new Date(2026, 10, 1, 0, 30))).toBe('2026-11-01')
  })
  it('rejects impossible dates', () => {
    expect(() => parseDay('2026-02-30')).toThrow()
  })
  it('adds days across a month end', () => {
    expect(addDays(parseDay('2026-10-31'), 1)).toBe('2026-11-01')
  })
  it('finds the Monday of a week', () => {
    expect(startOfWeek(parseDay('2026-10-29'))).toBe('2026-10-26')
  })
  it('finds a Monday in the previous month', () => {
    expect(startOfWeek(parseDay('2026-11-01'))).toBe('2026-10-26')
  })
  it('finds the first of the month', () => {
    expect(startOfMonth(parseDay('2026-10-29'))).toBe('2026-10-01')
  })
})
