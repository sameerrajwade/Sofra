import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
  User as FirebaseUser,
} from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth } from '../config/firebase';

GoogleSignin.configure({
  webClientId: '939272773354-11lg42mo2i4uf42h2cga19ikrugd07mj.apps.googleusercontent.com',
});

export async function signUpWithEmail(
  email: string,
  password: string,
  name: string,
): Promise<FirebaseUser> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });
  return credential.user;
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<FirebaseUser> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function signInWithGoogle(): Promise<FirebaseUser> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const signInResult = await GoogleSignin.signIn();
  const idToken = signInResult.data?.idToken;
  if (!idToken) {
    throw new Error('Google sign-in failed: no ID token returned');
  }
  const googleCredential = GoogleAuthProvider.credential(idToken);
  const userCredential = await signInWithCredential(auth, googleCredential);
  return userCredential.user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
  try {
    await GoogleSignin.signOut();
  } catch {
    // Google sign-out may fail if user didn't sign in with Google
  }
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

export function onAuthStateChanged(
  callback: (user: FirebaseUser | null) => void,
): () => void {
  return firebaseOnAuthStateChanged(auth, callback);
}
