import { Timestamp } from "firebase/firestore";

// ─── Tariff Presets ──────────────────────────────────────────
export interface TariffPreset {
  id: string;
  label: string;
  location: string;
  rate: number;
}

export const DEFAULT_TARIFF_PRESETS: TariffPreset[] = [
  { id: "home", label: "Home Plug", location: "Home", rate: 12 },
  { id: "office", label: "Office Free", location: "Office", rate: 0 },
  { id: "hyper", label: "Hypercharger", location: "Ola Hypercharger", rate: 18 },
];

// ─── User ────────────────────────────────────────────────────
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  currency: string;
  theme: "light" | "dark" | "system";
  onboardingComplete: boolean;
  monthlyBudget?: number;
  petrolPrice?: number;
  petrolMileage?: number;
  tariffPresets?: TariffPreset[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Scooter ─────────────────────────────────────────────────
export interface Scooter {
  id: string;
  name: string;
  model: string;
  batteryCapacity: number; // kWh
  electricityRate: number; // per kWh
  chargingLoss: number;    // percentage (0-100)
  registrationNumber?: string;
  currentOdometer?: number;
  isDefault: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ScooterFormData {
  name: string;
  model: string;
  batteryCapacity: number;
  electricityRate: number;
  chargingLoss: number;
  registrationNumber?: string;
  currentOdometer?: number;
}

// ─── Charging Session ────────────────────────────────────────
export interface ChargingSession {
  id: string;
  scooterId: string;
  date: Timestamp;
  startPercentage: number;
  endPercentage: number;
  addedPercentage: number;
  batteryCapacity: number;
  energyStored: number;     // kWh
  gridUnits: number;        // kWh
  electricityRate: number;  // per kWh
  chargingLoss: number;     // percentage
  totalCost: number;
  startOdometer?: number;
  endOdometer?: number;
  distanceTravelled?: number;
  location?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SessionFormData {
  date: Date;
  startPercentage: number;
  endPercentage: number;
  electricityRate: number;
  startOdometer?: number;
  endOdometer?: number;
  location?: string;
  notes?: string;
}

// ─── Calculated Values ──────────────────────────────────────
export interface CalculatedValues {
  addedPercentage: number;
  energyStored: number;
  gridUnits: number;
  totalCost: number;
  distanceTravelled?: number;
}

// ─── Dashboard Stats ─────────────────────────────────────────
export interface DashboardStats {
  totalSessions: number;
  totalElectricity: number;
  totalExpenditure: number;
  averageCost: number;
  averageAdded: number;
  equivalentCycles: number;
  totalDistance: number;
  costPerKm: number | null;
  kmPerKwh: number | null;
}

// ─── Chart & Breakdown Data ──────────────────────────────────
export interface MonthlyData {
  month: string;
  expenditure: number;
  electricity: number;
  sessions: number;
}

export interface SessionChartData {
  date: string;
  cost: number;
  added: number;
  gridUnits: number;
}

export interface LocationBreakdown {
  location: string;
  expenditure: number;
  electricity: number;
  sessions: number;
}

// ─── Defaults ────────────────────────────────────────────────
export const DEFAULT_SCOOTER: ScooterFormData = {
  name: "My Ola S1 Pro",
  model: "Ola S1 Pro Gen 2",
  batteryCapacity: 4,
  electricityRate: 12,
  chargingLoss: 10,
};

export const SCOOTER_MODELS = [
  "Ola S1 Pro Gen 2",
  "Ola S1 Pro Gen 1",
  "Ola S1 Air",
  "Ola S1 X+",
  "Ola S1 X",
  "Ola Roadster",
  "Ola Roadster X",
  "Ola Roadster Pro",
  "Other EV",
];

export type DateFilter = "7d" | "30d" | "3m" | "6m" | "1y" | "all" | "custom";

export const DATE_FILTER_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "3m", label: "Last 3 months" },
  { value: "6m", label: "Last 6 months" },
  { value: "1y", label: "This year" },
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom" },
];
