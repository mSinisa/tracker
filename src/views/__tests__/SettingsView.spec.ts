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
import SettingsView from '../SettingsView.vue'

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
  const entries = new InMemoryEntryStore()
  const clock = new FixedClock(parseDay('2026-10-29'))
  return {
    checkIn: new CheckInService(categories, entries, clock),
    progress: new ProgressService(categories, entries, clock),
    categories: new CategoryService(categories, entries),
    backup: new BackupService(categories, entries, clock),
  }
}

async function mountSettings() {
  const session = createSession(signedIn, inMemory)
  await flushPromises()
  const wrapper = mount(SettingsView, {
    global: { plugins: [{ install: (app) => provideSession(app, session) }] },
  })
  await flushPromises()
  return wrapper
}

describe('SettingsView', () => {
  it('lists the categories with their goals', async () => {
    const wrapper = await mountSettings()
    expect(wrapper.get('.row').text()).toContain('Office days')
    expect(wrapper.get('.row').text()).toContain('8 per month')
  })

  it('changes a goal from 8 to 10 per month', async () => {
    const wrapper = await mountSettings()
    await wrapper.get('.row').trigger('click')
    await wrapper.get('[aria-label="More"]').trigger('click')
    await wrapper.get('[aria-label="More"]').trigger('click')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(wrapper.get('.row').text()).toContain('10 per month')
    expect(wrapper.text()).toContain('Saved')
  })

  it('switches to a weekly goal and renames the category', async () => {
    const wrapper = await mountSettings()
    await wrapper.get('.row').trigger('click')
    await wrapper.get('input').setValue('Office')
    const perWeek = wrapper.findAll('.segment').find((b) => b.text() === 'Per week')!
    await perWeek.trigger('click')
    // 8 is more than a week allows, so the target drops to 7
    expect(wrapper.get('output').text()).toBe('7')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('.row').text()).toContain('Office')
    expect(wrapper.get('.row').text()).toContain('7 per week')
  })

  it('shows the problem and keeps the form open when the name is empty', async () => {
    const wrapper = await mountSettings()
    await wrapper.get('.row').trigger('click')
    await wrapper.get('input').setValue('   ')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toBe('Name must be 1 to 40 characters')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
  })

  it('cancels without changing anything', async () => {
    const wrapper = await mountSettings()
    await wrapper.get('.row').trigger('click')
    await wrapper.get('[aria-label="More"]').trigger('click')
    await wrapper.get('.cancel').trigger('click')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(wrapper.get('.row').text()).toContain('8 per month')
  })

  describe('adding a category', () => {
    const rows = (w: Awaited<ReturnType<typeof mountSettings>>) =>
      w.findAll('.row:not(.add)').map((r) => r.text())
    const chip = (w: Awaited<ReturnType<typeof mountSettings>>, label: string) =>
      w.findAll('.chip').find((c) => c.text().startsWith(label))!

    it('shows an Add category row below the categories', async () => {
      const wrapper = await mountSettings()
      const items = wrapper.findAll('li')
      expect(items[items.length - 1]!.text()).toContain('Add category')
    })

    it('adds Workout, 3 per week, from the quick pick', async () => {
      const wrapper = await mountSettings()
      await wrapper.get('.row.add').trigger('click')
      await chip(wrapper, 'Workout').trigger('click')
      expect(chip(wrapper, 'Workout').attributes('aria-checked')).toBe('true')
      await wrapper.get('form').trigger('submit')
      await flushPromises()
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
      expect(rows(wrapper)).toHaveLength(2)
      expect(rows(wrapper)[1]).toContain('Workout')
      expect(rows(wrapper)[1]).toContain('3 per week')
    })

    it('adds Reading, every day, from the quick pick', async () => {
      const wrapper = await mountSettings()
      await wrapper.get('.row.add').trigger('click')
      await chip(wrapper, 'Reading').trigger('click')
      await wrapper.get('form').trigger('submit')
      await flushPromises()
      expect(rows(wrapper)[1]).toContain('Reading')
      expect(rows(wrapper)[1]).toContain('Every day')
    })

    it('adds a custom category with its own name and goal', async () => {
      const wrapper = await mountSettings()
      await wrapper.get('.row.add').trigger('click')
      await wrapper.get('input').setValue('Guitar')
      await wrapper.get('[aria-label="Fewer"]').trigger('click') // 3 → 2 per week
      await wrapper.get('form').trigger('submit')
      await flushPromises()
      expect(rows(wrapper)[1]).toContain('Guitar')
      expect(rows(wrapper)[1]).toContain('2 per week')
    })

    it('Custom clears a quick pick again', async () => {
      const wrapper = await mountSettings()
      await wrapper.get('.row.add').trigger('click')
      await chip(wrapper, 'Workout').trigger('click')
      await chip(wrapper, 'Custom').trigger('click')
      expect((wrapper.get('input').element as HTMLInputElement).value).toBe('')
    })

    it('keeps the form open when the name is empty', async () => {
      const wrapper = await mountSettings()
      await wrapper.get('.row.add').trigger('click')
      await wrapper.get('form').trigger('submit')
      await flushPromises()
      expect(wrapper.get('[role="alert"]').text()).toBe('Name must contain letters or digits')
      expect(rows(wrapper)).toHaveLength(1)
    })

    it('can add the same name twice', async () => {
      const wrapper = await mountSettings()
      for (let i = 0; i < 2; i++) {
        await wrapper.get('.row.add').trigger('click')
        await chip(wrapper, 'Workout').trigger('click')
        await wrapper.get('form').trigger('submit')
        await flushPromises()
      }
      expect(rows(wrapper)).toHaveLength(3)
    })
  })
})
