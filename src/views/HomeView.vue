<script setup lang="ts">
import { ref } from 'vue'
import { GoogleAuth } from '@/adapters/auth/GoogleAuth'
import type { User } from '@/core/ports/out'

// TEMPORARY (Phase 2): only to sign in once and read your UID. Replaced in Phase 3.
const auth = new GoogleAuth()
const user = ref<User | null>(null)
const error = ref('')

auth.onChange((u) => (user.value = u))

async function signIn() {
  error.value = ''
  try {
    user.value = await auth.signIn()
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
}
</script>

<template>
  <main>
    <button v-if="!user" @click="signIn">Sign in with Google</button>
    <template v-else>
      <p>Signed in as {{ user.name }}</p>
      <p>
        Your UID: <code>{{ user.uid }}</code>
      </p>
      <button @click="auth.signOut()">Sign out</button>
    </template>
    <p v-if="error">{{ error }}</p>
  </main>
</template>
