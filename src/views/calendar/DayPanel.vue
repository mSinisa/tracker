<script setup lang="ts">
import type { Category } from '@/core/domain/category'
import type { Day } from '@/core/domain/day'

defineProps<{
  day: Day
  label: string // "Wed 21 October"
  categories: Category[]
  doneIds: string[] // categories already checked in that day
  busy: boolean
}>()
const emit = defineEmits<{ toggle: [categoryId: string]; close: [] }>()
</script>

<template>
  <div class="backdrop" @click.self="emit('close')">
    <section class="panel" role="dialog" aria-modal="true" :aria-label="label">
      <h2>{{ label }}</h2>
      <ul>
        <li v-for="category in categories" :key="category.id">
          <span>
            {{ category.name }}
            <span v-if="doneIds.includes(category.id)" class="done">✓</span>
          </span>
          <button
            type="button"
            :class="doneIds.includes(category.id) ? 'remove' : 'add'"
            :disabled="busy"
            @click="emit('toggle', category.id)"
          >
            {{ doneIds.includes(category.id) ? 'Remove' : 'Add' }}
          </button>
        </li>
      </ul>
      <button type="button" class="close" @click="emit('close')">Close</button>
    </section>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
}

.panel {
  width: 100%;
  max-width: 480px;
  padding: 1.25rem 1rem calc(1.25rem + env(safe-area-inset-bottom));
  border-radius: 16px 16px 0 0;
  background: var(--color-background);
}

h2 {
  margin-bottom: 0.75rem;
  font-size: 1.1rem;
  font-weight: 600;
  text-align: center;
}

ul {
  padding: 0;
  list-style: none;
}

li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--color-border);
}

.done {
  color: #2e8540;
}

li button {
  min-width: 96px;
  min-height: 40px;
  border-radius: 20px;
  font-size: 0.95rem;
  cursor: pointer;
}

.add {
  border: 2px solid #2f6fdb;
  background: #e7f0fd;
  color: #1b3f80;
}

.remove {
  border: 1px solid var(--color-border-hover);
  background: none;
  color: var(--color-text);
}

.close {
  width: 100%;
  min-height: 44px;
  margin-top: 1rem;
  border: none;
  background: none;
  color: #2f6fdb;
  font-size: 1rem;
  cursor: pointer;
}

button:disabled {
  opacity: 0.5;
}
</style>
