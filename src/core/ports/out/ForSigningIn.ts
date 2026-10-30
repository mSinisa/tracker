export interface User {
  uid: string
  name: string | null
}

/** Sign-in, kept behind a port so the core never imports Firebase. */
export interface ForSigningIn {
  currentUser(): User | null
  signIn(): Promise<User>
  signOut(): Promise<void>
  onChange(listener: (user: User | null) => void): () => void // returns an unsubscribe function
}
