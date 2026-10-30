import { dayOf, type Day } from '@/core/domain/day'
import type { ForGettingToday } from '@/core/ports/out'

/** Today according to the phone's own clock and time zone. */
export class SystemClock implements ForGettingToday {
  today(): Day {
    return dayOf(new Date())
  }
}
