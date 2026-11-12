"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./auth-provider";
import { getScooters } from "@/lib/firestore";
import type { Scooter } from "@/lib/types";

interface ScooterContextType {
  scooter: Scooter | null;
  scooters: Scooter[];
  loadingScooter: boolean;
  refreshScooter: () => Promise<void>;
  setSelectedScooterId: (id: string) => void;
  activeFilterScooterId: string | undefined;
  viewAllVehicles: boolean;
  setViewAllVehicles: (v: boolean) => void;
}

const ScooterContext = createContext<ScooterContextType | undefined>(undefined);

export function ScooterProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [scooter, setScooter] = useState<Scooter | null>(null);
  const [scooters, setScooters] = useState<Scooter[]>([]);
  const [loadingScooter, setLoadingScooter] = useState(true);
  const [viewAllVehicles, setViewAllVehicles] = useState(false);

  const fetchScooters = useCallback(async () => {
    if (!user) {
      setScooter(null);
      setScooters([]);
      setLoadingScooter(false);
      return;
    }

    try {
      setLoadingScooter(true);
      const list = await getScooters(user.uid);
      setScooters(list);
      const savedId =
        typeof window !== "undefined" ? localStorage.getItem("active_scooter_id") : null;
      const preferred = savedId ? list.find((s) => s.id === savedId) : undefined;
      const def = preferred || list.find((s) => s.isDefault) || list[0] || null;
      setScooter(def);
    } catch (err) {
      console.error("Failed to load scooters:", err);
    } finally {
      setLoadingScooter(false);
    }
  }, [user]);

  useEffect(() => {
    fetchScooters();
  }, [fetchScooters]);

  const setSelectedScooterId = (id: string) => {
    const found = scooters.find((s) => s.id === id);
    if (found) {
      setScooter(found);
      setViewAllVehicles(false);
      if (typeof window !== "undefined") {
        localStorage.setItem("active_scooter_id", found.id);
      }
    }
  };

  // Only scope queries by scooterId when user owns multiple scooters and hasn't toggled "All Vehicles"
  const activeFilterScooterId =
    scooters.length > 1 && !viewAllVehicles ? scooter?.id : undefined;

  return (
    <ScooterContext.Provider
      value={{
        scooter,
        scooters,
        loadingScooter,
        refreshScooter: fetchScooters,
        setSelectedScooterId,
        activeFilterScooterId,
        viewAllVehicles,
        setViewAllVehicles,
      }}
    >
      {children}
    </ScooterContext.Provider>
  );
}

export function useScooter() {
  const context = useContext(ScooterContext);
  if (!context) {
    throw new Error("useScooter must be used within ScooterProvider");
  }
  return context;
}
