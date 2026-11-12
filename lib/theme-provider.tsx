"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AppTheme = "emerald" | "cyberpunk" | "stealth" | "solar" | "light";

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyThemeToDocument(t: AppTheme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", t);
  if (t === "light") {
    root.classList.remove("dark");
  } else {
    root.classList.add("dark");
  }
}

export function ThemeProvider({
  children,
  defaultTheme = "emerald",
}: {
  children: ReactNode;
  defaultTheme?: AppTheme;
}) {
  const [theme, setThemeState] = useState<AppTheme>(defaultTheme);

  useEffect(() => {
    const stored = localStorage.getItem("app_theme") as AppTheme | null;
    const active = stored || defaultTheme;
    setThemeState(active);
    applyThemeToDocument(active);
  }, [defaultTheme]);

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    localStorage.setItem("app_theme", newTheme);
    applyThemeToDocument(newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        resolvedTheme: theme === "light" ? "light" : "dark",
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
