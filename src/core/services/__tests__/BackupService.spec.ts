import { describe, it, expect } from 'vitest'
import { BackupService } from '../BackupService'
import { entry, office, setup, workout } from './fixtures'

/** Builds the service on top of fresh in-memory adapters ("today" is Thursday 29 October 2026). */
function make(...args: Parameters<typeof setup>) {
  const adapters = setup(...args)
  const service = new BackupService(adapters.categories, adapters.entries, adapters.clock)
  return { ...adapters, service }
}

describe('BackupService.exportData', () => {
  it('exports every category and entry with the date', async () => {
    const { service } = make(
      [office, workout],
      [entry(office.id, '2026-10-02'), entry(workout.id, '2026-10-05')],
    )
    expect(await service.exportData()).toEqual({
      version: 1,
      exportedOn: '2026-10-29',
      categories: [office, workout],
      entries: [entry(office.id, '2026-10-02'), entry(workout.id, '2026-10-05')],
    })
  })
})

describe('BackupService.importData', () => {
  it('restores everything from an export, through JSON', async () => {
    const source = make(
      [office, workout],
      [entry(office.id, '2026-10-02'), entry(workout.id, '2026-10-05')],
    )
    const file = JSON.parse(JSON.stringify(await source.service.exportData()))

    const target = make([])
    expect(await target.service.importData(file)).toEqual({ categories: 2, entries: 2, skipped: 0 })
    expect(await target.categories.list()).toEqual(await source.categories.list())
    expect(await target.entries.listAll()).toEqual(await source.entries.listAll())
  })

  it('merges with existing data without duplicating days', async () => {
    const { service, entries } = make([office], [entry(office.id, '2026-10-02')])
    await service.importData({
      version: 1,
      exportedOn: '2026-10-29',
      categories: [office],
      entries: [entry(office.id, '2026-10-02'), entry(office.id, '2026-10-07')],
    })
    expect((await entries.listAll()).map((e) => e.date)).toEqual(['2026-10-02', '2026-10-07'])
  })

  it('skips invalid entries and imports the rest', async () => {
    const { service, entries } = make([office])
    const result = await service.importData({
      version: 1,
      exportedOn: '2026-10-29',
      categories: [],
      entries: [
        entry(office.id, '2026-10-02'),
        { categoryId: 'unknown', date: '2026-10-02', source: 'button' },
        { categoryId: office.id, date: '2026-13-01', source: 'button' },
        { categoryId: office.id, date: '2026-12-01', source: 'button' },
        { categoryId: office.id, date: '2026-10-03', source: 'hacked' },
      ],
    })
    expect(result).toEqual({ categories: 0, entries: 1, skipped: 4 })
    expect(await entries.listAll()).toEqual([entry(office.id, '2026-10-02')])
  })

  it('refuses the whole file when a category is invalid', async () => {
    const { service, categories } = make([])
    await expect(
      service.importData({
        version: 1,
        exportedOn: '2026-10-29',
        categories: [office, { ...workout, goal: { type: 'perWeek', target: 0 } }],
        entries: [],
      }),
    ).rejects.toThrow('Target must be a whole number from 1 to 7')
    expect(await categories.list()).toEqual([])
  })

  it('refuses something that is not a backup', async () => {
    const { service } = make()
    const message = 'This is not a Tracker backup file'
    await expect(service.importData(null)).rejects.toThrow(message)
    await expect(service.importData({ hello: 'world' })).rejects.toThrow(message)
    await expect(service.importData({ version: 2, categories: [], entries: [] })).rejects.toThrow(
      message,
    )
  })
})
