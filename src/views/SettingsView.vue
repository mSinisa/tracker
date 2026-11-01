<script setup lang="ts">
import { onMounted, ref, shallowRef } from 'vue'
import type { Category } from '@/core/domain/category'
import type { NewCategory } from '@/core/ports/in'
import BottomSheet from '@/components/BottomSheet.vue'
import { useSession } from '@/session'
import CategoryForm from './settings/CategoryForm.vue'
import { colourHex, goalText } from './settings/present'

const { services, user, signOut } = useSession()

const categories = shallowRef<Category[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const editing = ref<Category | null>(null) // the category whose form is open
const adding = ref(false) // the "new category" form is open
const saving = ref(false)
const formError = ref<string | null>(null)
const saved = ref(false)

async function load() {
  if (!services.value) return
  try {
    categories.value = await services.value.categories.listCategories()
    error.value = null
  } catch {
    error.value = 'Couldn’t load your categories. Check your connection and try again.'
  } finally {
    loading.value = false
  }
}

function edit(category: Category) {
  formError.value = null
  editing.value = category
}

/** Quick picks for new categories; anything else via Custom. */
const PRESETS: { label: string; value: NewCategory }[] = [
  {
    label: 'Workout · 3 per week',
    value: { name: 'Workout', color: 'green', goal: { type: 'perWeek', target: 3 } },
  },
  {
    label: 'Reading · every day',
    value: { name: 'Reading', color: 'orange', goal: { type: 'daily' } },
  },
]
const BLANK: NewCategory = { name: '', color: 'purple', goal: { type: 'perWeek', target: 3 } }

function startAdding() {
  formError.value = null
  adding.value = true
}

function closeForm() {
  editing.value = null
  adding.value = false
}

async function save(value: NewCategory) {
  if (!services.value) return
  saving.value = true
  formError.value = null
  try {
    if (adding.value) {
      const created = await services.value.categories.addCategory(value)
      categories.value = [...categories.value, created]
    } else if (editing.value) {
      const updated = await services.value.categories.editCategory({ ...editing.value, ...value })
      categories.value = categories.value.map((c) => (c.id === updated.id ? updated : c))
    }
    closeForm()
    saved.value = true
    setTimeout(() => (saved.value = false), 2000)
  } catch (e) {
    // The domain's own messages, e.g. "Name must be 1 to 40 characters".
    formError.value = e instanceof Error ? e.message : 'That didn’t save. Please try again.'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <main class="settings">
    <h1>Settings</h1>

    <section>
      <h2>Categories</h2>
      <p v-if="loading" class="muted">Loading…</p>
      <p v-else-if="error" class="error" role="alert">
        {{ error }} <button type="button" class="link" @click="load">Retry</button>
      </p>
      <ul class="list">
        <li v-for="category in categories" :key="category.id">
          <button type="button" class="row" @click="edit(category)">
            <span class="dot" :style="{ background: colourHex(category.color) }"></span>
            <span class="name">{{ category.name }}</span>
            <span class="goal">{{ goalText(category.goal) }}</span>
            <span class="chevron" aria-hidden="true">›</span>
          </button>
        </li>
        <li v-if="!loading && !error">
          <button type="button" class="row add" @click="startAdding">
            <span class="plus" aria-hidden="true">＋</span>
            <span class="name">Add category</span>
          </button>
        </li>
      </ul>
      <p class="saved" :class="{ visible: saved }" aria-live="polite">{{ saved ? 'Saved' : '' }}</p>
    </section>

    <section class="account">
      <h2>Account</h2>
      <p class="muted">{{ user?.name }}</p>
      <button type="button" class="link" @click="signOut">Sign out</button>
    </section>

    <BottomSheet v-if="editing" label="Edit category" @close="closeForm">
      <CategoryForm
        title="Edit category"
        :initial="editing"
        :saving="saving"
        :error="formError"
        @save="save"
        @cancel="closeForm"
      />
    </BottomSheet>

    <BottomSheet v-if="adding" label="New category" @close="closeForm">
      <CategoryForm
        title="New category"
        :initial="BLANK"
        :presets="PRESETS"
        :saving="saving"
        :error="formError"
        @save="save"
        @cancel="closeForm"
      />
    </BottomSheet>
  </main>
</template>

<style scoped>
.settings {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 2rem 0.5rem;
}

h1 {
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
}

h2 {
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.6;
}

.list {
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  list-style: none;
  overflow: hidden;
}

.list li + li {
  border-top: 1px solid var(--color-border);
}

.row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  min-height: 56px;
  padding: 0 1rem;
  border: none;
  background: none;
  color: var(--color-text);
  font-size: 1rem;
  text-align: left;
  cursor: pointer;
}

.add {
  color: #2f6fdb;
}

.plus {
  width: 14px;
  text-align: center;
}

.dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
}

.name {
  flex: 1;
  font-weight: 600;
}

.goal,
.chevron,
.muted {
  opacity: 0.6;
}

.error {
  color: #c0392b;
}

.link {
  padding: 0;
  border: none;
  background: none;
  color: #2f6fdb;
  font-size: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.saved {
  min-height: 1.5rem;
  text-align: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.saved.visible {
  opacity: 1;
}
</style>
