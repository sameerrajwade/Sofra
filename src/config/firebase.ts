import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyCpsrRJzwrLWKZTdEmOGMLabD8LSc1dXNQ',
  authDomain: 'thaliplan.firebaseapp.com',
  projectId: 'thaliplan',
  storageBucket: 'thaliplan.firebasestorage.app',
  messagingSenderId: '349329204088',
  appId: '1:349329204088:web:1272792fed21678043de8d',
  measurementId: 'G-R5EYY7RDMX',
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
