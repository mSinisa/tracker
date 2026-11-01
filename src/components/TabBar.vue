<script setup lang="ts">
import { RouterLink } from 'vue-router'

// The app's main sections. Settings joins in Phase 6.
const tabs = [
  { to: '/', label: 'Today' },
  { to: '/calendar', label: 'Calendar' },
]
</script>

<template>
  <nav class="tab-bar" aria-label="Sections">
    <RouterLink v-for="tab in tabs" :key="tab.to" :to="tab.to" class="tab">
      {{ tab.label }}
    </RouterLink>
  </nav>
</template>

<style scoped>
.tab-bar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem calc(0.5rem + env(safe-area-inset-bottom));
  border-top: 1px solid var(--color-border);
  background: var(--color-background);
}

.tab {
  flex: 1;
  max-width: 160px;
  padding: 0.6rem 0;
  border-radius: 12px;
  color: var(--color-text);
  text-align: center;
  text-decoration: none;
  opacity: 0.7;
}

/* The tab of the page you're on. */
.tab.router-link-exact-active {
  color: #2f6fdb;
  font-weight: 600;
  opacity: 1;
}
</style>
