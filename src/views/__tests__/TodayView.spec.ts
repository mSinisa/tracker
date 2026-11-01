import { describe, it, expect } from 'vitest'
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
import TodayView from '../TodayView.vue'

/** Already signed in, so the screen gets its services straight away. */
const signedIn: ForSigningIn = {
  currentUser: () => ({ uid: 'me', name: 'Me' }),
  signIn: async () => ({ uid: 'me', name: 'Me' }),
  signOut: async () => {},
  onChange: (listener: (user: User | null) => void) => {
    listener({ uid: 'me', name: 'Me' })
    return () => {}
  },
}

/** The real services on in-memory adapters, with "today" frozen on 29 October 2026. */
function inMemory(): Services {
  const categories = new InMemoryCategoryStore([DEFAULT_CATEGORY])
  const entries = new InMemoryEntryStore(
    ['2026-10-02', '2026-10-07', '2026-10-13', '2026-10-16', '2026-10-22'].map((d) => ({
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

async function mountToday() {
  const session = createSession(signedIn, inMemory)
  await flushPromises()
  const wrapper = mount(TodayView, {
    global: { plugins: [{ install: (app) => provideSession(app, session) }] },
  })
  await flushPromises()
  return wrapper
}

describe('TodayView', () => {
  it('shows the Office days card with this month’s progress', async () => {
    const wrapper = await mountToday()
    expect(wrapper.text()).toContain('Office days')
    expect(wrapper.text()).toContain('5 of 8')
    expect(wrapper.text()).toContain('3 left this month')
    expect(wrapper.find('.check-in').exists()).toBe(true)
  })

  it('checks in with one tap and shows the confirmation', async () => {
    const wrapper = await mountToday()
    await wrapper.get('.check-in').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Checked in ✓')
    expect(wrapper.text()).toContain('6 of 8')
    expect(wrapper.text()).toContain('2 left this month')
    expect(wrapper.text()).toContain('Saved')
  })

  it('undoes today’s check-in', async () => {
    const wrapper = await mountToday()
    await wrapper.get('.check-in').trigger('click')
    await flushPromises()
    await wrapper.get('.undo').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('5 of 8')
    expect(wrapper.find('.check-in').exists()).toBe(true)
  })
})
