import { describe, it, expect } from 'vitest'
import { CategoryService, DEFAULT_CATEGORY } from '../CategoryService'
import { entry, office, reading, setup, workout } from './fixtures'

/** Builds the service on top of fresh in-memory adapters. */
function make(...args: Parameters<typeof setup>) {
  const adapters = setup(...args)
  const service = new CategoryService(adapters.categories, adapters.entries)
  return { ...adapters, service }
}

describe('CategoryService.ensureDefaultCategory', () => {
  it('creates Office days, 8 per month, on first use', async () => {
    const { service, categories } = make([])
    expect(await service.ensureDefaultCategory()).toEqual([DEFAULT_CATEGORY])
    expect(await categories.get('office-days')).toEqual(DEFAULT_CATEGORY)
  })

  it('leaves existing categories alone', async () => {
    const { service, categories } = make([workout])
    expect(await service.ensureDefaultCategory()).toEqual([workout])
    expect(await categories.get('office-days')).toBeNull()
  })
})

describe('CategoryService.addCategory', () => {
  it('makes the id from the name', async () => {
    const { service } = make([])
    const created = await service.addCategory({
      name: 'Lectura nocturna',
      color: 'purple',
      goal: { type: 'daily' },
    })
    expect(created).toEqual({
      id: 'lectura-nocturna',
      name: 'Lectura nocturna',
      color: 'purple',
      goal: { type: 'daily' },
    })
  })

  it('adds -2, -3 when the id is taken', async () => {
    const { service } = make([office])
    const input = {
      name: 'Office days',
      color: 'red',
      goal: { type: 'perMonth', target: 4 },
    } as const
    expect((await service.addCategory(input)).id).toBe('office-days-2')
    expect((await service.addCategory(input)).id).toBe('office-days-3')
  })

  it('keeps a long id within 40 characters when adding a suffix', async () => {
    const name = 'a'.repeat(40)
    const { service } = make([])
    await service.addCategory({ name, color: 'blue', goal: { type: 'daily' } })
    const second = await service.addCategory({ name, color: 'blue', goal: { type: 'daily' } })
    expect(second.id).toBe(`${'a'.repeat(38)}-2`)
  })

  it('refuses a name without letters or digits', async () => {
    const { service } = make([])
    await expect(
      service.addCategory({ name: '!!!', color: 'blue', goal: { type: 'daily' } }),
    ).rejects.toThrow('Name must contain letters or digits')
  })

  it('refuses an invalid goal and saves nothing', async () => {
    const { service, categories } = make([])
    await expect(
      service.addCategory({ name: 'Gym', color: 'green', goal: { type: 'perWeek', target: 9 } }),
    ).rejects.toThrow('Target must be a whole number from 1 to 7')
    expect(await categories.list()).toEqual([])
  })
})

describe('CategoryService.editCategory', () => {
  it('changes name, colour and goal but keeps the id', async () => {
    const { service, categories } = make([office])
    await service.editCategory({
      ...office,
      name: '  Office  ',
      color: 'red',
      goal: { type: 'perMonth', target: 10 },
    })
    expect(await categories.get('office-days')).toEqual({
      id: 'office-days',
      name: 'Office',
      color: 'red',
      goal: { type: 'perMonth', target: 10 },
    })
  })

  it('refuses an unknown category', async () => {
    const { service } = make([])
    await expect(service.editCategory(office)).rejects.toThrow('Unknown category: office-days')
  })

  it('refuses an invalid change and keeps the old version', async () => {
    const { service, categories } = make([office])
    await expect(service.editCategory({ ...office, name: '' })).rejects.toThrow(
      'Name must be 1 to 40 characters',
    )
    expect(await categories.get('office-days')).toEqual(office)
  })
})

describe('CategoryService.deleteCategory', () => {
  it('removes the category and only its entries', async () => {
    const { service, categories, entries } = make(
      [office, workout, reading],
      [
        entry(office.id, '2026-10-02'),
        entry(workout.id, '2026-10-02'),
        entry(office.id, '2026-10-07'),
      ],
    )
    await service.deleteCategory(office.id)
    expect((await categories.list()).map((c) => c.id)).toEqual(['workout', 'reading'])
    expect(await entries.listAll()).toEqual([entry(workout.id, '2026-10-02')])
  })
})

describe('CategoryService.listCategories', () => {
  it('lists every category', async () => {
    const { service } = make([office, workout])
    expect(await service.listCategories()).toEqual([office, workout])
  })
})
