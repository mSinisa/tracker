import { describe, it, expect } from 'vitest'
import { parseDay } from '@/core/domain/day'
import { ProgressService } from '../ProgressService'
import { entry, office, reading, setup, workout } from './fixtures'

/** Builds the service on top of fresh in-memory adapters ("today" is Thursday 29 October 2026). */
function make(...args: Parameters<typeof setup>) {
  const adapters = setup(...args)
  const service = new ProgressService(adapters.categories, adapters.entries, adapters.clock)
  return { ...adapters, service }
}

const days = (categoryId: string, ...dates: string[]) => dates.map((d) => entry(categoryId, d))

describe('ProgressService.getTodayOverview', () => {
  it('returns one card per category', async () => {
    const { service } = make([office, workout, reading])
    const cards = await service.getTodayOverview()
    expect(cards.map((c) => c.category.id)).toEqual(['office-days', 'workout', 'reading'])
  })

  it('counts a monthly goal from the 1st and ignores last month', async () => {
    const { service } = make(
      [office],
      days(office.id, '2026-09-30', '2026-10-02', '2026-10-07', '2026-10-29'),
    )
    const [card] = await service.getTodayOverview()
    expect(card?.progress).toEqual({ done: 3, target: 8, left: 5, reached: false })
    expect(card?.checkedInToday).toBe(true)
    expect(card?.streak).toBeNull()
  })

  it('marks a monthly goal as reached', async () => {
    const { service } = make(
      [office],
      days(
        office.id,
        '2026-10-01',
        '2026-10-02',
        '2026-10-05',
        '2026-10-06',
        '2026-10-07',
        '2026-10-08',
        '2026-10-09',
        '2026-10-12',
      ),
    )
    const [card] = await service.getTodayOverview()
    expect(card?.progress).toMatchObject({ done: 8, left: 0, reached: true })
  })

  it('counts a weekly goal from Monday', async () => {
    const { service } = make([workout], days(workout.id, '2026-10-25', '2026-10-26', '2026-10-28'))
    const [card] = await service.getTodayOverview()
    expect(card?.progress).toEqual({ done: 2, target: 3, left: 1, reached: false })
    expect(card?.checkedInToday).toBe(false)
  })

  it('shows a streak for a daily goal, kept while today is still open', async () => {
    const { service } = make([reading], days(reading.id, '2026-10-25', '2026-10-27', '2026-10-28'))
    const [card] = await service.getTodayOverview()
    expect(card?.streak).toBe(2)
    expect(card?.progress).toEqual({ done: 0, target: null, left: 0, reached: false })
  })

  it('follows the clock to a new day', async () => {
    const { service, clock } = make([office], days(office.id, '2026-10-29'))
    clock.set(parseDay('2026-11-01'))
    const [card] = await service.getTodayOverview()
    expect(card?.progress.done).toBe(0)
    expect(card?.checkedInToday).toBe(false)
  })

  it('returns no cards when there are no categories', async () => {
    const { service } = make([])
    expect(await service.getTodayOverview()).toEqual([])
  })
})

describe('ProgressService.getMonth', () => {
  it('lists the categories checked in on each day of the month', async () => {
    const { service } = make(
      [office, workout],
      [
        entry(office.id, '2026-10-02'),
        entry(workout.id, '2026-10-02'),
        entry(workout.id, '2026-10-31'),
        entry(office.id, '2026-09-30'),
        entry(office.id, '2026-11-01'),
      ],
    )
    const view = await service.getMonth(parseDay('2026-10-15'))
    expect(view).toEqual({
      month: '2026-10-01',
      days: { '2026-10-02': ['office-days', 'workout'], '2026-10-31': ['workout'] },
    })
  })

  it('includes the 29th of February in a leap year', async () => {
    const { service } = make([office], days(office.id, '2028-02-29', '2028-03-01'))
    const view = await service.getMonth(parseDay('2028-02-10'))
    expect(Object.keys(view.days)).toEqual(['2028-02-29'])
  })

  it('returns an empty month when nothing was done', async () => {
    const { service } = make()
    expect(await service.getMonth(parseDay('2026-10-29'))).toEqual({
      month: '2026-10-01',
      days: {},
    })
  })
})
