import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import type { Category } from '@/core/domain/category'
import { parseDay } from '@/core/domain/day'
import MonthGrid from '../MonthGrid.vue'

const category = (id: string, name: string, color: string): Category => ({
  id,
  name,
  color,
  goal: { type: 'daily' },
})
const categories = [
  category('office-days', 'Office days', 'blue'),
  category('workout', 'Workout', 'green'),
  category('reading', 'Reading', 'orange'),
  category('guitar', 'Guitar', 'purple'),
]

function mountGrid() {
  return mount(MonthGrid, {
    props: {
      month: parseDay('2026-10-01'),
      today: parseDay('2026-10-29'),
      done: {
        '2026-10-02': ['office-days'],
        '2026-10-29': ['workout', 'office-days'],
        '2026-10-31': ['office-days', 'workout', 'reading', 'guitar'],
      },
      categories,
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

  it('shows one dot per category in its colour, in list order', () => {
    const dots = dayButton(mountGrid(), '2026-10-29').findAll('.dot')
    // jsdom reports colours as rgb()
    expect(dots.map((d) => d.attributes('style'))).toEqual([
      'background: rgb(47, 111, 219);', // office, blue, first even though saved second
      'background: rgb(46, 133, 64);', // workout, green
    ])
  })

  it('shows three dots and a "+" when there are more', () => {
    const day = dayButton(mountGrid(), '2026-10-31')
    expect(day.findAll('.dot')).toHaveLength(3)
    expect(day.find('.more').exists()).toBe(true)
  })

  it('shows no dots on a day without check-ins', () => {
    expect(dayButton(mountGrid(), '2026-10-03').findAll('.dot')).toHaveLength(0)
  })

  it('names the categories for VoiceOver', () => {
    expect(dayButton(mountGrid(), '2026-10-29').attributes('aria-label')).toBe(
      '2026-10-29, Office days, Workout',
    )
    expect(dayButton(mountGrid(), '2026-10-03').attributes('aria-label')).toBe('2026-10-03')
  })
})
