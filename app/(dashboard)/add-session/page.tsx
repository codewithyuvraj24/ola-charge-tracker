"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useScooter } from "@/lib/scooter-context";
import { addChargingSession } from "@/lib/firestore";
import { calculateSession } from "@/lib/calculations";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Zap,
  BatteryCharging,
  Gauge,
  MapPin,
  Calendar,
  IndianRupee,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

export default function AddSessionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { scooter } = useScooter();

  const [dateStr, setDateStr] = useState(new Date().toISOString().split("T")[0]);
  const [startPct, setStartPct] = useState<number>(20);
  const [endPct, setEndPct] = useState<number>(100);
  const [rate, setRate] = useState<number>(scooter?.electricityRate || 12);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Optional fields inside drawer
  const [startOdo, setStartOdo] = useState<string>(
    scooter?.currentOdometer ? String(scooter.currentOdometer) : ""
  );
  const [endOdo, setEndOdo] = useState<string>("");
  const [location, setLocation] = useState<string>("Home");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const calc = useMemo(() => {
    const sPct = Number(startPct) || 0;
    const ePct = Number(endPct) || 0;
    const capacity = scooter?.batteryCapacity || 4;
    const loss = scooter?.chargingLoss ?? 10;
    const r = Number(rate) || 12;

    const sOdo = startOdo ? parseFloat(startOdo) : undefined;
    const eOdo = endOdo ? parseFloat(endOdo) : undefined;

    if (ePct <= sPct) return null;
    return calculateSession(sPct, ePct, capacity, r, loss, sOdo, eOdo);
  }, [startPct, endPct, rate, scooter, startOdo, endOdo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !scooter) return;

    if (endPct <= startPct) {
      toast.error("Ending percentage must be higher than starting percentage");
      return;
    }

    const sOdoNum = startOdo ? parseFloat(startOdo) : undefined;
    const eOdoNum = endOdo ? parseFloat(endOdo) : undefined;

    setSubmitting(true);
    try {
      await addChargingSession(
        user.uid,
        {
          date: new Date(dateStr),
          startPercentage: startPct,
          endPercentage: endPct,
          electricityRate: rate,
          startOdometer: sOdoNum,
          endOdometer: eOdoNum,
          location: location.trim() || undefined,
          notes: notes.trim() || undefined,
        },
        scooter
      );

      toast.success("Charging session logged successfully!");
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to record session";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <BatteryCharging className="h-4 w-4" />
          Quick Charge Log
        </div>
        <h1 className="text-2xl font-bold tracking-tight mt-1">Record Plug-in</h1>
        <p className="text-xs text-muted-foreground">
          {scooter?.name} • {scooter?.batteryCapacity} kWh pack
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Main Battery Selector Card (iOS 17 Focused) */}
        <Card className="ios-glass-card p-5 space-y-4">
          {/* Quick presets */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Battery Level</span>
            <div className="flex gap-1">
              {[
                { s: 20, e: 80 },
                { s: 20, e: 100 },
                { s: 10, e: 100 },
              ].map((p) => (
                <button
                  key={`${p.s}-${p.e}`}
                  type="button"
                  onClick={() => {
                    setStartPct(p.s);
                    setEndPct(p.e);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted font-medium text-muted-foreground hover:text-foreground transition-all ios-pressable"
                >
                  {p.s}% ➔ {p.e}%
                </button>
              ))}
            </div>
          </div>

          {/* Start and End inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Start Level</span>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="99"
                  value={startPct}
                  onChange={(e) => setStartPct(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                  className="rounded-xl h-12 text-xl font-extrabold pr-8"
                  required
                />
                <span className="absolute right-3 top-3.5 text-xs text-muted-foreground font-bold">%</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">End Level</span>
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={endPct}
                  onChange={(e) => setEndPct(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                  className="rounded-xl h-12 text-xl font-extrabold text-primary pr-8"
                  required
                />
                <span className="absolute right-3 top-3.5 text-xs text-primary font-bold">%</span>
              </div>
            </div>
          </div>

          {/* Glowing Battery Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="w-full bg-muted/70 rounded-full h-3 relative overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-3 rounded-full transition-all duration-300 shadow-sm shadow-emerald-500/50"
                style={{
                  marginLeft: `${startPct}%`,
                  width: `${Math.max(0, endPct - startPct)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>{startPct}%</span>
              <span className="font-bold text-primary">+{Math.max(0, endPct - startPct)}% charged</span>
              <span>{endPct}%</span>
            </div>
          </div>
        </Card>

        {/* Live Cost Output Hero Card */}
        {calc && (
          <Card className="ios-glass-card border-primary/30 p-5 text-center space-y-3">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Calculated Charging Bill
            </div>
            <div className="text-4xl font-black text-primary tracking-tight">
              {formatCurrency(calc.totalCost)}
            </div>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border/40">
              <span>⚡ {formatNumber(calc.gridUnits, 2)} grid units</span>
              <span>•</span>
              <span>🔋 {formatNumber(calc.energyStored, 2)} kWh stored</span>
              <span>•</span>
              <span>₹{rate}/unit</span>
            </div>
          </Card>
        )}

        {/* Collapsible Advanced Options (Odometer, Notes, Date) */}
        <div className="rounded-2xl ios-glass overflow-hidden border border-border/50">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full p-4 flex items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors ios-pressable"
          >
            <span>More Options (Odometer, Location, Notes)</span>
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showAdvanced && (
            <div className="p-4 pt-0 space-y-4 border-t border-border/40 text-xs">
              <div className="grid grid-cols-2 gap-3 pt-3">
                <div className="space-y-1">
                  <Label className="text-xs">Date</Label>
                  <Input
                    type="date"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    className="rounded-xl h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Rate (₹/kWh)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={rate}
                    onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                    className="rounded-xl h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Start Odo (km)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 1200"
                    value={startOdo}
                    onChange={(e) => setStartOdo(e.target.value)}
                    className="rounded-xl h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">End Odo (km)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 1285"
                    value={endOdo}
                    onChange={(e) => setEndOdo(e.target.value)}
                    className="rounded-xl h-10"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Location</Label>
                <Input
                  placeholder="e.g. Home, Office, Hypercharger"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="rounded-xl h-10"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Notes</Label>
                <Textarea
                  placeholder="Optional ride remarks"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="rounded-xl"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={submitting || !calc}
          className="w-full rounded-2xl h-14 text-base font-bold shadow-lg shadow-primary/25 ios-pressable"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Save Charging Record
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
