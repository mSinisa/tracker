import type { CategoryOverview } from '@/core/ports/in'

/** The words on one Today card, worked out from the overview. Pure, so it is easy to test. */
export interface CardText {
  big: string // "5 of 8", or "12" for a streak
  under: string // "this month", "this week", "day streak"
  status: string // "3 left this month", "Goal reached…", …
}

export function describeCard({
  category,
  progress,
  streak,
  checkedInToday,
}: CategoryOverview): CardText {
  if (category.goal.type === 'daily') {
    const days = streak ?? 0
    return {
      big: String(days),
      under: 'day streak',
      status: checkedInToday
        ? 'Done today'
        : days > 0
          ? 'Check in today to keep your streak'
          : 'Not done today',
    }
  }

  const period = category.goal.type === 'perMonth' ? 'this month' : 'this week'
  const target = progress.target ?? 0
  const over = progress.done - target
  let status: string
  if (over > 0) status = `Goal reached, ${over} more than needed ${period}`
  else if (progress.reached) status = `Goal reached ${period}, you can stop here`
  else status = `${progress.left} left ${period}`

  return { big: `${progress.done} of ${target}`, under: period, status }
}

/** "Sun 1 November", in the phone's own time zone. */
export function formatToday(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  }).format(date)
}
