import { GoogleAuth } from '@/adapters/auth/GoogleAuth'
import { SystemClock } from '@/adapters/clock/SystemClock'
import { firestore } from '@/adapters/firebase/firestore'
import { FirestoreCategoryStore } from '@/adapters/storage/FirestoreCategoryStore'
import { FirestoreEntryStore } from '@/adapters/storage/FirestoreEntryStore'
import { BackupService } from '@/core/services/BackupService'
import { CategoryService } from '@/core/services/CategoryService'
import { CheckInService } from '@/core/services/CheckInService'
import { ProgressService } from '@/core/services/ProgressService'
import type {
  ForBackingUp,
  ForCheckingIn,
  ForManagingCategories,
  ForSeeingProgress,
} from '@/core/ports/in'
import type { ForSigningIn } from '@/core/ports/out'

/**
 * The composition root: the only file that knows both the adapters and the services.
 * Everything else depends on ports only.
 */

/** What the screens get: the driving ports, never the classes behind them. */
export interface Services {
  checkIn: ForCheckingIn
  progress: ForSeeingProgress
  categories: ForManagingCategories
  backup: ForBackingUp
}

export function createAuth(): ForSigningIn {
  return new GoogleAuth()
}

/** Builds the real adapters for one signed-in user, and the services on top of them. */
export function createServices(uid: string): Services {
  const categories = new FirestoreCategoryStore(firestore, uid)
  const entries = new FirestoreEntryStore(firestore, uid)
  const clock = new SystemClock()
  return {
    checkIn: new CheckInService(categories, entries, clock),
    progress: new ProgressService(categories, entries, clock),
    categories: new CategoryService(categories, entries),
    backup: new BackupService(categories, entries, clock),
  }
}
