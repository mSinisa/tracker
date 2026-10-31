import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth'
import type { ForSigningIn, User } from '@/core/ports/out'
import { firebaseApp } from '../firebase/app'

/** Translates Firebase's user object into the core's own User type. */
function toUser(user: FirebaseUser): User {
  return { uid: user.uid, name: user.displayName }
}

/** The driven adapter for ForSigningIn: Google sign-in through Firebase Authentication. */
export class GoogleAuth implements ForSigningIn {
  private readonly auth = getAuth(firebaseApp)

  currentUser(): User | null {
    const user = this.auth.currentUser
    return user ? toUser(user) : null
  }

  async signIn(): Promise<User> {
    const result = await signInWithPopup(this.auth, new GoogleAuthProvider())
    return toUser(result.user)
  }

  signOut(): Promise<void> {
    return firebaseSignOut(this.auth)
  }

  onChange(listener: (user: User | null) => void): () => void {
    return onAuthStateChanged(this.auth, (user) => listener(user ? toUser(user) : null))
  }
}
