import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { FixedClock } from '@/adapters/clock/FixedClock'
import { InMemoryCategoryStore } from '@/adapters/storage/InMemoryCategoryStore'
import { InMemoryEntryStore } from '@/adapters/storage/InMemoryEntryStore'
import type { Services } from '@/compositionRoot'
import { parseDay } from '@/core/domain/day'
import type { ForSigningIn, User } from '@/core/ports/out'
import { BackupService } from '@/core/services/BackupService'
import { CategoryService, DEFAULT_CATEGORY } from '@/core/services/CategoryService'
import { CheckInService } from '@/core/services/CheckInService'
import { ProgressService } from '@/core/services/ProgressService'
import { createSession, provideSession } from '@/session'
import CalendarView from '../CalendarView.vue'

const signedIn: ForSigningIn = {
  currentUser: () => ({ uid: 'me', name: 'Me' }),
  signIn: async () => ({ uid: 'me', name: 'Me' }),
  signOut: async () => {},
  onChange: (listener: (user: User | null) => void) => {
    listener({ uid: 'me', name: 'Me' })
    return () => {}
  },
}

function inMemory(): Services {
  const categories = new InMemoryCategoryStore([DEFAULT_CATEGORY])
  const entries = new InMemoryEntryStore(
    ['2026-09-30', '2026-10-02', '2026-10-07', '2026-10-29'].map((d) => ({
      categoryId: 'office-days',
      date: parseDay(d),
      source: 'button' as const,
    })),
  )
  const clock = new FixedClock(parseDay('2026-10-29'))
  return {
    checkIn: new CheckInService(categories, entries, clock),
    progress: new ProgressService(categories, entries, clock),
    categories: new CategoryService(categories, entries),
    backup: new BackupService(categories, entries, clock),
  }
}

async function mountCalendar() {
  const session = createSession(signedIn, inMemory)
  await flushPromises()
  const wrapper = mount(CalendarView, {
    global: { plugins: [{ install: (app) => provideSession(app, session) }] },
  })
  await flushPromises()
  return wrapper
}

const day = (wrapper: Awaited<ReturnType<typeof mountCalendar>>, date: string) =>
  wrapper.get(`button[aria-label^="${date}"]`)

describe('CalendarView', () => {
  // The screen takes "today" from the device clock; freeze it on Thursday 29 October 2026.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 29, 10, 0))
  })
  afterEach(() => vi.useRealTimers())

  it('shows this month with its check-ins and the monthly count', async () => {
    const wrapper = await mountCalendar()
    expect(wrapper.get('h1').text()).toBe('October 2026')
    expect(wrapper.text()).toContain('3 of 8 Office days')
    expect(day(wrapper, '2026-10-02').classes()).toContain('done')
    expect(day(wrapper, '2026-10-03').classes()).not.toContain('done')
    expect(day(wrapper, '2026-10-29').classes()).toContain('today')
  })

  it('goes back a month, and forward again', async () => {
    const wrapper = await mountCalendar()
    await wrapper.get('[aria-label="Previous month"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe('September 2026')
    expect(wrapper.text()).toContain('1 of 8 Office days')
    expect(day(wrapper, '2026-09-30').classes()).toContain('done')

    await wrapper.get('[aria-label="Next month"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe('October 2026')
  })

  it('does not go past the current month', async () => {
    const wrapper = await mountCalendar()
    expect(wrapper.get('[aria-label="Next month"]').attributes('disabled')).toBeDefined()
  })

  it('adds a past day from its panel', async () => {
    const wrapper = await mountCalendar()
    await day(wrapper, '2026-10-21').trigger('click')
    expect(wrapper.get('[role="dialog"]').text()).toContain('Wed 21 October')
    await wrapper.get('[role="dialog"] .add').trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(day(wrapper, '2026-10-21').classes()).toContain('done')
    expect(wrapper.text()).toContain('4 of 8 Office days')
    expect(wrapper.text()).toContain('Saved')
  })

  it('removes a day that was checked in', async () => {
    const wrapper = await mountCalendar()
    await day(wrapper, '2026-10-02').trigger('click')
    expect(wrapper.get('[role="dialog"]').text()).toContain('Office days ✓')
    await wrapper.get('[role="dialog"] .remove').trigger('click')
    await flushPromises()
    expect(day(wrapper, '2026-10-02').classes()).not.toContain('done')
    expect(wrapper.text()).toContain('2 of 8 Office days')
  })

  it('closes the panel without changing anything', async () => {
    const wrapper = await mountCalendar()
    await day(wrapper, '2026-10-21').trigger('click')
    await wrapper.get('.close').trigger('click')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(day(wrapper, '2026-10-21').classes()).not.toContain('done')
  })

  describe('a week that starts in the previous month', () => {
    // Sunday 1 November: the week began on Monday 26 October.
    beforeEach(() => vi.setSystemTime(new Date(2026, 10, 1, 21, 0)))

    function withWorkout(): Services {
      const workout = {
        id: 'workout',
        name: 'Workout',
        color: 'green',
        goal: { type: 'perWeek' as const, target: 3 },
      }
      const categories = new InMemoryCategoryStore([DEFAULT_CATEGORY, workout])
      const entries = new InMemoryEntryStore([
        { categoryId: 'workout', date: parseDay('2026-10-31'), source: 'calendar' },
      ])
      const clock = new FixedClock(parseDay('2026-11-01'))
      return {
        checkIn: new CheckInService(categories, entries, clock),
        progress: new ProgressService(categories, entries, clock),
        categories: new CategoryService(categories, entries),
        backup: new BackupService(categories, entries, clock),
      }
    }

    async function mountNovember() {
      const session = createSession(signedIn, withWorkout)
      await flushPromises()
      const wrapper = mount(CalendarView, {
        global: { plugins: [{ install: (app) => provideSession(app, session) }] },
      })
      await flushPromises()
      return wrapper
    }

    it('counts Saturday 31 October in this week', async () => {
      const wrapper = await mountNovember()
      expect(wrapper.get('h1').text()).toBe('November 2026')
      expect(wrapper.text()).toContain('1 of 3 this week Workout')
    })

    it('updates this week after checking in today from the calendar', async () => {
      const wrapper = await mountNovember()
      await day(wrapper, '2026-11-01').trigger('click')
      const row = wrapper.findAll('[role="dialog"] li').find((li) => li.text().includes('Workout'))!
      await row.get('.add').trigger('click')
      await flushPromises()
      expect(wrapper.text()).toContain('2 of 3 this week Workout')
    })

    it('shows a plain day count for a past month', async () => {
      const wrapper = await mountNovember()
      await wrapper.get('[aria-label="Previous month"]').trigger('click')
      await flushPromises()
      expect(wrapper.text()).toContain('1 day Workout')
      expect(wrapper.text()).not.toContain('this week')
    })
  })
})
