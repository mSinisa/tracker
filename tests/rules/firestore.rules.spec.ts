import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'

// These tests run against the local Firestore emulator (npm run test:rules), never the real project.

const OWNER = 'UBewZkSJljMq5acZykNuCjT2yZa2'
const WIFE = 'dR3D6LbGSXex2DQG3weR6gD8tur1'
const STRANGER = 'someone-else'

const category = {
  name: 'Office days',
  color: 'blue',
  goal: { type: 'perMonth', target: 8 },
  createdAt: new Date('2026-10-01T09:00:00Z'),
}

const entry = {
  categoryId: 'office-days',
  date: '2026-10-29',
  checkedInAt: new Date('2026-10-29T08:47:00Z'),
  source: 'button',
}

const categoryPath = (uid: string, id = 'office-days') => `users/${uid}/categories/${id}`
const entryPath = (uid: string, id = 'office-days_2026-10-29') => `users/${uid}/entries/${id}`

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-tracker',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  })
})

beforeEach(async () => {
  await env.clearFirestore()
})

afterAll(async () => {
  await env.cleanup()
})

/** The Firestore client of someone signed in with Google (or another provider). */
function signedIn(uid: string, provider: 'google.com' | 'password' = 'google.com') {
  return env.authenticatedContext(uid, { firebase: { sign_in_provider: provider } }).firestore()
}

const owner = () => signedIn(OWNER)
const signedOut = () => env.unauthenticatedContext().firestore()

/** Puts data in place as an admin, bypassing the rules, so reads and deletes can be tested. */
async function seed(path: string, data: object) {
  await env.withSecurityRulesDisabled((ctx) => ctx.firestore().doc(path).set(data))
}

describe('the owner', () => {
  it('can create, read, update and delete a category', async () => {
    const ref = owner().doc(categoryPath(OWNER))
    await assertSucceeds(ref.set(category))
    await assertSucceeds(ref.get())
    await assertSucceeds(ref.set({ ...category, name: 'Office' }))
    await assertSucceeds(ref.delete())
  })

  it('can create, read and delete an entry', async () => {
    const ref = owner().doc(entryPath(OWNER))
    await assertSucceeds(ref.set(entry))
    await assertSucceeds(ref.get())
    await assertSucceeds(ref.delete())
  })

  it('can list their own entries', async () => {
    await seed(entryPath(OWNER), entry)
    await assertSucceeds(owner().collection(`users/${OWNER}/entries`).get())
  })

  it('can save a daily category without a target', async () => {
    const daily = { ...category, name: 'Reading', goal: { type: 'daily' } }
    await assertSucceeds(owner().doc(categoryPath(OWNER, 'reading')).set(daily))
  })

  it('cannot write anywhere outside their own folder', async () => {
    await assertFails(owner().doc('settings/global').set({ theme: 'dark' }))
    await assertFails(owner().doc(`users/${OWNER}`).set({ name: 'me' }))
  })
})

describe('the second user', () => {
  const wife = () => signedIn(WIFE)

  it('can create, read, update and delete her own categories and entries', async () => {
    const category_ = wife().doc(categoryPath(WIFE))
    await assertSucceeds(category_.set(category))
    await assertSucceeds(category_.get())
    await assertSucceeds(category_.set({ ...category, name: 'Office' }))
    await assertSucceeds(category_.delete())
    const entry_ = wife().doc(entryPath(WIFE))
    await assertSucceeds(entry_.set(entry))
    await assertSucceeds(wife().collection(`users/${WIFE}/entries`).get())
    await assertSucceeds(entry_.delete())
  })

  it("cannot read or write the owner's data", async () => {
    await seed(entryPath(OWNER), entry)
    await assertFails(wife().doc(entryPath(OWNER)).get())
    await assertFails(wife().collection(`users/${OWNER}/entries`).get())
    await assertFails(wife().doc(entryPath(OWNER)).delete())
    await assertFails(wife().doc(categoryPath(OWNER)).set(category))
  })

  it('the owner cannot read or write her data', async () => {
    await seed(entryPath(WIFE), entry)
    await assertFails(owner().doc(entryPath(WIFE)).get())
    await assertFails(owner().collection(`users/${WIFE}/entries`).get())
    await assertFails(owner().doc(entryPath(WIFE)).delete())
    await assertFails(owner().doc(categoryPath(WIFE)).set(category))
  })

  it('her uid with a non-Google sign-in: refused', async () => {
    await assertFails(signedIn(WIFE, 'password').doc(categoryPath(WIFE)).set(category))
    await assertFails(signedIn(WIFE, 'password').doc(entryPath(WIFE)).get())
  })
})

describe('everyone else', () => {
  it('signed out: cannot read or write', async () => {
    await seed(entryPath(OWNER), entry)
    await assertFails(signedOut().doc(entryPath(OWNER)).get())
    await assertFails(signedOut().doc(categoryPath(OWNER)).set(category))
  })

  it("another Google user: cannot read or write the owner's data", async () => {
    await seed(entryPath(OWNER), entry)
    await assertFails(signedIn(STRANGER).doc(entryPath(OWNER)).get())
    await assertFails(signedIn(STRANGER).doc(entryPath(OWNER)).delete())
    await assertFails(signedIn(STRANGER).doc(categoryPath(OWNER)).set(category))
  })

  it('another Google user: cannot even use their own folder', async () => {
    await assertFails(signedIn(STRANGER).doc(categoryPath(STRANGER)).set(category))
    await assertFails(signedIn(STRANGER).doc(entryPath(STRANGER)).set(entry))
  })

  it('the owner uid with a non-Google sign-in: refused', async () => {
    await assertFails(signedIn(OWNER, 'password').doc(categoryPath(OWNER)).set(category))
    await assertFails(signedIn(OWNER, 'password').doc(entryPath(OWNER)).get())
  })
})

describe('invalid categories are refused', () => {
  const write = (data: object, id = 'office-days') => owner().doc(categoryPath(OWNER, id)).set(data)

  it('with an extra field', async () => {
    await assertFails(write({ ...category, hacked: true }))
  })

  it('without createdAt', async () => {
    const { createdAt: _createdAt, ...withoutDate } = category
    await assertFails(write(withoutDate))
  })

  it('with an empty or too long name', async () => {
    await assertFails(write({ ...category, name: '' }))
    await assertFails(write({ ...category, name: 'x'.repeat(41) }))
  })

  it('with a goal target of 0, 32 or text', async () => {
    await assertFails(write({ ...category, goal: { type: 'perMonth', target: 0 } }))
    await assertFails(write({ ...category, goal: { type: 'perMonth', target: 32 } }))
    await assertFails(write({ ...category, goal: { type: 'perWeek', target: '3' } }))
  })

  it('with an unknown goal type', async () => {
    await assertFails(write({ ...category, goal: { type: 'yearly', target: 8 } }))
  })

  it('with an invalid id', async () => {
    await assertFails(write(category, 'Office Days'))
  })
})

describe('invalid entries are refused', () => {
  const write = (data: object, id = 'office-days_2026-10-29') =>
    owner().doc(entryPath(OWNER, id)).set(data)

  it('with an extra field', async () => {
    await assertFails(write({ ...entry, note: 'hi' }))
  })

  it('with a wrong date format', async () => {
    await assertFails(write({ ...entry, date: '29-10-2026' }, 'office-days_29-10-2026'))
    await assertFails(write({ ...entry, date: '2026-10-1' }, 'office-days_2026-10-1'))
  })

  it('when the document id does not match its category and date', async () => {
    await assertFails(write(entry, 'office-days_2026-10-28'))
    await assertFails(write(entry, 'workout_2026-10-29'))
  })

  it('with an unknown source', async () => {
    await assertFails(write({ ...entry, source: 'script' }))
  })

  it('when checkedInAt is not a timestamp', async () => {
    await assertFails(write({ ...entry, checkedInAt: '2026-10-29T08:47:00Z' }))
  })
})
