import { describe, it, expect } from 'vitest'
import { createCategory, slugify, type Category } from '../category'

const office: Category = {
  id: 'office-days',
  name: 'Office days',
  color: 'blue',
  goal: { type: 'perMonth', target: 8 },
}

describe('createCategory', () => {
  it('accepts a valid category and trims the name', () => {
    expect(createCategory({ ...office, name: '  Office days  ' }).name).toBe('Office days')
  })
  it('rejects an empty name', () => {
    expect(() => createCategory({ ...office, name: '   ' })).toThrow()
  })
  it('rejects a bad id', () => {
    expect(() => createCategory({ ...office, id: 'Office Days!' })).toThrow()
  })
  it('rejects a monthly target of 0 or above 31', () => {
    expect(() => createCategory({ ...office, goal: { type: 'perMonth', target: 0 } })).toThrow()
    expect(() => createCategory({ ...office, goal: { type: 'perMonth', target: 32 } })).toThrow()
  })
  it('rejects a weekly target above 7', () => {
    expect(() => createCategory({ ...office, goal: { type: 'perWeek', target: 8 } })).toThrow()
  })
  it('accepts a daily goal without a target', () => {
    expect(createCategory({ ...office, goal: { type: 'daily' } }).goal.type).toBe('daily')
  })
})

describe('slugify', () => {
  it('turns a name into an id', () => {
    expect(slugify('Office days')).toBe('office-days')
    expect(slugify('Lectura nocturna!')).toBe('lectura-nocturna')
  })
})
