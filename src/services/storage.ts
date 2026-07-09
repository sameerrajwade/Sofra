import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '../config/firebase';

export async function uploadProfilePicture(
  userId: string,
  uri: string,
): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  const storageRef = ref(storage, `avatars/${userId}`);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}

export async function deleteProfilePicture(userId: string): Promise<void> {
  const storageRef = ref(storage, `avatars/${userId}`);
  await deleteObject(storageRef);
}
