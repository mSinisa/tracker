<script setup lang="ts">
import { onMounted, ref, shallowRef } from 'vue'
import type { CategoryOverview } from '@/core/ports/in'
import { useSession } from '@/session'
import CategoryCard from './today/CategoryCard.vue'
import { formatToday } from './today/describe'

const { services, user, signOut } = useSession()

const cards = shallowRef<CategoryOverview[]>([])
const loading = ref(true)
const busy = ref(false)
const error = ref<string | null>(null)
const saved = ref(false)
const today = formatToday(new Date())

async function load() {
  if (!services.value) return
  try {
    cards.value = await services.value.progress.getTodayOverview()
    error.value = null
  } catch {
    error.value = 'Couldn’t load your data. Check your connection and try again.'
  } finally {
    loading.value = false
  }
}

/** Runs a change, then reloads the cards so the counts are always what was really saved. */
async function change(action: () => Promise<unknown>, showSaved: boolean) {
  busy.value = true
  try {
    await action()
    await load()
    if (showSaved) {
      saved.value = true
      setTimeout(() => (saved.value = false), 2000)
    }
  } catch {
    error.value = 'That didn’t save. Please try again.'
  } finally {
    busy.value = false
  }
}

const checkIn = (categoryId: string) =>
  change(() => services.value!.checkIn.checkInToday(categoryId), true)
const undo = (categoryId: string) =>
  change(() => services.value!.checkIn.undoCheckIn(categoryId), false)

onMounted(load)
</script>

<template>
  <main class="today">
    <header>
      <p class="label">Today</p>
      <h1>{{ today }}</h1>
    </header>

    <p v-if="loading" class="muted">Loading…</p>
    <p v-else-if="error" class="error" role="alert">
      {{ error }} <button type="button" class="link" @click="load">Retry</button>
    </p>

    <CategoryCard
      v-for="card in cards"
      :key="card.category.id"
      :overview="card"
      :busy="busy"
      @check-in="checkIn(card.category.id)"
      @undo="undo(card.category.id)"
    />

    <p class="saved" :class="{ visible: saved }" aria-live="polite">{{ saved ? 'Saved' : '' }}</p>

    <footer>
      <span class="muted">{{ user?.name }}</span>
      <button type="button" class="link" @click="signOut">Sign out</button>
    </footer>
  </main>
</template>

<style scoped>
.today {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 420px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

header {
  text-align: center;
}

.label,
.muted {
  opacity: 0.7;
}

h1 {
  font-size: 1.5rem;
  font-weight: 600;
}

.error {
  color: #c0392b;
  text-align: center;
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

footer {
  display: flex;
  justify-content: center;
  gap: 1rem;
  font-size: 0.9rem;
}

.link {
  border: none;
  background: none;
  color: #2f6fdb;
  text-decoration: underline;
  cursor: pointer;
  font-size: inherit;
}
</style>
