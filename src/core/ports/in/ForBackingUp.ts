import type { Category } from '../../domain/category'
import type { Entry } from '../../domain/entry'

export interface Backup {
  version: 1
  exportedOn: string
  categories: Category[]
  entries: Entry[]
}

export interface ImportResult {
  categories: number
  entries: number
  skipped: number // entries that were invalid or belong to no category
}

/** What the app offers for backups. Called by the Settings screen. */
export interface ForBackingUp {
  exportData(): Promise<Backup>
  /** Merges a backup into the current data, validating everything with the domain rules. */
  importData(data: unknown): Promise<ImportResult>
}
