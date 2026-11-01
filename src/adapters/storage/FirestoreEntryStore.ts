import {
  collection,
  deleteDoc,
  doc,
  documentId,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore'
import { parseDay, type Day } from '@/core/domain/day'
import { entryId, type Entry } from '@/core/domain/entry'
import type { ForStoringEntries } from '@/core/ports/out'

/** Turns a stored document back into the core's Entry. Storage-only fields are dropped. */
function toEntry(data: DocumentData): Entry {
  return { categoryId: data.categoryId, date: parseDay(data.date), source: data.source }
}

const byDate = (a: Entry, b: Entry) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)

/**
 * Keeps entries in Firestore under users/{uid}/entries/{categoryId_date}.
 * The document id makes "one entry per category per day" automatic.
 */
export class FirestoreEntryStore implements ForStoringEntries {
  constructor(
    private readonly db: Firestore,
    private readonly uid: string,
  ) {}

  async save(entry: Entry): Promise<void> {
    await setDoc(this.ref(entryId(entry)), {
      categoryId: entry.categoryId,
      date: entry.date,
      source: entry.source,
      checkedInAt: serverTimestamp(), // when it was saved; a storage detail, not part of the domain
    })
  }

  async remove(categoryId: string, date: Day): Promise<void> {
    await deleteDoc(this.ref(entryId({ categoryId, date })))
  }

  async listBetween(categoryId: string, from: Day, to: Day): Promise<Entry[]> {
    // Ids look like "office-days_2026-10-29", so a range on the id selects one category's days.
    // Querying by id needs no extra Firestore index.
    const snapshot = await getDocs(
      query(
        this.collection(),
        where(documentId(), '>=', entryId({ categoryId, date: from })),
        where(documentId(), '<=', entryId({ categoryId, date: to })),
      ),
    )
    return snapshot.docs.map((d) => toEntry(d.data())).sort(byDate)
  }

  async listAll(): Promise<Entry[]> {
    const snapshot = await getDocs(this.collection())
    return snapshot.docs.map((d) => toEntry(d.data())).sort(byDate)
  }

  async removeAllFor(categoryId: string): Promise<void> {
    const snapshot = await getDocs(query(this.collection(), where('categoryId', '==', categoryId)))
    // A batch holds at most 500 writes, so delete in chunks.
    for (let i = 0; i < snapshot.docs.length; i += 500) {
      const batch = writeBatch(this.db)
      snapshot.docs.slice(i, i + 500).forEach((d) => batch.delete(d.ref))
      await batch.commit()
    }
  }

  private collection() {
    return collection(this.db, 'users', this.uid, 'entries')
  }

  private ref(id: string) {
    return doc(this.db, 'users', this.uid, 'entries', id)
  }
}
