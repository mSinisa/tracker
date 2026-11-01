import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

// Emulator tests (security rules and Firestore adapters). They run against the local
// Firestore emulator, never the real project. Use `npm run test:emulator`, which starts it first.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.ts'],
    testTimeout: 15000,
    // Every test file clears the same emulator database, so files must not run at the same time.
    fileParallelism: false,
  },
})
