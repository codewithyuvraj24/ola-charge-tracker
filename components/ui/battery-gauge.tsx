"use client";

import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BatteryCharging, Info } from "lucide-react";

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

  const totalTicks = 50;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <Card className="overflow-hidden border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary">
              <BatteryCharging className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2">
                Battery Pack Telemetry
                <Badge variant="secondary" className="font-mono-num text-[10px] font-medium">
                  {capacityKwh.toFixed(1)} kWh
                </Badge>
              </CardTitle>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono-num">
            <span>Loss {lossPct}%</span>
            <span>•</span>
            <span>₹{ratePerKwh}/kWh</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-muted-foreground hover:text-foreground">
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs text-xs">
                Grid energy accounts for {lossPct}% charger &amp; thermal conversion loss.
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* Segmented Hardware Battery Pack Visual */}
          <div className="space-y-2">
            <div className="relative p-1.5 rounded-lg border border-border bg-muted/40">
              <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-1 h-5 bg-border rounded-r-sm" />
              <div className="h-8 w-full flex gap-[2px] items-stretch overflow-hidden rounded-sm">
                {Array.from({ length: totalTicks }).map((_, i) => {
                  const tickPct = (i / totalTicks) * 100;
                  const isBaseCharge = tickPct < startPct;
                  const isAddedCharge = tickPct >= startPct && tickPct < endPct;

                  let cellClass = "bg-muted";
                  if (isBaseCharge) {
                    cellClass = "bg-muted-foreground/40";
                  } else if (isAddedCharge) {
                    cellClass = "bg-primary";
                  }

                  return (
                    <motion.div
                      key={i}
                      animate={{
                        opacity: isAddedCharge ? [0.8, 1, 0.8] : 1,
                      }}
                      transition={{
                        duration: 1.6,
                        repeat: isAddedCharge ? Infinity : 0,
                        delay: (i % 5) * 0.1,
                      }}
                      className={`flex-1 transition-colors duration-150 ${cellClass} rounded-[1px]`}
                      title={`${Math.round(tickPct)}%`}
                    />
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-num">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-sm bg-muted-foreground/40 inline-block" />
                  Start <strong className="text-foreground">{startPct}%</strong>
                </span>
                <span className="flex items-center gap-1.5 text-primary">
                  <span className="h-2 w-2 rounded-sm bg-primary inline-block" />
                  Added <strong>+{addedPct}%</strong>
                </span>
                <span className="text-foreground font-semibold">End {endPct}%</span>
              </div>

              <span className="text-[11px] text-muted-foreground">
                {((startPct / 100) * capacityKwh).toFixed(2)} → {((endPct / 100) * capacityKwh).toFixed(2)} kWh
              </span>
            </div>
          </div>

          {/* Interactive shadcn/ui Sliders */}
          {interactive && onRangeChange && (
            <>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 py-1">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">Start Battery</span>
                    <Badge variant="outline" className="font-mono-num text-xs">
                      {startPct}%
                    </Badge>
                  </div>
                  <Slider
                    min={0}
                    max={Math.max(0, endPct - 1)}
                    step={1}
                    value={[startPct]}
                    onValueChange={([val]) => onRangeChange(val, endPct)}
                    aria-label="Starting battery percentage"
                  />
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">Target Battery</span>
                    <Badge variant="default" className="font-mono-num text-xs">
                      {endPct}%
                    </Badge>
                  </div>
                  <Slider
                    min={Math.min(100, startPct + 1)}
                    max={100}
                    step={1}
                    value={[endPct]}
                    onValueChange={([val]) => onRangeChange(startPct, val)}
                    aria-label="Target battery percentage"
                  />
                </div>
              </div>
            </>
          )}

          {/* Readouts Grid */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Stored
              </div>
              <div className="mt-1 text-sm sm:text-base font-bold font-mono-num text-foreground">
                {storedKwh.toFixed(2)} <span className="text-[11px] font-normal text-muted-foreground">kWh</span>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Grid Drawn
              </div>
              <div className="mt-1 text-sm sm:text-base font-bold font-mono-num text-foreground">
                {gridKwh.toFixed(2)} <span className="text-[11px] font-normal text-muted-foreground">units</span>
              </div>
            </div>

            <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-center">
              <div className="text-[10px] font-medium uppercase tracking-wider text-primary">
                Est. Cost
              </div>
              <div className="mt-1 text-sm sm:text-base font-bold font-mono-num text-primary">
                ₹{cost.toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
