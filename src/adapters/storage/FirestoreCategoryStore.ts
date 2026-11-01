import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore'
import type { Category } from '@/core/domain/category'
import type { ForStoringCategories } from '@/core/ports/out'

/** Turns a stored document back into the core's Category. Storage-only fields are dropped. */
function toCategory(id: string, data: DocumentData): Category {
  return { id, name: data.name, color: data.color, goal: data.goal }
}

/** Keeps categories in Firestore under users/{uid}/categories/{categoryId}. */
export class FirestoreCategoryStore implements ForStoringCategories {
  constructor(
    private readonly db: Firestore,
    private readonly uid: string,
  ) {}

  async list(): Promise<Category[]> {
    const snapshot = await getDocs(this.collection())
    return snapshot.docs.map((d) => toCategory(d.id, d.data()))
  }

  async get(id: string): Promise<Category | null> {
    const snapshot = await getDoc(this.ref(id))
    return snapshot.exists() ? toCategory(snapshot.id, snapshot.data()) : null
  }

  async save(category: Category): Promise<void> {
    // createdAt is a storage detail the core doesn't know about: keep it on edits, set it on create.
    const existing = await getDoc(this.ref(category.id))
    await setDoc(this.ref(category.id), {
      name: category.name,
      color: category.color,
      goal: category.goal,
      createdAt: existing.exists() ? existing.data().createdAt : serverTimestamp(),
    })
  }

  async remove(id: string): Promise<void> {
    await deleteDoc(this.ref(id))
  }

  private collection() {
    return collection(this.db, 'users', this.uid, 'categories')
  }

  private ref(id: string) {
    return doc(this.db, 'users', this.uid, 'categories', id)
  }
}
