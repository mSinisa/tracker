import type { Category } from '../domain/category'

/** What the core needs from wherever categories are kept. */
export interface CategoryStore {
  list(): Promise<Category[]>
  get(id: string): Promise<Category | null>
  save(category: Category): Promise<void> // create or update
  remove(id: string): Promise<void>
}
