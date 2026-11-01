import type { Goal } from '@/core/domain/goal'

/** The colours a category can have. The name is stored; the hex is only for the screen. */
export const COLOURS = [
  { name: 'blue', label: 'Blue', hex: '#2f6fdb' },
  { name: 'green', label: 'Green', hex: '#2e8540' },
  { name: 'orange', label: 'Orange', hex: '#e07b00' },
  { name: 'purple', label: 'Purple', hex: '#7b4fd6' },
  { name: 'red', label: 'Red', hex: '#d0393e' },
  { name: 'teal', label: 'Teal', hex: '#12867f' },
] as const

/** The screen colour for a stored colour name. Unknown names fall back to blue. */
export function colourHex(name: string): string {
  return COLOURS.find((c) => c.name === name)?.hex ?? COLOURS[0].hex
}

/** "8 per month", "3 per week" or "Every day". */
export function goalText(goal: Goal): string {
  switch (goal.type) {
    case 'perMonth':
      return `${goal.target} per month`
    case 'perWeek':
      return `${goal.target} per week`
    case 'daily':
      return 'Every day'
  }
}

/** The highest target a goal type allows, matching the domain rules. */
export function maxTarget(type: 'perMonth' | 'perWeek'): number {
  return type === 'perWeek' ? 7 : 31
}
