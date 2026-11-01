import type { CategoryOverview } from '@/core/ports/in'

/**
 * The card as it will look once a check-in (or undo) is saved, so the screen can show it
 * straight away instead of waiting for the round trip. If the save fails, the old card is put back.
 */
export function withCheckIn(card: CategoryOverview, checkedIn: boolean): CategoryOverview {
  if (card.checkedInToday === checkedIn) return card
  const step = checkedIn ? 1 : -1
  const done = Math.max(card.progress.done + step, 0)
  const target = card.progress.target
  return {
    ...card,
    checkedInToday: checkedIn,
    progress: {
      done,
      target,
      left: target === null ? 0 : Math.max(target - done, 0),
      reached: target === null ? done > 0 : done >= target,
    },
    streak: card.streak === null ? null : Math.max(card.streak + step, 0),
  }
}
