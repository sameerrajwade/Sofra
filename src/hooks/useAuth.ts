import { useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { onAuthStateChanged } from '../services/auth';
import { getUserProfile } from '../services/firestore';

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        store.setUser(
          profile || {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            avatarUrl: firebaseUser.photoURL || null,
            householdId: null,
            createdAt: new Date(),
          },
        );
      } else {
        store.setUser(null);
      }
    });

    return unsubscribe;
  }, []);

  return store;
}
