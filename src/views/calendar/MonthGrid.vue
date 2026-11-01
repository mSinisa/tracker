<script setup lang="ts">
import { computed } from 'vue'
import type { Day } from '@/core/domain/day'
import { dayNumber, monthGrid } from './months'

const props = defineProps<{
  month: Day // any day in the month to show
  today: Day
  done: Record<string, string[]> // date -> categories checked in that day
}>()
const emit = defineEmits<{ select: [day: Day] }>()

const weeks = computed(() => monthGrid(props.month))
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const isDone = (day: Day) => (props.done[day]?.length ?? 0) > 0
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
            :aria-label="`${day}${isDone(day) ? ', checked in' : ''}`"
            :aria-pressed="isDone(day)"
            @click="emit('select', day)"
          >
            {{ dayNumber(day) }}
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
  width: 40px;
  height: 40px;
  border: 1px solid transparent;
  border-radius: 50%;
  background: none;
  color: var(--color-text);
  font-size: 0.95rem;
  cursor: pointer;
}

.day.done {
  border-color: #2f6fdb;
  background: #dbe8fc;
  color: #1b3f80;
  font-weight: 600;
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
