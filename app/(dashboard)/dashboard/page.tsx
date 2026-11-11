"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useScooter } from "@/lib/scooter-context";
import { getChargingSessions, addChargingSession } from "@/lib/firestore";
import {
  computeDashboardStats,
  computeSessionChartData,
  calculateSession,
} from "@/lib/calculations";
import { formatCurrency, formatNumber, formatDate, getDateRange } from "@/lib/utils";
import type { ChargingSession, DateFilter } from "@/lib/types";
import { DATE_FILTER_OPTIONS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Plus,
  IndianRupee,
  TrendingUp,
  BatteryCharging,
  Gauge,
  Sparkles,
  ArrowUpRight,
  Filter,
  Bike,
  Activity,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { toast } from "sonner";

export default function DashboardPage() {
  const { user } = useAuth();
  const { scooter } = useScooter();
  const [sessions, setSessions] = useState<ChargingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>("30d");

  // Quick 1-Tap Charge Logger State
  const [quickStart, setQuickStart] = useState<number>(20);
  const [quickEnd, setQuickEnd] = useState<number>(100);
  const [loggingQuick, setLoggingQuick] = useState(false);

  const fetchSessions = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { start, end } = getDateRange(dateFilter);
      const list = await getChargingSessions(
        user.uid,
        dateFilter === "all" ? undefined : start,
        dateFilter === "all" ? undefined : end
      );
      setSessions(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [user, dateFilter]);

  const stats = useMemo(() => computeDashboardStats(sessions), [sessions]);
  const sessionChartData = useMemo(() => computeSessionChartData(sessions), [sessions]);

  // Live Quick Calculation
  const quickCalc = useMemo(() => {
    if (!scooter || quickEnd <= quickStart) return null;
    return calculateSession(
      quickStart,
      quickEnd,
      scooter.batteryCapacity,
      scooter.electricityRate,
      scooter.chargingLoss
    );
  }, [quickStart, quickEnd, scooter]);

  // Handle Quick 1-Tap Log
  const handleLogQuick = async () => {
    if (!user || !scooter || !quickCalc) return;
    setLoggingQuick(true);
    try {
      await addChargingSession(
        user.uid,
        {
          date: new Date(),
          startPercentage: quickStart,
          endPercentage: quickEnd,
          electricityRate: scooter.electricityRate,
          location: "Home",
          notes: "Quick 1-tap log",
        },
        scooter
      );
      toast.success(`Logged! ${formatCurrency(quickCalc.totalCost)} saved to history.`);
      await fetchSessions();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to log charge";
      toast.error(msg);
    } finally {
      setLoggingQuick(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Greeting & Scooter Identity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Active Garage
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
            {scooter?.name || "Ola Electric Scooter"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {scooter?.model} • {scooter?.batteryCapacity} kWh pack • ₹{scooter?.electricityRate}/unit
          </p>
        </div>

        <Link href="/add-session" className="sm:self-center">
          <Button className="rounded-2xl font-semibold gap-2 shadow-lg shadow-primary/20 ios-pressable">
            <Plus className="h-4 w-4" />
            <span>Full Session Log</span>
          </Button>
        </Link>
      </div>

      {/* 🚀 QUICK 1-TAP IN-PLACE LOGGER (Top UX simplification) */}
      <Card className="ios-glass-card border-primary/25 shadow-lg overflow-hidden relative">
        <div className="p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                <BatteryCharging className="h-4 w-4" />
              </div>
              <span className="font-bold text-sm text-foreground">1-Tap Quick Log</span>
            </div>
            {quickCalc && (
              <Badge variant="success" className="text-xs font-bold px-2 py-0.5">
                {formatCurrency(quickCalc.totalCost)} • {formatNumber(quickCalc.gridUnits, 2)} units
              </Badge>
            )}
          </div>

          {/* Quick Battery Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { s: 20, e: 80, label: "20% ➔ 80%" },
              { s: 20, e: 100, label: "20% ➔ 100%" },
              { s: 10, e: 100, label: "10% ➔ 100%" },
              { s: 30, e: 90, label: "30% ➔ 90%" },
            ].map((preset) => {
              const isSelected = quickStart === preset.s && quickEnd === preset.e;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setQuickStart(preset.s);
                    setQuickEnd(preset.e);
                  }}
                  className={`text-xs px-3.5 py-2 rounded-xl font-semibold transition-all ios-pressable ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                      : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}

            <Button
              size="sm"
              onClick={handleLogQuick}
              disabled={loggingQuick || !quickCalc}
              className="ml-auto rounded-xl px-5 py-2 font-bold text-xs gap-1.5 shadow-md shadow-primary/20 ios-pressable"
            >
              <Zap className="h-3.5 w-3.5" />
              {loggingQuick ? "Saving..." : "Log Now"}
            </Button>
          </div>
        </div>
      </Card>

      {/* 🎯 THE BIG THREE GLANCE CARDS (Clean iOS 17 Hierarchy) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Expenditure */}
        <Card className="ios-glass-card relative overflow-hidden p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Electricity Spend</span>
            <div className="h-8 w-8 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-foreground tracking-tight">
            {formatCurrency(stats.totalExpenditure)}
          </div>
          <div className="text-[11px] text-muted-foreground">
            For {stats.totalSessions} charging cycles
          </div>
        </Card>

        {/* Card 2: Grid Units Consumed */}
        <Card className="ios-glass-card relative overflow-hidden p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Grid Electricity Draw</span>
            <div className="h-8 w-8 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-500">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-foreground tracking-tight">
            {formatNumber(stats.totalElectricity, 1)}{" "}
            <span className="text-sm font-normal text-muted-foreground">kWh</span>
          </div>
          <div className="text-[11px] text-muted-foreground">
            Direct meter units (incl. {scooter?.chargingLoss}% loss)
          </div>
        </Card>

        {/* Card 3: True Cost Per KM */}
        <Card className="ios-glass-card relative overflow-hidden p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Running Cost / KM</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-500">
              <Gauge className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-foreground tracking-tight">
            {stats.costPerKm !== null ? (
              <>
                {formatCurrency(stats.costPerKm)}
                <span className="text-sm font-normal text-muted-foreground">/km</span>
              </>
            ) : (
              <span className="text-xl font-normal text-muted-foreground">Log odometer</span>
            )}
          </div>
          <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            ~₹2.20/km cheaper than petrol
          </div>
        </Card>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center justify-between gap-2 p-2 rounded-2xl ios-glass">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2">
          <Filter className="h-3.5 w-3.5 text-primary" />
          <span className="hidden sm:inline">Range:</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {DATE_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDateFilter(opt.value)}
              className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all ios-pressable ${
                dateFilter === opt.value
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Spending Chart */}
      {sessions.length > 0 && (
        <Card className="ios-glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Spending Trend</CardTitle>
              <p className="text-xs text-muted-foreground">Cost (₹) per charging plug-in</p>
            </div>
            <Badge variant="outline" className="text-xs font-semibold">
              {sessionChartData.length} entries
            </Badge>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sessionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                  formatter={(val: number) => [`₹${val.toFixed(2)}`, "Cost"]}
                />
                <Area
                  type="monotone"
                  dataKey="cost"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#spendGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <Card className="ios-glass-card p-5 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <CardTitle className="text-base font-bold">Recent Plug-ins</CardTitle>
            <Link href="/history" className="text-xs text-primary font-semibold flex items-center gap-1 ios-pressable">
              Full diary
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-border/40">
            {sessions.slice(0, 4).map((s) => (
              <div key={s.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold text-xs">
                    +{s.addedPercentage}%
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-sm">
                      {s.startPercentage}% ➔ {s.endPercentage}%
                    </div>
                    <div className="text-muted-foreground text-[11px]">
                      {formatDate(s.date.toDate())} • {s.location || "Home"}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-extrabold text-foreground text-sm">
                    {formatCurrency(s.totalCost)}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {formatNumber(s.gridUnits, 2)} units
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
