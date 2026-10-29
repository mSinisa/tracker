import { describe, it, expect } from 'vitest'
import { parseDay, type Day } from '../day'
import { streakFor } from '../streak'

const days = (...values: string[]): Day[] => values.map(parseDay)
const today = parseDay('2026-10-29')

describe('streakFor', () => {
  it('is 0 with no entries', () => {
    expect(streakFor([], today)).toBe(0)
  })
  it('counts consecutive days including today', () => {
    expect(streakFor(days('2026-10-27', '2026-10-28', '2026-10-29'), today)).toBe(3)
  })
  it("keeps yesterday's streak while today is still open", () => {
    expect(streakFor(days('2026-10-27', '2026-10-28'), today)).toBe(2)
  })
  it('stops at a gap', () => {
    expect(streakFor(days('2026-10-25', '2026-10-27', '2026-10-28', '2026-10-29'), today)).toBe(3)
  })
  it('continues across a month end', () => {
    expect(streakFor(days('2026-10-30', '2026-10-31', '2026-11-01'), parseDay('2026-11-01'))).toBe(
      3,
    )
  })
})
