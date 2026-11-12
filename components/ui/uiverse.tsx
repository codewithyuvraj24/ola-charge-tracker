"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

/**
 * Uiverse-inspired tactile primary CTA with specular top edge and directional sheen.
 * Strictly themed using shadcn/ui `--primary` & `--primary-foreground` tokens.
 */
export interface ChargePulseButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  size?: "sm" | "md" | "lg";
}

export const ChargePulseButton = React.forwardRef<
  HTMLButtonElement,
  ChargePulseButtonProps
>(({ className, children, loading = false, disabled, size = "md", ...props }, ref) => {
  const sizeClasses =
    size === "sm"
      ? "h-8 px-3.5 text-xs rounded-md"
      : size === "lg"
      ? "h-12 px-7 text-sm sm:text-base rounded-lg"
      : "h-10 px-4 text-sm rounded-md";

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "uiverse-shine-btn inline-flex items-center justify-center gap-2 font-semibold",
        "bg-primary text-primary-foreground border border-primary/80",
        "hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50 ios-touch select-none",
        sizeClasses,
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
      {children}
    </button>
  );
});
ChargePulseButton.displayName = "ChargePulseButton";

/**
 * Uiverse-inspired segmented EV battery cell loader.
 */
export function BatteryChargeLoader({
  label = "Syncing telemetry...",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="relative flex items-center">
        <div className="flex items-center gap-1 rounded-md border border-border bg-card p-1.5 shadow-sm">
          <span className="h-5 w-2 rounded-[2px] bg-primary uiverse-cell-1" />
          <span className="h-5 w-2 rounded-[2px] bg-primary uiverse-cell-2" />
          <span className="h-5 w-2 rounded-[2px] bg-primary uiverse-cell-3" />
          <span className="h-5 w-2 rounded-[2px] bg-primary uiverse-cell-4" />
        </div>
        <div className="h-2.5 w-1 rounded-r-sm bg-border" />
      </div>
      {label && (
        <span className="text-xs font-medium text-muted-foreground tracking-tight">
          {label}
        </span>
      )}
    </div>
  );
}

/**
 * Uiverse-inspired live telemetry beacon pill.
 */
export function LiveStatusPill({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-foreground shadow-sm",
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
      </span>
      <span>{label}</span>
    </div>
  );
}

/**
 * Uiverse-inspired mechanical detent toggle switch (iOS/automotive friendly).
 */
export function TactileSwitch({
  checked,
  onCheckedChange,
  label,
  id,
  className,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  id?: string;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ios-touch",
          checked
            ? "bg-primary border-primary"
            : "bg-muted border-border"
        )}
      >
        <span
          className={cn(
            "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-md ring-0 transition-transform duration-200",
            checked ? "translate-x-[22px]" : "translate-x-[3px]"
          )}
        />
      </button>
      {label && (
        <label
          htmlFor={id}
          onClick={() => onCheckedChange(!checked)}
          className="text-xs font-medium text-muted-foreground cursor-pointer select-none"
        >
          {label}
        </label>
      )}
    </div>
  );
}

/**
 * Uiverse-inspired hairline spotlight card that reveals a subtle primary radial glow under the pointer.
 */
export function SpotlightCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [coords, setCoords] = React.useState<{ x: number; y: number } | null>(null);

  return (
    <div
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setCoords({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }}
      onMouseLeave={() => setCoords(null)}
      className={cn(
        "uiverse-spotlight-card rounded-xl border border-border bg-card text-card-foreground shadow-sm",
        className
      )}
    >
      {coords && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-px transition-opacity duration-300"
          style={{
            background: `radial-gradient(280px circle at ${coords.x}px ${coords.y}px, hsl(var(--primary) / 0.11), transparent 70%)`,
          }}
        />
      )}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
