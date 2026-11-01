<script setup lang="ts">
defineProps<{ label: string }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <div class="backdrop" @click.self="emit('close')">
    <section class="sheet" role="dialog" aria-modal="true" :aria-label="label">
      <slot />
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

.sheet {
  width: 100%;
  max-width: 480px;
  max-height: 90dvh;
  overflow-y: auto;
  padding: 1.25rem 1rem calc(1.25rem + env(safe-area-inset-bottom));
  border-radius: 16px 16px 0 0;
  background: var(--color-background);
}
</style>
