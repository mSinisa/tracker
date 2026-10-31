import { defineConfig } from 'vitest/config'

// Security rules tests: run against the Firestore emulator, never against the real project.
// Use `npm run test:rules`, which starts the emulator first.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.spec.ts'],
    testTimeout: 15000,
  },
})
