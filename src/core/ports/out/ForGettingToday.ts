import type { Day } from '../../domain/day'

/** Where "today" comes from, so tests can freeze time. */
export interface ForGettingToday {
  today(): Day
}
