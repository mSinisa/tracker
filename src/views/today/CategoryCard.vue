<script setup lang="ts">
import { computed } from 'vue'
import type { CategoryOverview } from '@/core/ports/in'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { describeCard } from './describe'

const props = defineProps<{ overview: CategoryOverview; saving: boolean }>()
const emit = defineEmits<{ checkIn: []; undo: [] }>()

const text = computed(() => describeCard(props.overview))
</script>

<template>
  <section class="card">
    <h2>{{ overview.category.name }}</h2>
    <p class="big">{{ text.big }}</p>
    <p class="under">{{ text.under }}</p>

    <button
      v-if="!overview.checkedInToday"
      type="button"
      class="check-in"
      :disabled="saving"
      @click="emit('checkIn')"
    >
      Check in
    </button>
    <template v-else>
      <p class="checked-in">Checked in ✓</p>
      <button type="button" class="undo" :disabled="saving" @click="emit('undo')">Undo</button>
    </template>

    <p v-if="saving" class="status saving" role="status"><LoadingSpinner /> Saving…</p>
    <p v-else class="status">{{ text.status }}</p>
  </section>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  text-align: center;
}

h2 {
  font-size: 1.1rem;
  font-weight: 600;
}

.big {
  font-size: 2.5rem;
  font-weight: 600;
  line-height: 1.1;
}

.under,
.status {
  opacity: 0.7;
}

.check-in,
.checked-in {
  width: 100%;
  max-width: 280px;
  min-height: 56px;
  margin-top: 0.5rem;
  border-radius: 28px;
  font-size: 1.1rem;
  font-weight: 600;
}

.check-in {
  border: 2px solid #2f6fdb;
  background: #e7f0fd;
  color: #1b3f80;
  cursor: pointer;
}

.checked-in {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #2e8540;
  background: #e5f4e4;
  color: #1d5a29;
}

.saving {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.undo {
  border: none;
  background: none;
  color: #2f6fdb;
  font-size: 1rem;
  text-decoration: underline;
  cursor: pointer;
}

button:disabled {
  opacity: 0.5;
  cursor: default;
}
</style>
