"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useScooter } from "@/lib/scooter-context";
import { addChargingSession, getChargingSessions } from "@/lib/firestore";
import { calculateSession } from "@/lib/calculations";
import { toLocalDateInputValue, parseLocalDateInput } from "@/lib/utils";
import { DEFAULT_TARIFF_PRESETS } from "@/lib/types";
import { VisualBatteryGauge } from "@/components/ui/battery-gauge";
import { ChargePulseButton } from "@/components/ui/uiverse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Zap, BatteryCharging, MapPin } from "lucide-react";
import { toast } from "sonner";

export default function AddSessionPage() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { scooter, refreshScooter } = useScooter();

  const currency = userProfile?.currency || "₹";
  const presets = userProfile?.tariffPresets?.length
    ? userProfile.tariffPresets
    : DEFAULT_TARIFF_PRESETS;

  const [dateStr, setDateStr] = useState(() => toLocalDateInputValue());
  const [startPct, setStartPct] = useState<number>(20);
  const [endPct, setEndPct] = useState<number>(100);
  const [rate, setRate] = useState<number>(scooter?.electricityRate || 12);

  const [startOdo, setStartOdo] = useState<string>(
    scooter?.currentOdometer ? String(scooter.currentOdometer) : ""
  );
  const [lastOdoHint, setLastOdoHint] = useState<number | null>(
    scooter?.currentOdometer ?? null
  );
  const [endOdo, setEndOdo] = useState<string>("");
  const [location, setLocation] = useState<string>("Home");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Sync scooter tariff & smart odometer auto-fill from latest session
  const activeScooterId = scooter?.id;
  const activeScooterRate = scooter?.electricityRate;
  const activeScooterOdometer = scooter?.currentOdometer;

  useEffect(() => {
    if (activeScooterRate !== undefined) {
      setRate(activeScooterRate);
    }
    if (activeScooterOdometer) {
      setStartOdo((prev) => prev || String(activeScooterOdometer));
      setLastOdoHint(activeScooterOdometer);
    }
  }, [activeScooterId, activeScooterRate, activeScooterOdometer]);

  useEffect(() => {
    async function loadLatestOdo() {
      if (!user || !activeScooterId) return;
      try {
        const list = await getChargingSessions(user.uid, undefined, undefined, activeScooterId);
        const withOdo = list.find((s) => typeof s.endOdometer === "number" && s.endOdometer > 0);
        const bestOdo = withOdo?.endOdometer ?? activeScooterOdometer ?? null;
        if (bestOdo) {
          setStartOdo((prev) => prev || String(bestOdo));
        }
        setLastOdoHint(bestOdo);
      } catch {
        // Non-fatal smart helper
      }
    }
    loadLatestOdo();
  }, [user, activeScooterId, activeScooterOdometer]);

  const calc = useMemo(() => {
    const sPct = Number(startPct) || 0;
    const ePct = Number(endPct) || 0;
    const capacity = scooter?.batteryCapacity || 4;
    const loss = scooter?.chargingLoss ?? 10;
    const r = Number(rate) || 0;

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

    if (sOdoNum !== undefined && eOdoNum !== undefined && eOdoNum < sOdoNum) {
      toast.error("Ending odometer cannot be less than starting odometer");
      return;
    }

    setSubmitting(true);
    try {
      await addChargingSession(
        user.uid,
        {
          date: parseLocalDateInput(dateStr),
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

      await refreshScooter();
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
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <BatteryCharging className="h-4 w-4" />
          Session Tracker
        </div>
        <h1 className="text-2xl font-bold tracking-tight mt-1">Record Charging Session</h1>
        <p className="text-xs text-muted-foreground">
          {scooter?.name} • {scooter?.model} ({scooter?.batteryCapacity} kWh)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Location & Tariff Presets */}
        <Card>
          <CardContent className="p-3.5 sm:p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                Location &amp; Tariff Preset
              </span>
              <Badge variant="outline" className="font-mono-num text-[10px]">
                {location || "Custom"} • {currency}{rate}/kWh
              </Badge>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p) => {
                const isSelected =
                  location.toLowerCase() === p.location.toLowerCase() &&
                  Number(rate) === Number(p.rate);
                return (
                  <Button
                    key={p.id}
                    type="button"
                    size="sm"
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => {
                      setLocation(p.location);
                      setRate(p.rate);
                    }}
                    className="h-8 px-2.5 text-xs ios-touch"
                  >
                    <span>{p.label}</span>
                    <span className="ml-1.5 font-mono-num opacity-80">
                      {currency}{p.rate}
                    </span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Live shadcn/ui Interactive Battery Pack Gauge */}
        <VisualBatteryGauge
          startPct={startPct}
          endPct={endPct}
          capacityKwh={scooter?.batteryCapacity || 4}
          lossPct={scooter?.chargingLoss ?? 10}
          ratePerKwh={rate}
          currency={currency}
          onRangeChange={(s, e) => {
            setStartPct(s);
            setEndPct(e);
          }}
          interactive={true}
        />

        {/* Direct Numeric Inputs + Presets */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">Exact Readings</CardTitle>
                <CardDescription className="text-xs">
                  Type exact values or tap a quick preset
                </CardDescription>
              </div>
              <div className="flex gap-1.5">
                {[
                  { s: 20, e: 80 },
                  { s: 20, e: 100 },
                  { s: 10, e: 100 },
                ].map((p) => (
                  <Button
                    key={`${p.s}-${p.e}`}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStartPct(p.s);
                      setEndPct(p.e);
                    }}
                    className="h-7 px-2.5 text-xs font-mono-num"
                  >
                    {p.s}%→{p.e}%
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="start-pct">Start Battery (%)</Label>
                <Input
                  id="start-pct"
                  type="number"
                  min="0"
                  max="99"
                  value={startPct}
                  onChange={(e) =>
                    setStartPct(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))
                  }
                  className="font-mono-num font-semibold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="end-pct">End Battery (%)</Label>
                <Input
                  id="end-pct"
                  type="number"
                  min="1"
                  max="100"
                  value={endPct}
                  onChange={(e) =>
                    setEndPct(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))
                  }
                  className="font-mono-num font-semibold text-primary"
                  required
                />
              </div>
            </div>

            {/* shadcn/ui Accordion for Optional Details */}
            <Accordion type="single" collapsible className="w-full border-t border-border pt-1">
              <AccordionItem value="more-options" className="border-b-0">
                <AccordionTrigger className="py-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:no-underline">
                  More Options (Date, Tariff, Odometer, Location &amp; Notes)
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="session-date">Charging Date</Label>
                      <Input
                        id="session-date"
                        type="date"
                        value={dateStr}
                        onChange={(e) => setDateStr(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="session-rate">
                        Electricity Rate ({currency}/kWh)
                      </Label>
                      <Input
                        id="session-rate"
                        type="number"
                        step="0.5"
                        min="0"
                        value={rate}
                        onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="start-odo">Start Odometer (km)</Label>
                        {lastOdoHint !== null && (
                          <span className="text-[10px] text-primary font-mono-num">
                            Last: {lastOdoHint} km
                          </span>
                        )}
                      </div>
                      <Input
                        id="start-odo"
                        type="number"
                        placeholder="e.g. 1200"
                        value={startOdo}
                        onChange={(e) => setStartOdo(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="end-odo">End Odometer (km)</Label>
                      <Input
                        id="end-odo"
                        type="number"
                        placeholder="e.g. 1285"
                        value={endOdo}
                        onChange={(e) => setEndOdo(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="session-loc">Charging Location</Label>
                    <Input
                      id="session-loc"
                      placeholder="e.g. Home, Office, Hypercharger"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="session-notes">Notes</Label>
                    <Textarea
                      id="session-notes"
                      placeholder="Optional ride or charging notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <ChargePulseButton
          type="submit"
          size="lg"
          loading={submitting}
          disabled={!calc}
          className="w-full"
        >
          {submitting ? (
            <span>Saving Session...</span>
          ) : (
            <>
              <Zap className="h-4 w-4 fill-current" />
              <span>Save Charging Record</span>
            </>
          )}
        </ChargePulseButton>
      </form>
    </div>
  );
}
