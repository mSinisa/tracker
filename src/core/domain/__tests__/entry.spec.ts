import { describe, it, expect } from 'vitest'
import { parseDay } from '../day'
import { createEntry, entryId } from '../entry'

const today = parseDay('2026-10-29')

describe('Entry', () => {
  it('builds one id per category and day', () => {
    expect(entryId({ categoryId: 'office-days', date: today })).toBe('office-days_2026-10-29')
  })
  it('allows today and past days', () => {
    expect(createEntry('office-days', today, today, 'button').date).toBe('2026-10-29')
    expect(createEntry('office-days', parseDay('2026-10-01'), today, 'calendar').source).toBe(
      'calendar',
    )
  })
  it('refuses future days', () => {
    expect(() => createEntry('office-days', parseDay('2026-10-30'), today, 'button')).toThrow()
  })
})
