<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useSession } from '@/session'
import SignInView from '@/views/SignInView.vue'

// Nothing of the app is shown until we know who is signed in.
const { ready, user } = useSession()
</script>

<template>
  <p v-if="!ready" class="loading">Loading…</p>
  <SignInView v-else-if="!user" />
  <RouterView v-else />
</template>

<style scoped>
.loading {
  padding: 4rem 1.5rem;
  text-align: center;
  opacity: 0.7;
}
</style>
