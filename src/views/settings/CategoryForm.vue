<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { Goal } from '@/core/domain/goal'
import type { NewCategory } from '@/core/ports/in'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { COLOURS, maxTarget } from './present'

const props = defineProps<{
  title: string
  initial: NewCategory
  saving: boolean
  error: string | null
  presets?: { label: string; value: NewCategory }[] // quick picks, shown when adding
}>()
const emit = defineEmits<{ save: [value: NewCategory]; cancel: [] }>()

type GoalType = Goal['type']

// A local copy, so nothing changes until Save is pressed.
const form = reactive({
  name: props.initial.name,
  color: props.initial.color,
  type: props.initial.goal.type as GoalType,
  target: props.initial.goal.type === 'daily' ? 3 : props.initial.goal.target,
})

/** Fills the form from a quick pick, or clears it for Custom (null). */
const picked = ref<string | null>(null)
function pick(label: string | null) {
  picked.value = label
  const value = props.presets?.find((p) => p.label === label)?.value ?? props.initial
  form.name = value.name
  form.color = value.color
  form.type = value.goal.type
  form.target = value.goal.type === 'daily' ? 3 : value.goal.target
}

const GOAL_TYPES: { type: GoalType; label: string }[] = [
  { type: 'perMonth', label: 'Per month' },
  { type: 'perWeek', label: 'Per week' },
  { type: 'daily', label: 'Every day' },
]

const max = computed(() => (form.type === 'daily' ? 0 : maxTarget(form.type)))

function setType(type: GoalType) {
  form.type = type
  if (type !== 'daily') form.target = Math.min(form.target, maxTarget(type))
}

function step(by: number) {
  form.target = Math.min(Math.max(form.target + by, 1), max.value)
}

function save() {
  const goal: Goal =
    form.type === 'daily' ? { type: 'daily' } : { type: form.type, target: form.target }
  emit('save', { name: form.name, color: form.color, goal })
}
</script>

<template>
  <form class="form" @submit.prevent="save">
    <h2>{{ title }}</h2>

    <div v-if="presets?.length" class="presets" role="radiogroup" aria-label="Quick picks">
      <button
        v-for="preset in presets"
        :key="preset.label"
        type="button"
        role="radio"
        class="chip"
        :aria-checked="picked === preset.label"
        @click="pick(preset.label)"
      >
        {{ preset.label }}
      </button>
      <button
        type="button"
        role="radio"
        class="chip"
        :aria-checked="picked === null"
        @click="pick(null)"
      >
        Custom
      </button>
    </div>

    <label class="field">
      <span>Name</span>
      <input v-model="form.name" type="text" maxlength="40" required autocomplete="off" />
    </label>

    <fieldset class="field">
      <legend>Colour</legend>
      <div class="swatches">
        <button
          v-for="c in COLOURS"
          :key="c.name"
          type="button"
          class="swatch"
          :class="{ chosen: form.color === c.name }"
          :style="{ background: c.hex }"
          :aria-label="c.label"
          :aria-pressed="form.color === c.name"
          @click="form.color = c.name"
        ></button>
      </div>
    </fieldset>

    <fieldset class="field">
      <legend>Goal</legend>
      <div class="segments" role="radiogroup">
        <button
          v-for="g in GOAL_TYPES"
          :key="g.type"
          type="button"
          role="radio"
          class="segment"
          :aria-checked="form.type === g.type"
          @click="setType(g.type)"
        >
          {{ g.label }}
        </button>
      </div>
      <div v-if="form.type !== 'daily'" class="stepper">
        <button type="button" aria-label="Fewer" :disabled="form.target <= 1" @click="step(-1)">
          −
        </button>
        <output aria-live="polite">{{ form.target }}</output>
        <button type="button" aria-label="More" :disabled="form.target >= max" @click="step(1)">
          +
        </button>
        <span class="unit">{{ form.type === 'perMonth' ? 'days a month' : 'days a week' }}</span>
      </div>
    </fieldset>

    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <div class="actions">
      <button type="button" class="cancel" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="save" :disabled="saving">
        <template v-if="saving"><LoadingSpinner /> Saving…</template>
        <template v-else>Save</template>
      </button>
    </div>
  </form>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

h2 {
  font-size: 1.1rem;
  font-weight: 600;
  text-align: center;
}

.presets {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

.chip {
  min-height: 36px;
  padding: 0 0.9rem;
  border: 1px solid var(--color-border-hover);
  border-radius: 18px;
  background: none;
  color: var(--color-text);
  font-size: 0.9rem;
  cursor: pointer;
}

.chip[aria-checked='true'] {
  border-color: #2f6fdb;
  background: #e7f0fd;
  color: #1b3f80;
  font-weight: 600;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin: 0;
  padding: 0;
  border: none;
}

.field > span,
legend {
  font-size: 0.85rem;
  opacity: 0.7;
}

input {
  min-height: 44px;
  padding: 0 0.75rem;
  border: 1px solid var(--color-border-hover);
  border-radius: 10px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 1rem; /* 16px or more stops iPhone from zooming in on the field */
}

.swatches {
  display: flex;
  gap: 0.6rem;
}

.swatch {
  width: 36px;
  height: 36px;
  border: 3px solid transparent;
  border-radius: 50%;
  cursor: pointer;
}

.swatch.chosen {
  border-color: var(--color-background);
  outline: 2px solid var(--color-text);
}

.segments {
  display: flex;
  border: 1px solid var(--color-border-hover);
  border-radius: 10px;
  overflow: hidden;
}

.segment {
  flex: 1;
  min-height: 40px;
  border: none;
  background: none;
  color: var(--color-text);
  font-size: 0.95rem;
  cursor: pointer;
}

.segment[aria-checked='true'] {
  background: #2f6fdb;
  color: #fff;
  font-weight: 600;
}

.stepper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.25rem;
}

.stepper button {
  width: 40px;
  height: 40px;
  border: 1px solid var(--color-border-hover);
  border-radius: 50%;
  background: none;
  color: var(--color-text);
  font-size: 1.2rem;
  cursor: pointer;
}

.stepper output {
  min-width: 2ch;
  font-size: 1.3rem;
  font-weight: 600;
  text-align: center;
}

.unit {
  opacity: 0.7;
}

.error {
  color: #c0392b;
}

.actions {
  display: flex;
  gap: 0.75rem;
}

.actions button {
  flex: 1;
  min-height: 48px;
  border-radius: 24px;
  font-size: 1rem;
  cursor: pointer;
}

.cancel {
  border: 1px solid var(--color-border-hover);
  background: none;
  color: var(--color-text);
}

.save {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  border: none;
  background: #2f6fdb;
  color: #fff;
  font-weight: 600;
}

button:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
