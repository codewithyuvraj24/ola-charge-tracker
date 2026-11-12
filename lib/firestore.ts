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
  writeBatch,
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

  // Clean undefined optional fields for Firestore compatibility
  const cleanData: Record<string, unknown> = {
    name: data.name,
    model: data.model,
    batteryCapacity: data.batteryCapacity,
    electricityRate: data.electricityRate,
    chargingLoss: data.chargingLoss,
    registrationNumber: data.registrationNumber || null,
    currentOdometer: typeof data.currentOdometer === "number" ? data.currentOdometer : null,
    isDefault,
    createdAt: now,
    updatedAt: now,
  };

  if (isDefault) {
    const existing = await getScooters(userId);
    if (existing.length > 0) {
      const batch = writeBatch(db);
      for (const s of existing) {
        if (s.isDefault) {
          batch.update(doc(db, "users", userId, "scooters", s.id), {
            isDefault: false,
            updatedAt: now,
          });
        }
      }
      await batch.commit();
    }
  }

  const docRef = await addDoc(ref, cleanData);
  return docRef.id;
}

export async function updateScooter(
  userId: string,
  scooterId: string,
  data: Partial<ScooterFormData>
): Promise<void> {
  const clean: Record<string, unknown> = { updatedAt: Timestamp.now() };
  if (data.name !== undefined) clean.name = data.name;
  if (data.model !== undefined) clean.model = data.model;
  if (data.batteryCapacity !== undefined) clean.batteryCapacity = data.batteryCapacity;
  if (data.electricityRate !== undefined) clean.electricityRate = data.electricityRate;
  if (data.chargingLoss !== undefined) clean.chargingLoss = data.chargingLoss;
  if (data.registrationNumber !== undefined) clean.registrationNumber = data.registrationNumber || null;
  if (data.currentOdometer !== undefined) clean.currentOdometer = data.currentOdometer ?? null;

  await updateDoc(doc(db, "users", userId, "scooters", scooterId), clean);
}

export async function setDefaultScooter(
  userId: string,
  scooterId: string
): Promise<void> {
  const scooters = await getScooters(userId);
  const batch = writeBatch(db);
  const now = Timestamp.now();
  for (const s of scooters) {
    batch.update(doc(db, "users", userId, "scooters", s.id), {
      isDefault: s.id === scooterId,
      updatedAt: now,
    });
  }
  await batch.commit();
}

export async function deleteScooter(
  userId: string,
  scooterId: string
): Promise<void> {
  await deleteDoc(doc(db, "users", userId, "scooters", scooterId));
}

// ─── Charging Sessions ──────────────────────────────────────

export async function getChargingSessions(
  userId: string,
  startDate?: Date,
  endDate?: Date,
  scooterId?: string
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
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ChargingSession);
  if (scooterId) {
    return list.filter((s) => s.scooterId === scooterId);
  }
  return list;
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

export async function importChargingSessions(
  userId: string,
  rows: SessionFormData[],
  scooter: Scooter
): Promise<number> {
  if (rows.length === 0) return 0;

  const ref = collection(db, "users", userId, "chargingSessions");
  const now = Timestamp.now();
  const chunkSize = 450;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const batch = writeBatch(db);
    const chunk = rows.slice(i, i + chunkSize);

    for (const row of chunk) {
      const calc = calculateSession(
        row.startPercentage,
        row.endPercentage,
        scooter.batteryCapacity,
        row.electricityRate,
        scooter.chargingLoss,
        typeof row.startOdometer === "number" ? row.startOdometer : undefined,
        typeof row.endOdometer === "number" ? row.endOdometer : undefined
      );

      const newDocRef = doc(ref);
      batch.set(newDocRef, {
        scooterId: scooter.id,
        date: Timestamp.fromDate(row.date),
        startPercentage: row.startPercentage,
        endPercentage: row.endPercentage,
        addedPercentage: calc.addedPercentage,
        batteryCapacity: scooter.batteryCapacity,
        energyStored: calc.energyStored,
        gridUnits: calc.gridUnits,
        electricityRate: row.electricityRate,
        chargingLoss: scooter.chargingLoss,
        totalCost: calc.totalCost,
        startOdometer: typeof row.startOdometer === "number" ? row.startOdometer : null,
        endOdometer: typeof row.endOdometer === "number" ? row.endOdometer : null,
        distanceTravelled: calc.distanceTravelled ?? null,
        location: row.location || null,
        notes: row.notes || null,
        createdAt: now,
        updatedAt: now,
      });
    }

    await batch.commit();
  }

  return rows.length;
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

export async function deleteChargingSessions(
  userId: string,
  sessionIds: string[]
): Promise<void> {
  if (sessionIds.length === 0) return;

  const chunkSize = 450;
  for (let i = 0; i < sessionIds.length; i += chunkSize) {
    const batch = writeBatch(db);
    const chunk = sessionIds.slice(i, i + chunkSize);
    for (const id of chunk) {
      batch.delete(doc(db, "users", userId, "chargingSessions", id));
    }
    await batch.commit();
  }
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
