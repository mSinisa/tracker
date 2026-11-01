<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useSession } from '@/session'
import SignInView from '@/views/SignInView.vue'
import TabBar from '@/components/TabBar.vue'

// Nothing of the app is shown until we know who is signed in.
const { ready, user } = useSession()
</script>

<template>
  <p v-if="!ready" class="loading">Loading…</p>
  <SignInView v-else-if="!user" />
  <template v-else>
    <div class="page"><RouterView /></div>
    <TabBar />
  </template>
</template>

<style scoped>
/* Leaves room at the bottom so the tab bar never covers the page. */
.page {
  padding-bottom: calc(5rem + env(safe-area-inset-bottom));
}

.loading {
  padding: 4rem 1.5rem;
  text-align: center;
  opacity: 0.7;
}
</style>
