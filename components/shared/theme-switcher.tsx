"use client";

import { useTheme, type AppTheme } from "@/providers/theme-provider";
import { Badge } from "@/components/ui/badge";
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
      id: "cobalt",
      name: "Midnight Cobalt",
      subtitle: "Deep Graphite + Electric Cobalt Blue (Default)",
      icon: Sparkles,
      accentColor: "#3B82F6",
      bgColor: "#0A0E17",
    },
    {
      id: "daylight",
      name: "iOS Porcelain",
      subtitle: "Crisp White + Apple System Blue",
      icon: Sun,
      accentColor: "#2563EB",
      bgColor: "#F8FAFC",
    },
    {
      id: "amber",
      name: "Titanium Amber",
      subtitle: "Warm Gunmetal + Precision Copper Gold",
      icon: Flame,
      accentColor: "#F59E0B",
      bgColor: "#110E0D",
    },
    {
      id: "mint",
      name: "Alpine Mint",
      subtitle: "Forest Slate + Muted Telemetry Mint",
      icon: Shield,
      accentColor: "#25C293",
      bgColor: "#0A1211",
    },
    {
      id: "crimson",
      name: "Track Rosso",
      subtitle: "Carbon Asphalt + Motorsport Crimson",
      icon: Zap,
      accentColor: "#EB3349",
      bgColor: "#0E0E0E",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
      {themes.map((t) => {
        const isSelected = theme === t.id;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setTheme(t.id)}
            className={`p-3.5 rounded-lg text-left transition-all border flex items-start gap-3 ios-touch ${
              isSelected
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border hover:border-foreground/25 bg-card"
            }`}
          >
            <div
              className="h-10 w-10 rounded-md flex items-center justify-center shrink-0 border border-border shadow-sm"
              style={{ backgroundColor: t.bgColor }}
            >
              <Icon className="h-4 w-4" style={{ color: t.accentColor }} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-xs text-foreground tracking-tight truncate">
                  {t.name}
                </span>
                {isSelected && (
                  <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
                    Active
                  </Badge>
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
