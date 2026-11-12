"use client";

import { useTheme, type AppTheme } from "@/lib/theme-provider";
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
      id: "emerald",
      name: "EV Emerald",
      subtitle: "Deep Zinc + Clean Electric Green (Default)",
      icon: Sparkles,
      accentColor: "#22C55E",
      bgColor: "#09090B",
    },
    {
      id: "cyberpunk",
      name: "Hyper-Volt",
      subtitle: "Obsidian + Neon Lime (Ola MoveOS Hyper)",
      icon: Zap,
      accentColor: "#CCFF00",
      bgColor: "#08080A",
    },
    {
      id: "stealth",
      name: "Stealth Titanium",
      subtitle: "Space Slate + Crisp Ice Cyan",
      icon: Shield,
      accentColor: "#38BDF8",
      bgColor: "#0F1218",
    },
    {
      id: "solar",
      name: "Solar Sunset",
      subtitle: "Espresso Black + Warm Flame Amber",
      icon: Flame,
      accentColor: "#F97316",
      bgColor: "#100B09",
    },
    {
      id: "light",
      name: "Nordic Daylight",
      subtitle: "Crisp White + Racing Green",
      icon: Sun,
      accentColor: "#16A34A",
      bgColor: "#FFFFFF",
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
            {/* Color swatch preview */}
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

