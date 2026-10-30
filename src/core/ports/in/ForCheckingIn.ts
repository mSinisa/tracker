import type { Entry } from '../../domain/entry'

/** What the app offers for checking in. Called by the Today and Calendar screens. */
export interface ForCheckingIn {
  /** Saves today for a category. Checking in twice on the same day keeps one entry. */
  checkInToday(categoryId: string): Promise<Entry>
  /** Removes today's check-in for a category, if there is one. */
  undoCheckIn(categoryId: string): Promise<void>
  /** Adds or removes a past day. Returns true if the day is now checked in. */
  toggleDay(categoryId: string, date: string): Promise<boolean>
}
