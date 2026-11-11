"use client";

import { useTheme, type AppTheme } from "@/lib/theme-provider";
import { Zap, Shield, Flame, Sun, Sparkles } from "lucide-react";

export function ThemePreviewSwitcher() {
  const { theme, setTheme } = useTheme();

  const themes: {
    id: AppTheme;
    name: string;
    subtitle: string;
    icon: typeof Zap;
    accentColor: string;
    bgColor: string;
  }[] = [
    {
      id: "cyberpunk",
      name: "⚡ Cyberpunk Hyper-Volt",
      subtitle: "Pitch Black + Electric Neon Lime (Ola MoveOS Hyper Mode)",
      icon: Zap,
      accentColor: "#CCFF00",
      bgColor: "#08080A",
    },
    {
      id: "stealth",
      name: "🏎️ Stealth Titanium",
      subtitle: "Space Gray + Crisp Ice Aqua (Porsche/Tesla Executive)",
      icon: Shield,
      accentColor: "#38BDF8",
      bgColor: "#10141C",
    },
    {
      id: "solar",
      name: "🌅 Solar Sunset",
      subtitle: "Warm Espresso + Flame Amber (Sporty Automotive)",
      icon: Flame,
      accentColor: "#FF6B35",
      bgColor: "#140D0A",
    },
    {
      id: "emerald",
      name: "🔋 Modern EV Emerald",
      subtitle: "Midnight Navy + High-Tech Green (Clean Energy)",
      icon: Sparkles,
      accentColor: "#10B981",
      bgColor: "#080D1A",
    },
    {
      id: "light",
      name: "💎 Nordic Daylight",
      subtitle: "Crisp Paper White + British Racing Green",
      icon: Sun,
      accentColor: "#059669",
      bgColor: "#F8FAFC",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
      {themes.map((t) => {
        const isSelected = theme === t.id;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setTheme(t.id)}
            className={`p-4 rounded-2xl text-left transition-all border-2 flex items-start gap-3.5 ios-pressable ${
              isSelected
                ? "border-primary shadow-lg shadow-primary/20 bg-muted/60"
                : "border-border/50 hover:border-border bg-card/60"
            }`}
          >
            {/* Color preview circle */}
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border border-white/10 shadow-sm"
              style={{ backgroundColor: t.bgColor }}
            >
              <div
                className="h-4 w-4 rounded-full shadow-md"
                style={{ backgroundColor: t.accentColor }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-foreground tracking-tight">
                  {t.name}
                </span>
                {isSelected && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                {t.subtitle}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

