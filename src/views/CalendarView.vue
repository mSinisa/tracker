<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue'
import type { Category } from '@/core/domain/category'
import { dayOf, startOfMonth, type Day } from '@/core/domain/day'
import type { MonthView } from '@/core/ports/in'
import { useSession } from '@/session'
import DayPanel from './calendar/DayPanel.vue'
import MonthGrid from './calendar/MonthGrid.vue'
import { addMonths, dayLabel, monthLabel } from './calendar/months'
import { monthSummary } from './calendar/summary'

const { services } = useSession()

const today: Day = dayOf(new Date())
const thisMonth = startOfMonth(today)

const month = ref<Day>(thisMonth)
const view = shallowRef<MonthView | null>(null)
const categories = shallowRef<Category[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const selected = ref<Day | null>(null) // the day whose panel is open
const savingId = ref<string | null>(null) // category being saved from the panel
const saved = ref(false)

const summary = computed(() => (view.value ? monthSummary(view.value, categories.value) : []))
const isCurrentMonth = computed(() => month.value === thisMonth)

async function load() {
  if (!services.value) return
  loading.value = true
  try {
    const [monthView, list] = await Promise.all([
      services.value.progress.getMonth(month.value),
      services.value.categories.listCategories(),
    ])
    view.value = monthView
    categories.value = list
    error.value = null
  } catch {
    error.value = 'Couldn’t load this month. Check your connection and try again.'
  } finally {
    loading.value = false
  }
}

function go(months: number) {
  month.value = addMonths(month.value, months)
  void load()
}

/**
 * Adds or removes the selected day for one category. After saving, the month is updated
 * here instead of reloaded, which saves two trips to Firestore.
 */
async function toggle(categoryId: string) {
  const day = selected.value
  if (!services.value || !day || !view.value) return
  savingId.value = categoryId
  try {
    const added = await services.value.checkIn.toggleDay(categoryId, day)
    const ids = (view.value.days[day] ?? []).filter((id) => id !== categoryId)
    const days = { ...view.value.days, [day]: added ? [...ids, categoryId] : ids }
    if (!added && ids.length === 0) delete days[day]
    view.value = { ...view.value, days }
    selected.value = null
    saved.value = true
    setTimeout(() => (saved.value = false), 2000)
  } catch {
    error.value = 'That didn’t save. Please try again.'
  } finally {
    savingId.value = null
  }
}

onMounted(load)
</script>

<template>
  <main class="calendar">
    <header>
      <button type="button" class="arrow" aria-label="Previous month" @click="go(-1)">‹</button>
      <h1>{{ monthLabel(month) }}</h1>
      <button
        type="button"
        class="arrow"
        aria-label="Next month"
        :disabled="isCurrentMonth"
        @click="go(1)"
      >
        ›
      </button>
    </header>

    <ul class="summary">
      <li v-for="line in summary" :key="line.categoryId">
        <strong>{{ line.text }}</strong> {{ line.name }}
      </li>
    </ul>

    <p v-if="error" class="error" role="alert">
      {{ error }} <button type="button" class="link" @click="load">Retry</button>
    </p>

    <MonthGrid
      :month="month"
      :today="today"
      :done="view?.days ?? {}"
      :class="{ loading }"
      @select="selected = $event"
    />

    <p class="saved" :class="{ visible: saved }" aria-live="polite">{{ saved ? 'Saved' : '' }}</p>
    <p class="hint">Tap a past day to add or remove it.</p>

    <DayPanel
      v-if="selected"
      :day="selected"
      :label="dayLabel(selected)"
      :categories="categories"
      :done-ids="view?.days[selected] ?? []"
      :saving-id="savingId"
      @toggle="toggle"
      @close="selected = null"
    />
  </main>
</template>

<style scoped>
.calendar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 2rem 0.5rem;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

h1 {
  font-size: 1.3rem;
  font-weight: 600;
}

.arrow {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background: none;
  color: var(--color-text);
  font-size: 1.6rem;
  cursor: pointer;
}

.arrow:disabled {
  opacity: 0.25;
  cursor: default;
}

.summary {
  padding: 0;
  list-style: none;
  text-align: center;
}

.error {
  color: #c0392b;
  text-align: center;
}

.link {
  border: none;
  background: none;
  color: #2f6fdb;
  text-decoration: underline;
  cursor: pointer;
}

.loading {
  opacity: 0.5;
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

.hint {
  font-size: 0.85rem;
  text-align: center;
  opacity: 0.6;
}
</style>
