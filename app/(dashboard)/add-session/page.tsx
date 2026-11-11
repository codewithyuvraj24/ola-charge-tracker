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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Zap,
  BatteryCharging,
  Gauge,
  MapPin,
  Calendar,
  IndianRupee,
  Loader2,
  Sparkles,
  ArrowRight,
  Info,
} from "lucide-react";
import { toast } from "sonner";

export default function AddSessionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { scooter } = useScooter();

  const [dateStr, setDateStr] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [startPct, setStartPct] = useState<number>(20);
  const [endPct, setEndPct] = useState<number>(100);
  const [rate, setRate] = useState<number>(scooter?.electricityRate || 12);
  const [startOdo, setStartOdo] = useState<string>(
    scooter?.currentOdometer ? String(scooter.currentOdometer) : ""
  );
  const [endOdo, setEndOdo] = useState<string>("");
  const [location, setLocation] = useState<string>("Home");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Quick preset percentages
  const handlePreset = (start: number, end: number) => {
    setStartPct(start);
    setEndPct(end);
  };

  // Real-time calculation engine
  const calc = useMemo(() => {
    const sPct = Number(startPct) || 0;
    const ePct = Number(endPct) || 0;
    const capacity = scooter?.batteryCapacity || 4;
    const loss = scooter?.chargingLoss ?? 10;
    const r = Number(rate) || 12;

    const sOdo = startOdo ? parseFloat(startOdo) : undefined;
    const eOdo = endOdo ? parseFloat(endOdo) : undefined;

    if (ePct <= sPct) {
      return null;
    }

    return calculateSession(sPct, ePct, capacity, r, loss, sOdo, eOdo);
  }, [startPct, endPct, rate, scooter, startOdo, endOdo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !scooter) {
      toast.error("Please configure a scooter first");
      return;
    }

    if (startPct < 0 || startPct > 100 || endPct < 0 || endPct > 100) {
      toast.error("Battery percentage must be between 0% and 100%");
      return;
    }

    if (endPct <= startPct) {
      toast.error("Ending battery percentage must be greater than starting percentage");
      return;
    }

    if (rate <= 0) {
      toast.error("Electricity rate must be positive");
      return;
    }

    const sOdoNum = startOdo ? parseFloat(startOdo) : undefined;
    const eOdoNum = endOdo ? parseFloat(endOdo) : undefined;

    if (sOdoNum !== undefined && eOdoNum !== undefined && eOdoNum < sOdoNum) {
      toast.error("Ending odometer cannot be less than starting odometer");
      return;
    }

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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <BatteryCharging className="h-4 w-4" />
          Session Tracker
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
          Record Charging Session
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Enter battery readings to calculate grid electricity and charging cost.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-border/60 shadow-md bg-card/80">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Charging Details</CardTitle>
              <CardDescription>
                Scooter: <span className="font-semibold text-foreground">{scooter?.name}</span> ({scooter?.model}, {scooter?.batteryCapacity} kWh)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form id="session-form" onSubmit={handleSubmit} className="space-y-5">
                {/* Date & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      Charging Date *
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={dateStr}
                      onChange={(e) => setDateStr(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      Location (Optional)
                    </Label>
                    <Input
                      id="location"
                      placeholder="e.g. Home, Office, Hypercharger"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                </div>

                {/* Battery Percentages */}
                <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border/60">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold text-sm">Battery Percentages *</Label>
                    <div className="flex gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px] px-2"
                        onClick={() => handlePreset(20, 80)}
                      >
                        20% → 80%
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px] px-2"
                        onClick={() => handlePreset(20, 100)}
                      >
                        20% → 100%
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px] px-2"
                        onClick={() => handlePreset(10, 100)}
                      >
                        10% → 100%
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <span className="text-xs text-muted-foreground">Starting Battery</span>
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          max="99"
                          value={startPct}
                          onChange={(e) => setStartPct(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                          className="pr-8 text-lg font-semibold"
                          required
                        />
                        <span className="absolute right-3 top-2.5 text-muted-foreground font-medium text-sm">
                          %
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs text-muted-foreground">Ending Battery</span>
                      <div className="relative">
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          value={endPct}
                          onChange={(e) => setEndPct(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                          className="pr-8 text-lg font-semibold text-primary"
                          required
                        />
                        <span className="absolute right-3 top-2.5 text-primary font-medium text-sm">
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Percentage progress bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>0%</span>
                      <span className="font-medium text-primary">
                        +{Math.max(0, endPct - startPct)}% charged
                      </span>
                      <span>100%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5 relative overflow-hidden">
                      <div
                        className="bg-primary h-2.5 rounded-full transition-all duration-300"
                        style={{
                          marginLeft: `${startPct}%`,
                          width: `${Math.max(0, endPct - startPct)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Electricity Rate */}
                <div className="space-y-2">
                  <Label htmlFor="rate" className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />
                      Electricity Rate (₹/kWh) *
                    </span>
                    <span className="text-xs text-muted-foreground font-normal">
                      Scooter default: ₹{scooter?.electricityRate}
                    </span>
                  </Label>
                  <Input
                    id="rate"
                    type="number"
                    step="0.5"
                    min="0.1"
                    max="100"
                    value={rate}
                    onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>

                {/* Odometer Readings */}
                <div className="space-y-3 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5">
                      <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                      Odometer Readings (Optional)
                    </Label>
                    <span className="text-[11px] text-muted-foreground">
                      Enables cost/km calculations
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <span className="text-xs text-muted-foreground">Start Odometer (km)</span>
                      <Input
                        type="number"
                        placeholder="e.g. 1200"
                        value={startOdo}
                        onChange={(e) => setStartOdo(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs text-muted-foreground">End Odometer (km)</span>
                      <Input
                        type="number"
                        placeholder="e.g. 1285"
                        value={endOdo}
                        onChange={(e) => setEndOdo(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes / Remarks</Label>
                  <Textarea
                    id="notes"
                    placeholder="e.g. Full charge before weekend highway ride"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Live Calculation Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-primary/30 shadow-xl bg-card/90 sticky top-4">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                  <Sparkles className="h-4 w-4" />
                  Live Calculation
                </div>
                <span className="text-[11px] text-muted-foreground">Formula verified</span>
              </div>
              <CardTitle className="text-xl">Session Summary</CardTitle>
              <CardDescription>
                Calculated dynamically from your inputs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {calc ? (
                <>
                  {/* Primary Big Metric: Total Cost */}
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center space-y-1">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Estimated Charging Cost
                    </div>
                    <div className="text-4xl font-extrabold text-primary">
                      {formatCurrency(calc.totalCost)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      at ₹{rate} per grid unit
                    </div>
                  </div>

                  {/* Breakdown Grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-lg bg-muted/40 border border-border/50 space-y-0.5">
                      <div className="text-[11px] text-muted-foreground">Battery Added</div>
                      <div className="text-lg font-bold text-foreground">
                        +{calc.addedPercentage}%
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {startPct}% → {endPct}%
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-muted/40 border border-border/50 space-y-0.5">
                      <div className="text-[11px] text-muted-foreground">Energy Stored</div>
                      <div className="text-lg font-bold text-foreground">
                        {formatNumber(calc.energyStored, 2)} <span className="text-xs font-normal">kWh</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        in battery pack
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-muted/40 border border-border/50 space-y-0.5">
                      <div className="text-[11px] text-muted-foreground">Grid Consumed</div>
                      <div className="text-lg font-bold text-primary">
                        {formatNumber(calc.gridUnits, 2)} <span className="text-xs font-normal">units</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        incl. {scooter?.chargingLoss}% loss
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-muted/40 border border-border/50 space-y-0.5">
                      <div className="text-[11px] text-muted-foreground">Distance</div>
                      <div className="text-lg font-bold text-foreground">
                        {calc.distanceTravelled !== undefined
                          ? `${calc.distanceTravelled} km`
                          : "—"}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {calc.distanceTravelled !== undefined && calc.distanceTravelled > 0
                          ? `₹${formatNumber(calc.totalCost / calc.distanceTravelled, 2)}/km`
                          : "No odometer"}
                      </div>
                    </div>
                  </div>

                  {/* Calculation formula explanation */}
                  <div className="p-3 rounded-lg bg-muted/20 border border-border/40 text-[11px] text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1 text-foreground font-semibold">
                      <Info className="h-3 w-3 text-primary" />
                      Exact Step-by-Step Math:
                    </div>
                    <div>1. Added % = {endPct}% - {startPct}% = {calc.addedPercentage}%</div>
                    <div>
                      2. Stored = ({calc.addedPercentage} / 100) × {scooter?.batteryCapacity} kWh = {formatNumber(calc.energyStored, 2)} kWh
                    </div>
                    <div>
                      3. Grid units = {formatNumber(calc.energyStored, 2)} ÷ (1 - {scooter?.chargingLoss}%) = {formatNumber(calc.gridUnits, 2)} kWh
                    </div>
                    <div>
                      4. Cost = {formatNumber(calc.gridUnits, 2)} × ₹{rate} = ₹{formatNumber(calc.totalCost, 2)}
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Ending percentage must be higher than starting percentage to calculate.
                </div>
              )}

              <Button
                type="submit"
                form="session-form"
                className="w-full text-base font-semibold py-6 shadow-md shadow-primary/20"
                disabled={submitting || !calc}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recording session...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Save Charging Record
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
