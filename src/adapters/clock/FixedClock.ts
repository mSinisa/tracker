import type { Day } from '@/core/domain/day'
import type { ForGettingToday } from '@/core/ports/out'

/** A clock frozen on one day, so tests always see the same "today". */
export class FixedClock implements ForGettingToday {
  constructor(private day: Day) {}

  today(): Day {
    return this.day
  }

  /** Moves time forward or back, e.g. to test what happens after midnight. */
  set(day: Day): void {
    this.day = day
  }
}
