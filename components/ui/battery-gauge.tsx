"use client";

import { useMemo } from "react";

interface BatteryGaugeProps {
  startPct: number;
  endPct: number;
  capacityKwh: number;
  lossPct: number;
  ratePerKwh: number;
  onRangeChange?: (start: number, end: number) => void;
  interactive?: boolean;
}

export function VisualBatteryGauge({
  startPct,
  endPct,
  capacityKwh,
  lossPct,
  ratePerKwh,
  onRangeChange,
  interactive = false,
}: BatteryGaugeProps) {
  const addedPct = Math.max(0, endPct - startPct);
  const storedKwh = (addedPct / 100) * capacityKwh;
  const gridKwh = lossPct < 100 ? storedKwh / (1 - lossPct / 100) : storedKwh;
  const cost = gridKwh * ratePerKwh;

  // 100 vertical cell ticks for high precision telemetry
  const totalTicks = 50;

  return (
    <div className="linear-box p-4 space-y-4 font-mono-num">
      {/* Top Telemetry Header */}
      <div className="flex items-center justify-between text-xs pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-foreground tracking-tight">BATTERY PACK TELEMETRY</span>
          <span className="text-muted-foreground">({capacityKwh.toFixed(1)} kWh)</span>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
          <span>LOSS: {lossPct}%</span>
          <span>•</span>
          <span>RATE: ₹{ratePerKwh}/kWh</span>
        </div>
      </div>

      {/* Visual Hardware Battery Pack Chassis */}
      <div className="space-y-2">
        <div className="relative p-1.5 rounded-md border border-border bg-black/60">
          {/* Hardware terminal tip */}
          <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-border rounded-r-xs" />

          {/* Segmented Cell Bar */}
          <div className="h-9 w-full flex gap-[2px] items-stretch overflow-hidden">
            {Array.from({ length: totalTicks }).map((_, i) => {
              const tickPct = (i / totalTicks) * 100;
              const isBaseCharge = tickPct < startPct;
              const isAddedCharge = tickPct >= startPct && tickPct < endPct;

              let cellColor = "bg-zinc-900";
              if (isBaseCharge) {
                cellColor = "bg-zinc-600";
              } else if (isAddedCharge) {
                cellColor = "bg-emerald-500";
              }

              return (
                <div
                  key={i}
                  className={`flex-1 transition-colors duration-150 ${cellColor} rounded-[1px]`}
                  title={`${Math.round(tickPct)}%`}
                />
              );
            })}
          </div>
        </div>

        {/* Precise Legend & Readings */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 rounded-xs bg-zinc-600 inline-block" />
              Start: <strong className="text-foreground">{startPct}%</strong>
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="h-2 w-2 rounded-xs bg-emerald-500 inline-block" />
              Added: <strong>+{addedPct}%</strong>
            </span>
            <span className="flex items-center gap-1.5 text-foreground font-semibold">
              End: <strong>{endPct}%</strong>
            </span>
          </div>

          <div className="text-right text-[11px] text-muted-foreground">
            {((startPct / 100) * capacityKwh).toFixed(2)} kWh → {((endPct / 100) * capacityKwh).toFixed(2)} kWh
          </div>
        </div>
      </div>

      {/* Interactive Quick Sliders if enabled */}
      {interactive && onRangeChange && (
        <div className="pt-2 border-t border-border space-y-3">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between text-muted-foreground text-[11px]">
                <span>START SOC</span>
                <span className="text-foreground font-semibold">{startPct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.max(0, endPct - 1)}
                value={startPct}
                onChange={(e) => onRangeChange(parseInt(e.target.value) || 0, endPct)}
                className="w-full h-1.5 bg-zinc-800 rounded-sm appearance-none cursor-pointer accent-zinc-300"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-muted-foreground text-[11px]">
                <span>TARGET SOC</span>
                <span className="text-emerald-400 font-semibold">{endPct}%</span>
              </div>
              <input
                type="range"
                min={startPct + 1}
                max="100"
                value={endPct}
                onChange={(e) => onRangeChange(startPct, parseInt(e.target.value) || 100)}
                className="w-full h-1.5 bg-zinc-800 rounded-sm appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Engineering Calculations Strip */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border text-center text-xs">
        <div className="p-2 rounded bg-zinc-950/60 border border-border/60">
          <div className="text-[10px] text-muted-foreground uppercase">Pack Energy Stored</div>
          <div className="text-sm font-bold text-foreground mt-0.5">
            {storedKwh.toFixed(2)} <span className="text-[10px] font-normal text-muted-foreground">kWh</span>
          </div>
        </div>

        <div className="p-2 rounded bg-zinc-950/60 border border-border/60">
          <div className="text-[10px] text-muted-foreground uppercase">Grid Power Drawn</div>
          <div className="text-sm font-bold text-foreground mt-0.5">
            {gridKwh.toFixed(2)} <span className="text-[10px] font-normal text-muted-foreground">units</span>
          </div>
        </div>

        <div className="p-2 rounded bg-emerald-950/30 border border-emerald-900/50">
          <div className="text-[10px] text-emerald-400 uppercase">Estimated Tariff</div>
          <div className="text-sm font-bold text-emerald-400 mt-0.5">
            ₹{cost.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
