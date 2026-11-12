import type {
  CalculatedValues,
  ChargingSession,
  DashboardStats,
  LocationBreakdown,
  MonthlyData,
  SessionChartData,
} from "./types";

/**
 * Core calculation engine for charging sessions.
 *   batteryEnergy = ((endPct - startPct) / 100) × batteryCapacity
 *   gridEnergy    = batteryEnergy / (1 - chargingLoss / 100)
 *   chargingCost  = gridEnergy × electricityRate
 */
export function calculateSession(
  startPercentage: number,
  endPercentage: number,
  batteryCapacity: number,
  electricityRate: number,
  chargingLoss: number,
  startOdometer?: number,
  endOdometer?: number
): CalculatedValues {
  const addedPercentage = endPercentage - startPercentage;
  const energyStored = (addedPercentage / 100) * batteryCapacity;
  const lossFactor = 1 - chargingLoss / 100;
  const gridUnits = lossFactor > 0 ? energyStored / lossFactor : energyStored;
  const totalCost = gridUnits * electricityRate;

  let distanceTravelled: number | undefined;
  if (
    startOdometer !== undefined &&
    endOdometer !== undefined &&
    startOdometer > 0 &&
    endOdometer > 0
  ) {
    distanceTravelled = endOdometer - startOdometer;
    if (distanceTravelled < 0) distanceTravelled = undefined;
  }

  return {
    addedPercentage: round(addedPercentage, 2),
    energyStored: round(energyStored, 4),
    gridUnits: round(gridUnits, 4),
    totalCost: round(totalCost, 2),
    distanceTravelled: distanceTravelled !== undefined ? round(distanceTravelled, 1) : undefined,
  };
}

export function computeDashboardStats(sessions: ChargingSession[]): DashboardStats {
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      totalElectricity: 0,
      totalExpenditure: 0,
      averageCost: 0,
      averageAdded: 0,
      equivalentCycles: 0,
      totalDistance: 0,
      costPerKm: null,
      kmPerKwh: null,
    };
  }

  const totalSessions = sessions.length;
  const totalElectricity = sessions.reduce((sum, s) => sum + s.gridUnits, 0);
  const totalExpenditure = sessions.reduce((sum, s) => sum + s.totalCost, 0);
  const averageCost = totalExpenditure / totalSessions;
  const totalAddedPct = sessions.reduce((sum, s) => sum + s.addedPercentage, 0);
  const averageAdded = totalAddedPct / totalSessions;
  const equivalentCycles = totalAddedPct / 100;
  const totalDistance = sessions.reduce((sum, s) => sum + (s.distanceTravelled ?? 0), 0);
  const costPerKm = totalDistance > 0 ? totalExpenditure / totalDistance : null;

  // Efficiency computed strictly over odometer-tracked sessions for accuracy
  const odoSessions = sessions.filter((s) => (s.distanceTravelled ?? 0) > 0 && s.gridUnits > 0);
  const odoDistance = odoSessions.reduce((sum, s) => sum + (s.distanceTravelled ?? 0), 0);
  const odoGridUnits = odoSessions.reduce((sum, s) => sum + s.gridUnits, 0);
  const kmPerKwh = odoDistance > 0 && odoGridUnits > 0 ? odoDistance / odoGridUnits : null;

  return {
    totalSessions,
    totalElectricity: round(totalElectricity, 2),
    totalExpenditure: round(totalExpenditure, 2),
    averageCost: round(averageCost, 2),
    averageAdded: round(averageAdded, 1),
    equivalentCycles: round(equivalentCycles, 2),
    totalDistance: round(totalDistance, 1),
    costPerKm: costPerKm !== null ? round(costPerKm, 2) : null,
    kmPerKwh: kmPerKwh !== null ? round(kmPerKwh, 1) : null,
  };
}

export function computeMonthlyData(sessions: ChargingSession[]): MonthlyData[] {
  const map = new Map<string, MonthlyData>();

  for (const s of sessions) {
    const d = s.date.toDate();
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });

    if (!map.has(key)) {
      map.set(key, { month: label, expenditure: 0, electricity: 0, sessions: 0 });
    }
    const entry = map.get(key)!;
    entry.expenditure = round(entry.expenditure + s.totalCost, 2);
    entry.electricity = round(entry.electricity + s.gridUnits, 2);
    entry.sessions += 1;
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);
}

export function computeSessionChartData(sessions: ChargingSession[]): SessionChartData[] {
  return [...sessions]
    .sort((a, b) => a.date.toMillis() - b.date.toMillis())
    .map((s) => ({
      date: s.date.toDate().toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      cost: round(s.totalCost, 2),
      added: s.addedPercentage,
      gridUnits: round(s.gridUnits, 2),
    }));
}

export function computeLocationData(sessions: ChargingSession[]): LocationBreakdown[] {
  const map = new Map<string, LocationBreakdown>();

  for (const s of sessions) {
    const loc = (s.location || "Home").trim() || "Home";
    if (!map.has(loc)) {
      map.set(loc, { location: loc, expenditure: 0, electricity: 0, sessions: 0 });
    }
    const entry = map.get(loc)!;
    entry.expenditure = round(entry.expenditure + s.totalCost, 2);
    entry.electricity = round(entry.electricity + s.gridUnits, 2);
    entry.sessions += 1;
  }

  return Array.from(map.values()).sort((a, b) => b.expenditure - a.expenditure);
}

export function computeEvVsPetrolSavings(
  totalDistanceKm: number,
  totalEvCost: number,
  petrolPrice: number = 105,
  petrolMileage: number = 45
) {
  if (totalDistanceKm <= 0 || petrolMileage <= 0 || petrolPrice <= 0) {
    return { petrolCost: 0, netSavings: 0, hasDistance: false };
  }
  const petrolCost = round((totalDistanceKm / petrolMileage) * petrolPrice, 2);
  const netSavings = round(petrolCost - totalEvCost, 2);
  return { petrolCost, netSavings, hasDistance: true };
}

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
