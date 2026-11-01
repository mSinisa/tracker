import { describe, it, expect } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { FixedClock } from '@/adapters/clock/FixedClock'
import { InMemoryCategoryStore } from '@/adapters/storage/InMemoryCategoryStore'
import { InMemoryEntryStore } from '@/adapters/storage/InMemoryEntryStore'
import type { Services } from '@/compositionRoot'
import { parseDay } from '@/core/domain/day'
import type { ForSigningIn, User } from '@/core/ports/out'
import { BackupService } from '@/core/services/BackupService'
import { CategoryService } from '@/core/services/CategoryService'
import { CheckInService } from '@/core/services/CheckInService'
import { ProgressService } from '@/core/services/ProgressService'
import { createSession } from '../session'

/** A pretend sign-in: a driven adapter for ForSigningIn that needs no Google. */
class FakeAuth implements ForSigningIn {
  private user: User | null = null
  private listeners: ((user: User | null) => void)[] = []

  currentUser(): User | null {
    return this.user
  }
  async signIn(): Promise<User> {
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
    listener(this.user) // like Firebase: tell the listener the current state straight away
    return () => {}
  }
}

/** Like createServices(uid) in the composition root, but with in-memory adapters. */
function inMemoryServices(): { make: (uid: string) => Services; uids: string[] } {
  const uids: string[] = []
  const make = (uid: string): Services => {
    uids.push(uid)
    const categories = new InMemoryCategoryStore()
    const entries = new InMemoryEntryStore()
    const clock = new FixedClock(parseDay('2026-10-29'))
    return {
      checkIn: new CheckInService(categories, entries, clock),
      progress: new ProgressService(categories, entries, clock),
      categories: new CategoryService(categories, entries),
      backup: new BackupService(categories, entries, clock),
    }
  }
  return { make, uids }
}

describe('session', () => {
  it('is ready with no user and no services when nobody is signed in', async () => {
    const session = createSession(new FakeAuth(), inMemoryServices().make)
    await flushPromises()
    expect(session.ready.value).toBe(true)
    expect(session.user.value).toBeNull()
    expect(session.services.value).toBeNull()
  })

  it('builds the services for the signed-in uid, with no categories yet', async () => {
    const services = inMemoryServices()
    const session = createSession(new FakeAuth(), services.make)
    await session.signIn()
    await flushPromises()
    expect(session.user.value).toEqual({ uid: 'me', name: 'Me' })
    expect(services.uids).toEqual(['me'])
    const cards = await session.services.value!.progress.getTodayOverview()
    expect(cards).toEqual([])
  })

  it('drops the services on sign-out', async () => {
    const session = createSession(new FakeAuth(), inMemoryServices().make)
    await session.signIn()
    await flushPromises()
    await session.signOut()
    await flushPromises()
    expect(session.user.value).toBeNull()
    expect(session.services.value).toBeNull()
  })

  it('shows a sign-in error instead of throwing', async () => {
    const auth = new FakeAuth()
    auth.signIn = async () => {
      throw new Error('Popup closed')
    }
    const session = createSession(auth, inMemoryServices().make)
    await session.signIn()
    expect(session.error.value).toBe('Popup closed')
  })
})
