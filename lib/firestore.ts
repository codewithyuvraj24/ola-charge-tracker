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

// ─── Demo Data Seeder ────────────────────────────────────────

export async function seedDemoSessions(userId: string, scooter: Scooter): Promise<number> {
  const now = new Date();
  const demoRecords = [
    { daysAgo: 1, start: 18, end: 100, sOdo: 2180, eOdo: 2275, loc: "Home", notes: "Full overnight charge" },
    { daysAgo: 4, start: 25, end: 85, sOdo: 2110, eOdo: 2180, loc: "Office", notes: "Afternoon top-up" },
    { daysAgo: 7, start: 15, end: 95, sOdo: 2015, eOdo: 2110, loc: "Home", notes: "Weekend long ride recharge" },
    { daysAgo: 11, start: 30, end: 90, sOdo: 1945, eOdo: 2015, loc: "Ola Hypercharger", notes: "Quick coffee charge" },
    { daysAgo: 15, start: 22, end: 100, sOdo: 1850, eOdo: 1945, loc: "Home", notes: "Mid-month cycle" },
    { daysAgo: 21, start: 28, end: 100, sOdo: 1765, eOdo: 1850, loc: "Home", notes: "Routine charge" },
    { daysAgo: 28, start: 12, end: 90, sOdo: 1670, eOdo: 1765, loc: "Home", notes: "Late night plug-in" },
    { daysAgo: 38, start: 20, end: 100, sOdo: 1580, eOdo: 1670, loc: "Home", notes: "Monthly start" },
    { daysAgo: 46, start: 35, end: 85, sOdo: 1520, eOdo: 1580, loc: "Office", notes: "Quick work top-up" },
    { daysAgo: 55, start: 16, end: 100, sOdo: 1420, eOdo: 1520, loc: "Home", notes: "Full reset" },
    { daysAgo: 65, start: 24, end: 95, sOdo: 1335, eOdo: 1420, loc: "Home", notes: "Regular ride week" },
    { daysAgo: 78, start: 20, end: 100, sOdo: 1240, eOdo: 1335, loc: "Home", notes: "First month milestone" },
  ];

  for (const item of demoRecords) {
    const sessionDate = new Date(now);
    sessionDate.setDate(sessionDate.getDate() - item.daysAgo);

    await addChargingSession(
      userId,
      {
        date: sessionDate,
        startPercentage: item.start,
        endPercentage: item.end,
        electricityRate: scooter.electricityRate,
        startOdometer: item.sOdo,
        endOdometer: item.eOdo,
        location: item.loc,
        notes: item.notes,
      },
      scooter
    );
  }

  return demoRecords.length;
}
