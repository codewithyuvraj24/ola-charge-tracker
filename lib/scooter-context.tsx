"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./auth-context";
import { getDefaultScooter, getScooters } from "./firestore";
import type { Scooter } from "./types";

interface ScooterContextType {
  scooter: Scooter | null;
  scooters: Scooter[];
  loadingScooter: boolean;
  refreshScooter: () => Promise<void>;
  setSelectedScooterId: (id: string) => void;
}

const ScooterContext = createContext<ScooterContextType | undefined>(undefined);

export function ScooterProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [scooter, setScooter] = useState<Scooter | null>(null);
  const [scooters, setScooters] = useState<Scooter[]>([]);
  const [loadingScooter, setLoadingScooter] = useState(true);

  const fetchScooters = async () => {
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
      const def = list.find((s) => s.isDefault) || list[0] || null;
      setScooter(def);
    } catch (err) {
      console.error("Failed to load scooters:", err);
    } finally {
      setLoadingScooter(false);
    }
  };

  useEffect(() => {
    fetchScooters();
  }, [user]);

  const setSelectedScooterId = (id: string) => {
    const found = scooters.find((s) => s.id === id);
    if (found) setScooter(found);
  };

  return (
    <ScooterContext.Provider
      value={{
        scooter,
        scooters,
        loadingScooter,
        refreshScooter: fetchScooters,
        setSelectedScooterId,
      }}
    >
      {children}
    </ScooterContext.Provider>
  );
}

export function useScooter() {
  const context = useContext(ScooterContext);
  if (!context) {
    throw new Error("useScooter must be used within a ScooterProvider");
  }
  return context;
}
