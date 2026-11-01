import { describe, it, expect } from 'vitest'
import { colourHex, goalText, maxTarget } from '../present'

describe('goalText', () => {
  it('describes each kind of goal', () => {
    expect(goalText({ type: 'perMonth', target: 8 })).toBe('8 per month')
    expect(goalText({ type: 'perWeek', target: 3 })).toBe('3 per week')
    expect(goalText({ type: 'daily' })).toBe('Every day')
  })
})

describe('colourHex', () => {
  it('turns a colour name into its screen colour, with blue as the fallback', () => {
    expect(colourHex('green')).toBe('#2e8540')
    expect(colourHex('unknown')).toBe('#2f6fdb')
  })
})

describe('maxTarget', () => {
  it('matches the domain limits: 31 a month, 7 a week', () => {
    expect(maxTarget('perMonth')).toBe(31)
    expect(maxTarget('perWeek')).toBe(7)
  })
})
