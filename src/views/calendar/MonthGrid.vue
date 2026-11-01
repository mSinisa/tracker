<script setup lang="ts">
import { computed } from 'vue'
import type { Category } from '@/core/domain/category'
import type { Day } from '@/core/domain/day'
import { colourHex } from '@/views/settings/present'
import { dayNumber, monthGrid } from './months'

const props = withDefaults(
  defineProps<{
    month: Day // any day in the month to show
    today: Day
    done: Record<string, string[]> // date -> categories checked in that day
    categories?: Category[] // for each dot's colour and name, in list order
  }>(),
  { categories: () => [] },
)
const emit = defineEmits<{ select: [day: Day] }>()

const weeks = computed(() => monthGrid(props.month))
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const isDone = (day: Day) => (props.done[day]?.length ?? 0) > 0

/** At most this many dots fit under a day; the rest become a "+". */
const MAX_DOTS = 3

/** The categories checked in on a day, in the same order as everywhere else. */
function doneOn(day: Day): Category[] {
  const ids = props.done[day] ?? []
  return props.categories.filter((c) => ids.includes(c.id))
}

/** "2026-10-29, Office days, Workout": what VoiceOver reads for a day. */
function labelFor(day: Day): string {
  return [day, ...doneOn(day).map((c) => c.name)].join(', ')
}
</script>

<template>
  <table class="grid">
    <thead>
      <tr>
        <th v-for="(name, i) in WEEKDAYS" :key="i" scope="col">{{ name }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(week, w) in weeks" :key="w">
        <td v-for="(day, d) in week" :key="d">
          <button
            v-if="day"
            type="button"
            class="day"
            :class="{ done: isDone(day), today: day === today }"
            :disabled="day > today"
            :aria-label="labelFor(day)"
            :aria-pressed="isDone(day)"
            @click="emit('select', day)"
          >
            <span class="number">{{ dayNumber(day) }}</span>
            <span class="dots" aria-hidden="true">
              <span
                v-for="category in doneOn(day).slice(0, MAX_DOTS)"
                :key="category.id"
                class="dot"
                :style="{ background: colourHex(category.color) }"
              ></span>
              <span v-if="doneOn(day).length > MAX_DOTS" class="more">+</span>
            </span>
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.grid {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

th {
  padding-bottom: 0.5rem;
  font-size: 0.8rem;
  font-weight: normal;
  opacity: 0.6;
}

td {
  padding: 2px;
  text-align: center;
}

.day {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  width: 40px;
  height: 44px;
  margin: 0 auto;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 10px;
  background: none;
  color: var(--color-text);
  font-size: 0.95rem;
  cursor: pointer;
}

.day.done .number {
  font-weight: 600;
}

.dots {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 6px; /* the same height with or without dots, so numbers line up */
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.more {
  font-size: 0.65rem;
  line-height: 1;
  opacity: 0.7;
}

.day.today {
  outline: 2px solid var(--color-text);
  outline-offset: 1px;
}

.day:disabled {
  opacity: 0.35;
  cursor: default;
}
</style>
