import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { parseDay } from '@/core/domain/day'
import MonthGrid from '../MonthGrid.vue'

function mountGrid() {
  return mount(MonthGrid, {
    props: {
      month: parseDay('2026-10-01'),
      today: parseDay('2026-10-29'),
      done: { '2026-10-02': ['office-days'], '2026-10-29': ['office-days'] },
    },
  })
}

const dayButton = (wrapper: ReturnType<typeof mountGrid>, date: string) =>
  wrapper.get(`button[aria-label^="${date}"]`)

describe('MonthGrid', () => {
  it('shows a button for every day of the month', () => {
    expect(mountGrid().findAll('button.day')).toHaveLength(31)
  })

  it('fills in the days that were checked in', () => {
    const wrapper = mountGrid()
    expect(dayButton(wrapper, '2026-10-02').classes()).toContain('done')
    expect(dayButton(wrapper, '2026-10-03').classes()).not.toContain('done')
  })

  it('outlines today', () => {
    expect(dayButton(mountGrid(), '2026-10-29').classes()).toContain('today')
  })

  it('lets past days and today be tapped, but not future days', async () => {
    const wrapper = mountGrid()
    await dayButton(wrapper, '2026-10-21').trigger('click')
    expect(wrapper.emitted('select')).toEqual([['2026-10-21']])
    expect(dayButton(wrapper, '2026-10-30').attributes('disabled')).toBeDefined()
  })
})
