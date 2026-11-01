import type { Category } from '../../domain/category'
import type { Goal } from '../../domain/goal'

export interface NewCategory {
  name: string
  color: string
  goal: Goal
}

/** What the app offers for managing categories. Called by the Settings screen. */
export interface ForManagingCategories {
  listCategories(): Promise<Category[]>
  addCategory(input: NewCategory): Promise<Category>
  /** Renames, recolours or changes the goal. The id never changes, so entries stay linked. */
  editCategory(category: Category): Promise<Category>
  /** Deletes a category together with all its entries. */
  deleteCategory(categoryId: string): Promise<void>
}
