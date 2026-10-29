import type { Goal } from './goal'

export interface Category {
  id: string
  name: string
  color: string
  goal: Goal
}

const ID_PATTERN = /^[a-z0-9-]{1,40}$/

export function createCategory(input: Category): Category {
  const name = input.name.trim()
  if (!ID_PATTERN.test(input.id)) throw new Error(`Invalid category id: ${input.id}`)
  if (name.length < 1 || name.length > 40) throw new Error('Name must be 1 to 40 characters')
  if (input.color.length > 20) throw new Error('Colour is too long')
  if (input.goal.type !== 'daily') {
    const max = input.goal.type === 'perWeek' ? 7 : 31
    const t = input.goal.target
    if (!Number.isInteger(t) || t < 1 || t > max) {
      throw new Error(`Target must be a whole number from 1 to ${max}`)
    }
  }
  return { ...input, name }
}

/** Turns "Office days" into "office-days" for use as the id. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}
