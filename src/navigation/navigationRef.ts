import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

// Ref used to navigate from outside React components — e.g. when the user taps
// a notification, we route to the matching screen.
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate(name: keyof RootStackParamList, params?: any) {
  if (navigationRef.isReady()) {
    (navigationRef.navigate as any)(name, params);
  }
}
