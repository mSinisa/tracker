import { computed, inject, shallowRef, type App, type InjectionKey } from 'vue'
import type { ForSigningIn, User } from '@/core/ports/out'
import type { Services } from '@/compositionRoot'

/**
 * Who is signed in, and the services for that user. Shared with every screen.
 * It only knows the ports, so tests can give it a fake sign-in and in-memory services.
 */
export function createSession(auth: ForSigningIn, makeServices: (uid: string) => Services) {
  const user = shallowRef<User | null>(null)
  const services = shallowRef<Services | null>(null)
  const ready = shallowRef(false) // false until we know whether someone is signed in
  const error = shallowRef<string | null>(null)

  auth.onChange(async (signedIn) => {
    error.value = null
    if (!signedIn) {
      user.value = null
      services.value = null
      ready.value = true
      return
    }
    ready.value = false // show "Loading…" while the user's data is prepared
    try {
      const forUser = makeServices(signedIn.uid)
      // Reading the categories checks that this account may use the app (the rules say so).
      // A new user simply has none yet and adds their own in Settings.
      await forUser.categories.listCategories()
      user.value = signedIn
      services.value = forUser
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      ready.value = true
    }
  })

  // Screens can read these but not change them. computed() hands out the objects as they are:
  // readonly() would wrap the services in Vue proxies, which the adapters can't work with.
  return {
    user: computed(() => user.value),
    services: computed(() => services.value),
    ready: computed(() => ready.value),
    error: computed(() => error.value),
    async signIn(): Promise<void> {
      error.value = null
      try {
        await auth.signIn()
      } catch (e) {
        error.value = e instanceof Error ? e.message : String(e)
      }
    },
    signOut: () => auth.signOut(),
  }
}

export type Session = ReturnType<typeof createSession>

const SESSION: InjectionKey<Session> = Symbol('session')

/** Makes the session available to every screen. Called once, in main.ts. */
export function provideSession(app: App, session: Session): void {
  app.provide(SESSION, session)
}

/** Gives a screen the session. */
export function useSession(): Session {
  const session = inject(SESSION)
  if (!session) throw new Error('useSession() needs provideSession() in main.ts')
  return session
}
