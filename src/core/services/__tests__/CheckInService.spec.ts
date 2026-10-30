import { describe, it, expect } from 'vitest'
import { parseDay } from '@/core/domain/day'
import { CheckInService } from '../CheckInService'
import { entry, office, setup } from './fixtures'

/** Builds the service on top of fresh in-memory adapters, and returns both. */
function make(...args: Parameters<typeof setup>) {
  const adapters = setup(...args)
  const service = new CheckInService(adapters.categories, adapters.entries, adapters.clock)
  return { ...adapters, service }
}

describe('CheckInService.checkInToday', () => {
  it('saves today with source button', async () => {
    const { service, entries } = make()
    await service.checkInToday(office.id)
    expect(await entries.listAll()).toEqual([entry(office.id, '2026-10-29')])
  })

  it('keeps one entry when checking in twice on the same day', async () => {
    const { service, entries } = make()
    await service.checkInToday(office.id)
    await service.checkInToday(office.id)
    expect(await entries.listAll()).toHaveLength(1)
  })

  it('saves a new entry after midnight', async () => {
    const { service, entries, clock } = make()
    await service.checkInToday(office.id)
    clock.set(parseDay('2026-10-30'))
    await service.checkInToday(office.id)
    expect((await entries.listAll()).map((e) => e.date)).toEqual(['2026-10-29', '2026-10-30'])
  })

  it('refuses an unknown category', async () => {
    const { service } = make()
    await expect(service.checkInToday('nope')).rejects.toThrow('Unknown category: nope')
  })
})

describe('CheckInService.undoCheckIn', () => {
  it('removes today and keeps earlier days', async () => {
    const { service, entries } = make([office], [entry(office.id, '2026-10-28')])
    await service.checkInToday(office.id)
    await service.undoCheckIn(office.id)
    expect((await entries.listAll()).map((e) => e.date)).toEqual(['2026-10-28'])
  })

  it('does nothing when today was not checked in', async () => {
    const { service, entries } = make()
    await service.undoCheckIn(office.id)
    expect(await entries.listAll()).toEqual([])
  })
})

describe('CheckInService.toggleDay', () => {
  it('adds a past day with source calendar, then removes it', async () => {
    const { service, entries } = make()
    expect(await service.toggleDay(office.id, '2026-10-21')).toBe(true)
    expect(await entries.listAll()).toEqual([
      { categoryId: office.id, date: '2026-10-21', source: 'calendar' },
    ])
    expect(await service.toggleDay(office.id, '2026-10-21')).toBe(false)
    expect(await entries.listAll()).toEqual([])
  })

  it('refuses future days', async () => {
    const { service } = make()
    await expect(service.toggleDay(office.id, '2026-10-30')).rejects.toThrow(
      'Future days cannot be checked in',
    )
  })

  it('refuses invalid dates', async () => {
    const { service } = make()
    await expect(service.toggleDay(office.id, '2026-02-30')).rejects.toThrow(
      'Invalid day: 2026-02-30',
    )
  })

  it('refuses an unknown category', async () => {
    const { service } = make()
    await expect(service.toggleDay('nope', '2026-10-21')).rejects.toThrow('Unknown category: nope')
  })
})
