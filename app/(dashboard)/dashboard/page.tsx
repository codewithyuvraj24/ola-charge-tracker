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
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Plus,
  IndianRupee,
  Gauge,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  BatteryCharging,
  History,
  TrendingDown,
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
          notes: "Quick log",
        },
        scooter
      );
      toast.success(`Saved! ${formatCurrency(quickCalc.totalCost)} added to your records.`);
      await fetchSessions();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to record charge";
      toast.error(msg);
    } finally {
      setLoggingQuick(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Friendly Header with Scooter Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Charging Overview
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Active: <span className="font-semibold text-foreground">{scooter?.name}</span> ({scooter?.model} • {scooter?.batteryCapacity} kWh)
          </p>
        </div>

        <Link href="/add-session">
          <Button className="rounded-2xl px-5 py-5 font-semibold gap-2 shadow-lg shadow-primary/20 ios-pressable">
            <Plus className="h-4 w-4" />
            <span>Record New Charge</span>
          </Button>
        </Link>
      </div>

      {/* ⚡ 1-TAP QUICK CHARGE CARD */}
      <div className="ev-card p-5 space-y-4 border-primary/30 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
              <BatteryCharging className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-foreground leading-tight">Quick Charge Log</div>
              <div className="text-xs text-muted-foreground">Select how much battery you plugged in:</div>
            </div>
          </div>

          {quickCalc && (
            <div className="text-right">
              <div className="text-lg font-black text-primary leading-tight">
                {formatCurrency(quickCalc.totalCost)}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {formatNumber(quickCalc.gridUnits, 2)} units @ ₹{scooter?.electricityRate}
              </div>
            </div>
          )}
        </div>

        {/* Big Touch-Friendly Battery Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {[
            { s: 20, e: 80, label: "20% → 80%" },
            { s: 20, e: 100, label: "20% → 100%" },
            { s: 10, e: 100, label: "10% → 100%" },
            { s: 30, e: 90, label: "30% → 90%" },
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
                className={`text-xs px-4 py-2.5 rounded-xl font-bold transition-all ios-pressable ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
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
            className="ml-auto rounded-xl px-6 py-2.5 font-bold text-xs gap-1.5 shadow-md shadow-primary/25 ios-pressable"
          >
            <Zap className="h-4 w-4" />
            {loggingQuick ? "Saving..." : "Log This Charge"}
          </Button>
        </div>
      </div>

      {/* 🎯 3 BIG COMFORTABLE GLANCE METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Money Spent */}
        <div className="ev-card p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Electricity Spent</span>
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-foreground tracking-tight">
            {formatCurrency(stats.totalExpenditure)}
          </div>
          <div className="text-xs text-muted-foreground">
            Total for {stats.totalSessions} charging sessions
          </div>
        </div>

        {/* Card 2: Power Drawn */}
        <div className="ev-card p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Power Drawn</span>
            <div className="h-8 w-8 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-foreground tracking-tight">
            {formatNumber(stats.totalElectricity, 1)}{" "}
            <span className="text-base font-semibold text-muted-foreground">units</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Domestic meter kWh (incl. {scooter?.chargingLoss}% loss)
          </div>
        </div>

        {/* Card 3: Running Cost Per KM */}
        <div className="ev-card p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Running Cost</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Gauge className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-foreground tracking-tight">
            {stats.costPerKm !== null ? (
              <>
                {formatCurrency(stats.costPerKm)}
                <span className="text-base font-normal text-muted-foreground">/km</span>
              </>
            ) : (
              <span className="text-lg font-medium text-muted-foreground">Log odometer</span>
            )}
          </div>
          <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
            <TrendingDown className="h-3.5 w-3.5" />
            ~₹2.20/km cheaper than petrol
          </div>
        </div>
      </div>

      {/* Date Filter Pills */}
      <div className="flex items-center justify-between gap-2 p-2 rounded-2xl ev-card">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 font-medium">
          <Filter className="h-3.5 w-3.5 text-primary" />
          <span>Time:</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {DATE_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDateFilter(opt.value)}
              className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all ios-pressable ${
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

      {/* Cost Trend Chart */}
      {sessions.length > 0 && (
        <div className="ev-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Cost History</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Money spent per charging plug-in</p>
            </div>
            <Badge variant="outline" className="text-xs font-bold">
              {sessionChartData.length} entries
            </Badge>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sessionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "14px",
                    fontSize: "13px",
                    fontWeight: "600",
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
        </div>
      )}

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <div className="ev-card p-5 space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-border/40">
            <CardTitle className="text-base font-bold">Recent Plug-ins</CardTitle>
            <Link href="/history" className="text-xs text-primary font-bold flex items-center gap-1 ios-pressable">
              View all
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
                    <div className="font-bold text-foreground text-sm">
                      {s.startPercentage}% → {s.endPercentage}%
                    </div>
                    <div className="text-muted-foreground text-xs mt-0.5">
                      {formatDate(s.date.toDate())} • {s.location || "Home"}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-extrabold text-foreground text-sm">
                    {formatCurrency(s.totalCost)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {formatNumber(s.gridUnits, 2)} units
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
