import { getFirestore } from 'firebase/firestore'
import { firebaseApp } from './app'

/** The one Firestore instance, shared by the Firestore adapters. */
export const firestore = getFirestore(firebaseApp)
