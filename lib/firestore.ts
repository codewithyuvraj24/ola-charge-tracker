import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  Timestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Scooter, ChargingSession, ScooterFormData, SessionFormData, UserProfile } from "./types";
import { calculateSession } from "./calculations";

// ─── User Profile ────────────────────────────────────────────

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", userId));
  if (!snap.exists()) return null;
  return { uid: userId, ...snap.data() } as UserProfile;
}

export async function updateUserProfile(
  userId: string,
  data: Partial<Omit<UserProfile, "uid" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, "users", userId), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

// ─── Scooters ────────────────────────────────────────────────

export async function getScooters(userId: string): Promise<Scooter[]> {
  const ref = collection(db, "users", userId, "scooters");
  const snap = await getDocs(query(ref, orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Scooter);
}

export async function getDefaultScooter(userId: string): Promise<Scooter | null> {
  const scooters = await getScooters(userId);
  return scooters.find((s) => s.isDefault) || scooters[0] || null;
}

export async function addScooter(
  userId: string,
  data: ScooterFormData,
  isDefault: boolean = true
): Promise<string> {
  const now = Timestamp.now();
  const ref = collection(db, "users", userId, "scooters");
  const docRef = await addDoc(ref, {
    ...data,
    isDefault,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateScooter(
  userId: string,
  scooterId: string,
  data: Partial<ScooterFormData>
): Promise<void> {
  await updateDoc(doc(db, "users", userId, "scooters", scooterId), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

// ─── Charging Sessions ──────────────────────────────────────

export async function getChargingSessions(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<ChargingSession[]> {
  const ref = collection(db, "users", userId, "chargingSessions");
  let q;

  if (startDate && endDate) {
    q = query(
      ref,
      where("date", ">=", Timestamp.fromDate(startDate)),
      where("date", "<=", Timestamp.fromDate(endDate)),
      orderBy("date", "desc")
    );
  } else {
    q = query(ref, orderBy("date", "desc"));
  }

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ChargingSession);
}

export async function addChargingSession(
  userId: string,
  data: SessionFormData,
  scooter: Scooter
): Promise<string> {
  const calc = calculateSession(
    data.startPercentage,
    data.endPercentage,
    scooter.batteryCapacity,
    data.electricityRate,
    scooter.chargingLoss,
    typeof data.startOdometer === "number" ? data.startOdometer : undefined,
    typeof data.endOdometer === "number" ? data.endOdometer : undefined
  );

  const now = Timestamp.now();
  const ref = collection(db, "users", userId, "chargingSessions");
  const docRef = await addDoc(ref, {
    scooterId: scooter.id,
    date: Timestamp.fromDate(data.date),
    startPercentage: data.startPercentage,
    endPercentage: data.endPercentage,
    addedPercentage: calc.addedPercentage,
    batteryCapacity: scooter.batteryCapacity,
    energyStored: calc.energyStored,
    gridUnits: calc.gridUnits,
    electricityRate: data.electricityRate,
    chargingLoss: scooter.chargingLoss,
    totalCost: calc.totalCost,
    startOdometer: typeof data.startOdometer === "number" ? data.startOdometer : null,
    endOdometer: typeof data.endOdometer === "number" ? data.endOdometer : null,
    distanceTravelled: calc.distanceTravelled ?? null,
    location: data.location || null,
    notes: data.notes || null,
    createdAt: now,
    updatedAt: now,
  });

  // Update odometer on scooter if end odometer provided
  if (typeof data.endOdometer === "number" && data.endOdometer > 0) {
    await updateScooter(userId, scooter.id, { currentOdometer: data.endOdometer });
  }

  return docRef.id;
}

export async function updateChargingSession(
  userId: string,
  sessionId: string,
  data: SessionFormData,
  scooter: Scooter
): Promise<void> {
  const calc = calculateSession(
    data.startPercentage,
    data.endPercentage,
    scooter.batteryCapacity,
    data.electricityRate,
    scooter.chargingLoss,
    typeof data.startOdometer === "number" ? data.startOdometer : undefined,
    typeof data.endOdometer === "number" ? data.endOdometer : undefined
  );

  await updateDoc(doc(db, "users", userId, "chargingSessions", sessionId), {
    date: Timestamp.fromDate(data.date),
    startPercentage: data.startPercentage,
    endPercentage: data.endPercentage,
    addedPercentage: calc.addedPercentage,
    batteryCapacity: scooter.batteryCapacity,
    energyStored: calc.energyStored,
    gridUnits: calc.gridUnits,
    electricityRate: data.electricityRate,
    chargingLoss: scooter.chargingLoss,
    totalCost: calc.totalCost,
    startOdometer: typeof data.startOdometer === "number" ? data.startOdometer : null,
    endOdometer: typeof data.endOdometer === "number" ? data.endOdometer : null,
    distanceTravelled: calc.distanceTravelled ?? null,
    location: data.location || null,
    notes: data.notes || null,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteChargingSession(
  userId: string,
  sessionId: string
): Promise<void> {
  await deleteDoc(doc(db, "users", userId, "chargingSessions", sessionId));
}

// ─── Complete Onboarding ─────────────────────────────────────

export async function completeOnboarding(
  userId: string,
  scooterData: ScooterFormData
): Promise<void> {
  await addScooter(userId, scooterData, true);
  await updateDoc(doc(db, "users", userId), {
    onboardingComplete: true,
    updatedAt: Timestamp.now(),
  });
}

