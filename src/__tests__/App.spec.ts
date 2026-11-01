import { describe, it, expect } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import App from '../App.vue'
import type { Services } from '@/compositionRoot'
import type { ForSigningIn, User } from '@/core/ports/out'
import { createSession, provideSession } from '@/session'

/** A pretend sign-in that can also be told to fail. */
class FakeAuth implements ForSigningIn {
  user: User | null = null
  failWith: Error | null = null
  private listeners: ((user: User | null) => void)[] = []

  currentUser(): User | null {
    return this.user
  }
  async signIn(): Promise<User> {
    if (this.failWith) throw this.failWith
    this.user = { uid: 'me', name: 'Me' }
    this.listeners.forEach((l) => l(this.user))
    return this.user
  }
  async signOut(): Promise<void> {
    this.user = null
    this.listeners.forEach((l) => l(null))
  }
  onChange(listener: (user: User | null) => void): () => void {
    this.listeners.push(listener)
    listener(this.user)
    return () => {}
  }
}

/** Just enough of the services for signing in: reading the categories. */
const services = (): Services =>
  ({ categories: { listCategories: async () => [] } }) as unknown as Services

function mountApp(auth: FakeAuth, makeServices: (uid: string) => Services = services) {
  const session = createSession(auth, makeServices)
  return mount(App, {
    global: {
      plugins: [{ install: (app) => provideSession(app, session) }],
      stubs: { RouterView: { template: '<p>the app</p>' }, TabBar: true },
    },
  })
}

describe('App', () => {
  it('shows the sign-in screen when nobody is signed in', async () => {
    const wrapper = mountApp(new FakeAuth())
    await flushPromises()
    expect(wrapper.text()).toContain('Sign in with Google')
    expect(wrapper.text()).not.toContain('the app')
  })

  it('shows the app after signing in', async () => {
    const wrapper = mountApp(new FakeAuth())
    await flushPromises()
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('the app')
  })

  it('explains when an account is not allowed', async () => {
    const notAllowed = () =>
      ({
        categories: {
          listCategories: async () => {
            throw new Error('Missing or insufficient permissions.')
          },
        },
      }) as unknown as Services
    const wrapper = mountApp(new FakeAuth(), notAllowed)
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('This Google account can’t use this app.')
    expect(wrapper.text()).not.toContain('the app')
  })

  it('says nothing when the sign-in window is closed', async () => {
    const auth = new FakeAuth()
    auth.failWith = new Error('Firebase: Error (auth/popup-closed-by-user).')
    const wrapper = mountApp(auth)
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })
})
