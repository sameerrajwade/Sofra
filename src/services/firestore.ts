import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  increment,
  setDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  Meal,
  Dish,
  Restaurant,
  Household,
  User,
  UserPreferences,
} from '../types';

// ─── Helpers ───

function mealsCol(householdId: string) {
  return collection(db, `households/${householdId}/meals`);
}
function dishesCol(householdId: string) {
  return collection(db, `households/${householdId}/dishes`);
}
function restaurantsCol(householdId: string) {
  return collection(db, `households/${householdId}/restaurants`);
}

function toDate(ts: any): Date {
  return ts instanceof Timestamp ? ts.toDate() : new Date(ts);
}

function mealFromDoc(docSnap: any): Meal {
  const d = docSnap.data();
  return {
    ...d,
    id: docSnap.id,
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  } as Meal;
}

// ─── Meals ───

export async function addMeal(
  householdId: string,
  meal: Omit<Meal, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const now = Timestamp.now();
  const ref = await addDoc(mealsCol(householdId), {
    ...meal,
    householdId,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateMeal(
  householdId: string,
  mealId: string,
  data: Partial<Meal>,
): Promise<void> {
  const ref = doc(db, `households/${householdId}/meals`, mealId);
  await updateDoc(ref, { ...data, updatedAt: Timestamp.now() });
}

export async function deleteMeal(
  householdId: string,
  mealId: string,
): Promise<void> {
  await deleteDoc(doc(db, `households/${householdId}/meals`, mealId));
}

export async function getMealsByDateRange(
  householdId: string,
  startDate: string,
  endDate: string,
): Promise<Meal[]> {
  const q = query(
    mealsCol(householdId),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'asc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(mealFromDoc);
}

export async function getMealsByDate(
  householdId: string,
  date: string,
): Promise<Meal[]> {
  const q = query(mealsCol(householdId), where('date', '==', date));
  const snap = await getDocs(q);
  return snap.docs.map(mealFromDoc);
}

export async function getMealsForMonth(
  householdId: string,
  year: number,
  month: number,
): Promise<Meal[]> {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return getMealsByDateRange(householdId, start, end);
}

export async function getAllMeals(householdId: string): Promise<Meal[]> {
  const q = query(mealsCol(householdId), orderBy('date', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(mealFromDoc);
}

// ─── Dishes ───

export async function addDish(
  householdId: string,
  dish: Omit<Dish, 'id'>,
): Promise<string> {
  const ref = await addDoc(dishesCol(householdId), { ...dish, householdId });
  return ref.id;
}

export async function updateDish(
  householdId: string,
  dishId: string,
  data: Partial<Dish>,
): Promise<void> {
  await updateDoc(doc(db, `households/${householdId}/dishes`, dishId), data);
}

export async function getDishes(householdId: string): Promise<Dish[]> {
  const snap = await getDocs(dishesCol(householdId));
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Dish));
}

export async function getDishByName(
  householdId: string,
  name: string,
): Promise<Dish | null> {
  const q = query(dishesCol(householdId), where('name', '==', name));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { ...d.data(), id: d.id } as Dish;
}

export async function incrementDishCount(
  householdId: string,
  dishId: string,
  date: string,
): Promise<void> {
  const ref = doc(db, `households/${householdId}/dishes`, dishId);
  await updateDoc(ref, {
    timesCooked: increment(1),
    lastCookedDate: date,
  });
}

// ─── Restaurants ───

export async function addOrUpdateRestaurant(
  householdId: string,
  name: string,
  cuisineType: string,
  spend: number,
  date: string,
): Promise<void> {
  const q = query(restaurantsCol(householdId), where('name', '==', name));
  const snap = await getDocs(q);

  if (snap.empty) {
    await addDoc(restaurantsCol(householdId), {
      name,
      cuisineType,
      totalVisits: 1,
      totalSpend: spend,
      lastVisitDate: date,
      householdId,
    });
  } else {
    const existing = snap.docs[0];
    await updateDoc(existing.ref, {
      totalVisits: increment(1),
      totalSpend: increment(spend),
      lastVisitDate: date,
      cuisineType,
    });
  }
}

export async function getRestaurants(householdId: string): Promise<Restaurant[]> {
  const snap = await getDocs(restaurantsCol(householdId));
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Restaurant));
}

// ─── Households ───

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function createHousehold(
  name: string,
  userId: string,
): Promise<string> {
  const ref = await addDoc(collection(db, 'households'), {
    name,
    memberIds: [userId],
    adminId: userId,
    inviteCode: generateInviteCode(),
    createdAt: Timestamp.now(),
  });
  await updateDoc(doc(db, 'users', userId), { householdId: ref.id });
  return ref.id;
}

export async function joinHousehold(
  inviteCode: string,
  userId: string,
): Promise<string> {
  const q = query(
    collection(db, 'households'),
    where('inviteCode', '==', inviteCode),
  );
  const snap = await getDocs(q);
  if (snap.empty) throw new Error('Invalid invite code');

  const householdDoc = snap.docs[0];
  const data = householdDoc.data() as Household;
  if (data.memberIds.includes(userId)) {
    return householdDoc.id;
  }

  await updateDoc(householdDoc.ref, {
    memberIds: [...data.memberIds, userId],
  });
  await updateDoc(doc(db, 'users', userId), { householdId: householdDoc.id });
  return householdDoc.id;
}

export async function getHousehold(householdId: string): Promise<Household | null> {
  const snap = await getDoc(doc(db, 'households', householdId));
  if (!snap.exists()) return null;
  return { ...snap.data(), id: snap.id } as Household;
}

export async function updateHousehold(
  householdId: string,
  data: Partial<Household>,
): Promise<void> {
  await updateDoc(doc(db, 'households', householdId), data);
}

export async function getHouseholdMembers(householdId: string): Promise<User[]> {
  const household = await getHousehold(householdId);
  if (!household) return [];
  const members: User[] = [];
  for (const uid of household.memberIds) {
    const profile = await getUserProfile(uid);
    if (profile) members.push(profile);
  }
  return members;
}

// ─── Users ───

export async function createUserProfile(user: User): Promise<void> {
  await setDoc(doc(db, 'users', user.id), {
    ...user,
    createdAt: Timestamp.now(),
  });
}

export async function getUserProfile(userId: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', userId));
  if (!snap.exists()) return null;
  const d = snap.data();
  return { ...d, id: snap.id, createdAt: toDate(d.createdAt) } as User;
}

export async function updateUserProfile(
  userId: string,
  data: Partial<User>,
): Promise<void> {
  await updateDoc(doc(db, 'users', userId), data);
}

export async function getUserPreferences(
  userId: string,
): Promise<UserPreferences | null> {
  const snap = await getDoc(doc(db, 'users', userId, 'settings', 'preferences'));
  if (!snap.exists()) return null;
  return snap.data() as UserPreferences;
}

export async function updateUserPreferences(
  userId: string,
  prefs: Partial<UserPreferences>,
): Promise<void> {
  await setDoc(doc(db, 'users', userId, 'settings', 'preferences'), prefs, {
    merge: true,
  });
}
