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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  IndianRupee,
  Gauge,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  BatteryCharging,
  Zap,
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

  // Quick Charge State
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
          notes: "Recorded session",
        },
        scooter
      );
      toast.success(`Session recorded (${formatCurrency(quickCalc.totalCost)})`);
      await fetchSessions();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to record session";
      toast.error(msg);
    } finally {
      setLoggingQuick(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Professional Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            Charging Dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Vehicle: <span className="font-medium text-foreground">{scooter?.name}</span> ({scooter?.model} • {scooter?.batteryCapacity} kWh pack)
          </p>
        </div>

        <Link href="/add-session">
          <Button size="sm" className="font-medium gap-1.5 h-9">
            <Plus className="h-4 w-4" />
            <span>New Session</span>
          </Button>
        </Link>
      </div>

      {/* Structured Session Logger Box */}
      <Card className="border border-border">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                <BatteryCharging className="h-4 w-4 text-primary" />
                Quick Log Charging Session
              </div>
              <p className="text-xs text-muted-foreground">
                Select battery charge range:
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                { s: 20, e: 80, label: "20% → 80%" },
                { s: 20, e: 100, label: "20% → 100%" },
                { s: 10, e: 100, label: "10% → 100%" },
                { s: 30, e: 90, label: "30% → 90%" },
              ].map((p) => {
                const isSelected = quickStart === p.s && quickEnd === p.e;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setQuickStart(p.s);
                      setQuickEnd(p.e);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-md font-medium border transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}

              {quickCalc && (
                <div className="text-xs font-semibold text-foreground px-2">
                  {formatCurrency(quickCalc.totalCost)}{" "}
                  <span className="font-normal text-muted-foreground">({formatNumber(quickCalc.gridUnits, 2)} kWh)</span>
                </div>
              )}

              <Button
                size="sm"
                onClick={handleLogQuick}
                disabled={loggingQuick || !quickCalc}
                className="font-medium text-xs h-8 px-4"
              >
                {loggingQuick ? "Saving..." : "Save Session"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-border">
          <CardContent className="p-5 space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Electricity Spend</span>
              <IndianRupee className="h-4 w-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              {formatCurrency(stats.totalExpenditure)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalSessions} charging sessions recorded
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardContent className="p-5 space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Power Consumed</span>
              <Zap className="h-4 w-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              {formatNumber(stats.totalElectricity, 1)}{" "}
              <span className="text-base font-normal text-muted-foreground">kWh</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Grid consumption (incl. {scooter?.chargingLoss}% loss)
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardContent className="p-5 space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Cost Efficiency</span>
              <Gauge className="h-4 w-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              {stats.costPerKm !== null ? (
                <>
                  {formatCurrency(stats.costPerKm)}
                  <span className="text-base font-normal text-muted-foreground">/km</span>
                </>
              ) : (
                <span className="text-base font-normal text-muted-foreground">No odometer data</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Running cost calculated from odometer
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Date Filter Bar */}
      <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/40 border border-border">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 font-medium">
          <Filter className="h-3.5 w-3.5" />
          <span>Filter:</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {DATE_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDateFilter(opt.value)}
              className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${
                dateFilter === opt.value
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Spending Trend Chart */}
      {sessions.length > 0 && (
        <Card className="border border-border">
          <CardHeader className="p-4 sm:p-5 pb-0 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Charging Expenditure Trend</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Electricity cost (₹) per session</p>
            </div>
            <Badge variant="outline" className="text-xs">
              {sessionChartData.length} entries
            </Badge>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-4">
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sessionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                    formatter={(val: number) => [`₹${val.toFixed(2)}`, "Cost"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="cost"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={0.15}
                    fill="hsl(var(--primary))"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Records Table */}
      {sessions.length > 0 && (
        <Card className="border border-border">
          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Recent Charging Sessions</CardTitle>
            <Link href="/history" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              View all history
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {sessions.slice(0, 5).map((s) => (
                <div key={s.id} className="p-3.5 sm:px-5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-medium text-foreground text-sm">
                      {s.startPercentage}% → {s.endPercentage}%{" "}
                      <span className="text-xs text-primary font-normal">(+{s.addedPercentage}%)</span>
                    </div>
                    <div className="text-muted-foreground text-xs mt-0.5">
                      {formatDate(s.date.toDate())} • {s.location || "Home"}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold text-foreground text-sm">
                      {formatCurrency(s.totalCost)}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {formatNumber(s.gridUnits, 2)} kWh
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
