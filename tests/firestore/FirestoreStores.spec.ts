import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import type { Firestore } from 'firebase/firestore'
import { FirestoreCategoryStore } from '@/adapters/storage/FirestoreCategoryStore'
import { FirestoreEntryStore } from '@/adapters/storage/FirestoreEntryStore'
import type { Category } from '@/core/domain/category'
import { parseDay } from '@/core/domain/day'
import type { Entry } from '@/core/domain/entry'

// The Firestore adapters against the local emulator, with the real security rules switched on:
// every write here must also be allowed by firestore.rules.

const OWNER = 'UBewZkSJljMq5acZykNuCjT2yZa2'

const office: Category = {
  id: 'office-days',
  name: 'Office days',
  color: 'blue',
  goal: { type: 'perMonth', target: 8 },
}
const officeShort: Category = { ...office, id: 'office', name: 'Office' } // id is a prefix of office-days
const reading: Category = {
  id: 'reading',
  name: 'Reading',
  color: 'orange',
  goal: { type: 'daily' },
}

const entry = (categoryId: string, date: string): Entry => ({
  categoryId,
  date: parseDay(date),
  source: 'button',
})

let env: RulesTestEnvironment
let categories: FirestoreCategoryStore
let entries: FirestoreEntryStore

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-tracker',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  })
})

beforeEach(async () => {
  await env.clearFirestore()
  // The test helper returns the compat Firestore type; the modular functions accept it at runtime.
  const db = env
    .authenticatedContext(OWNER, { firebase: { sign_in_provider: 'google.com' } })
    .firestore() as unknown as Firestore
  categories = new FirestoreCategoryStore(db, OWNER)
  entries = new FirestoreEntryStore(db, OWNER)
})

afterAll(async () => {
  await env.cleanup()
})

describe('FirestoreCategoryStore', () => {
  it('saves, reads and lists categories, including a daily goal without a target', async () => {
    await categories.save(office)
    await categories.save(reading)
    expect(await categories.get('office-days')).toEqual(office)
    expect(await categories.get('missing')).toBeNull()
    expect(await categories.list()).toEqual(expect.arrayContaining([office, reading]))
  })

  it('updates a category and keeps its createdAt', async () => {
    await categories.save(office)
    let createdBefore: unknown
    await env.withSecurityRulesDisabled(async (ctx) => {
      createdBefore = (
        await ctx.firestore().doc(`users/${OWNER}/categories/office-days`).get()
      ).get('createdAt')
    })
    await categories.save({ ...office, name: 'Office', goal: { type: 'perMonth', target: 10 } })
    expect(await categories.get('office-days')).toEqual({
      ...office,
      name: 'Office',
      goal: { type: 'perMonth', target: 10 },
    })
    await env.withSecurityRulesDisabled(async (ctx) => {
      const after = (await ctx.firestore().doc(`users/${OWNER}/categories/office-days`).get()).get(
        'createdAt',
      )
      expect(after).toEqual(createdBefore)
    })
  })

  it('removes a category', async () => {
    await categories.save(office)
    await categories.remove('office-days')
    expect(await categories.get('office-days')).toBeNull()
  })
})

describe('FirestoreEntryStore', () => {
  it('saves an entry and keeps one per category and day', async () => {
    await entries.save(entry('office-days', '2026-10-29'))
    await entries.save({ ...entry('office-days', '2026-10-29'), source: 'calendar' })
    expect(await entries.listAll()).toEqual([
      { categoryId: 'office-days', date: '2026-10-29', source: 'calendar' },
    ])
  })

  it('lists one category between two days, inclusive and sorted', async () => {
    for (const e of [
      entry('office-days', '2026-10-31'),
      entry('office-days', '2026-09-30'),
      entry('office-days', '2026-10-01'),
      entry('office-days', '2026-11-01'),
      entry('reading', '2026-10-15'),
    ]) {
      await entries.save(e)
    }
    const october = await entries.listBetween(
      'office-days',
      parseDay('2026-10-01'),
      parseDay('2026-10-31'),
    )
    expect(october.map((e) => e.date)).toEqual(['2026-10-01', '2026-10-31'])
  })

  it('does not mix up categories whose ids start the same', async () => {
    await categories.save(officeShort)
    await entries.save(entry('office', '2026-10-02'))
    await entries.save(entry('office-days', '2026-10-02'))
    const from = parseDay('2026-10-01')
    const to = parseDay('2026-10-31')
    expect((await entries.listBetween('office', from, to)).map((e) => e.categoryId)).toEqual([
      'office',
    ])
    expect((await entries.listBetween('office-days', from, to)).map((e) => e.categoryId)).toEqual([
      'office-days',
    ])
  })

  it('removes one day', async () => {
    await entries.save(entry('office-days', '2026-10-28'))
    await entries.save(entry('office-days', '2026-10-29'))
    await entries.remove('office-days', parseDay('2026-10-29'))
    expect((await entries.listAll()).map((e) => e.date)).toEqual(['2026-10-28'])
  })

  it('removes all entries of one category only', async () => {
    await entries.save(entry('office-days', '2026-10-02'))
    await entries.save(entry('office-days', '2026-10-07'))
    await entries.save(entry('reading', '2026-10-02'))
    await entries.removeAllFor('office-days')
    expect(await entries.listAll()).toEqual([entry('reading', '2026-10-02')])
  })
})
