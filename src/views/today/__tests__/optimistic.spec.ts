import { describe, it, expect } from 'vitest'
import type { CategoryOverview } from '@/core/ports/in'
import { withCheckIn } from '../optimistic'

const office: CategoryOverview = {
  category: {
    id: 'office-days',
    name: 'Office days',
    color: 'blue',
    goal: { type: 'perMonth', target: 8 },
  },
  progress: { done: 5, target: 8, left: 3, reached: false },
  streak: null,
  checkedInToday: false,
}

const reading: CategoryOverview = {
  category: { id: 'reading', name: 'Reading', color: 'orange', goal: { type: 'daily' } },
  progress: { done: 0, target: null, left: 0, reached: false },
  streak: 4,
  checkedInToday: false,
}

describe('withCheckIn', () => {
  it('adds today to a monthly goal', () => {
    expect(withCheckIn(office, true)).toEqual({
      ...office,
      checkedInToday: true,
      progress: { done: 6, target: 8, left: 2, reached: false },
    })
  })

  it('reaches the goal on the 8th day', () => {
    const seven = { ...office, progress: { done: 7, target: 8, left: 1, reached: false } }
    expect(withCheckIn(seven, true).progress).toEqual({
      done: 8,
      target: 8,
      left: 0,
      reached: true,
    })
  })

  it('takes today away again on undo', () => {
    expect(withCheckIn(withCheckIn(office, true), false)).toEqual(office)
  })

  it('grows and shrinks a daily streak', () => {
    const done = withCheckIn(reading, true)
    expect(done.streak).toBe(5)
    expect(done.progress).toEqual({ done: 1, target: null, left: 0, reached: true })
    expect(withCheckIn(done, false)).toEqual(reading)
  })

  it('changes nothing when today is already in that state', () => {
    expect(withCheckIn(office, false)).toBe(office)
  })
})
