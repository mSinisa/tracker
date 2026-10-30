import type { Category } from '@/core/domain/category'
import type { ForStoringCategories } from '@/core/ports/out'

/** Keeps categories in memory. Used by tests, and handy while building screens. */
export class InMemoryCategoryStore implements ForStoringCategories {
  private readonly items = new Map<string, Category>()

  constructor(initial: Category[] = []) {
    initial.forEach((c) => this.items.set(c.id, structuredClone(c)))
  }

  async list(): Promise<Category[]> {
    return [...this.items.values()].map((c) => structuredClone(c))
  }

  async get(id: string): Promise<Category | null> {
    const found = this.items.get(id)
    return found ? structuredClone(found) : null
  }

  async save(category: Category): Promise<void> {
    this.items.set(category.id, structuredClone(category))
  }

  async remove(id: string): Promise<void> {
    this.items.delete(id)
  }
}
