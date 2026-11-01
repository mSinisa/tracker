<script setup lang="ts">
import { computed } from 'vue'
import { useSession } from '@/session'

const { signIn, error } = useSession()

/** Firebase errors are technical; show what they mean for the person signing in. */
const message = computed(() => {
  const text = error.value
  if (!text) return null
  if (text.includes('permission')) return 'This Google account can’t use this app.'
  if (text.includes('popup-closed') || text.includes('cancelled-popup')) return null
  if (text.includes('popup-blocked'))
    return 'Your browser blocked the sign-in window. Allow pop-ups and try again.'
  return 'Sign-in didn’t work. Please try again.'
})
</script>

<template>
  <main class="sign-in">
    <h1>Tracker</h1>
    <p class="tagline">Check in on the days that count.</p>
    <button type="button" @click="signIn">Sign in with Google</button>
    <p v-if="message" class="error" role="alert">{{ message }}</p>
  </main>
</template>

<style scoped>
.sign-in {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem 1.5rem;
  text-align: center;
}

h1 {
  font-size: 2rem;
  font-weight: 600;
}

.tagline {
  color: var(--color-text);
  opacity: 0.7;
}

button {
  min-height: 48px;
  padding: 0 1.5rem;
  border: 1px solid var(--color-border-hover);
  border-radius: 24px;
  background: var(--color-background-soft);
  color: var(--color-text);
  font-size: 1rem;
  cursor: pointer;
}

.error {
  color: #c0392b;
}
</style>
