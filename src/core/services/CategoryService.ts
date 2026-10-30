import { createCategory, slugify, type Category } from '../domain/category'
import type { ForManagingCategories, NewCategory } from '../ports/in'
import type { ForStoringCategories, ForStoringEntries } from '../ports/out'

/** The category every new user starts with. */
export const DEFAULT_CATEGORY: Category = {
  id: 'office-days',
  name: 'Office days',
  color: 'blue',
  goal: { type: 'perMonth', target: 8 },
}

const MAX_ID_LENGTH = 40

/** Implements the use cases behind the categories screen in Settings. */
export class CategoryService implements ForManagingCategories {
  constructor(
    private readonly categories: ForStoringCategories,
    private readonly entries: ForStoringEntries,
  ) {}

  async ensureDefaultCategory(): Promise<Category[]> {
    const existing = await this.categories.list()
    if (existing.length > 0) return existing
    await this.categories.save(DEFAULT_CATEGORY)
    return [DEFAULT_CATEGORY]
  }

  listCategories(): Promise<Category[]> {
    return this.categories.list()
  }

  async addCategory(input: NewCategory): Promise<Category> {
    const id = await this.freeIdFor(input.name)
    const category = createCategory({ id, ...input })
    await this.categories.save(category)
    return category
  }

  async editCategory(category: Category): Promise<Category> {
    if (!(await this.categories.get(category.id))) {
      throw new Error(`Unknown category: ${category.id}`)
    }
    const valid = createCategory(category)
    await this.categories.save(valid)
    return valid
  }

  async deleteCategory(categoryId: string): Promise<void> {
    // Entries first: if this fails halfway, the category still exists and can be deleted again.
    await this.entries.removeAllFor(categoryId)
    await this.categories.remove(categoryId)
  }

  /** "Office days" -> "office-days", or "office-days-2", "-3"… when that id is taken. */
  private async freeIdFor(name: string): Promise<string> {
    const base = slugify(name)
    if (!base) throw new Error('Name must contain letters or digits')
    const taken = new Set((await this.categories.list()).map((c) => c.id))
    let id = base
    for (let n = 2; taken.has(id); n++) {
      const suffix = `-${n}`
      id = base.slice(0, MAX_ID_LENGTH - suffix.length) + suffix
    }
    return id
  }
}
