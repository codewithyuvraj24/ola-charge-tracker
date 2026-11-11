"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useScooter } from "@/lib/scooter-context";
import { getChargingSessions } from "@/lib/firestore";
import {
  computeDashboardStats,
  computeMonthlyData,
  computeSessionChartData,
} from "@/lib/calculations";
import { formatCurrency, formatNumber, formatDate, getDateRange } from "@/lib/utils";
import type { ChargingSession, DateFilter } from "@/lib/types";
import { DATE_FILTER_OPTIONS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  PlusCircle,
  IndianRupee,
  TrendingUp,
  BatteryCharging,
  Gauge,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Filter,
  BarChart3,
  Bike,
  Activity,
  History as HistoryIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function DashboardPage() {
  const { user } = useAuth();
  const { scooter } = useScooter();
  const [sessions, setSessions] = useState<ChargingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>("30d");

  useEffect(() => {
    async function loadData() {
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
        console.error("Error loading sessions:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, dateFilter]);

  const stats = useMemo(() => computeDashboardStats(sessions), [sessions]);
  const monthlyData = useMemo(() => computeMonthlyData(sessions), [sessions]);
  const sessionChartData = useMemo(() => computeSessionChartData(sessions), [sessions]);

  return (
    <div className="space-y-6">
      {/* Top Header Row with Greetings & Add Session Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Activity className="h-4 w-4" />
            Live Dashboard
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
            Overview & Charging Stats
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Active Vehicle:{" "}
            <span className="font-semibold text-foreground">{scooter?.name}</span>{" "}
            ({scooter?.model})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/add-session">
            <Button className="shadow-md shadow-primary/20 font-semibold gap-1.5">
              <PlusCircle className="h-4 w-4" />
              <span>Record Session</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-xl bg-card/60 border border-border/60">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 font-medium">
          <Filter className="h-3.5 w-3.5 text-primary" />
          <span>Timeframe:</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {DATE_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDateFilter(opt.value)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                dateFilter === opt.value
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards Grid (7 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Cost */}
        <Card className="border-border/60 shadow-sm bg-card/70 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Total Expenditure</span>
              <IndianRupee className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              {formatCurrency(stats.totalExpenditure)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[11px] text-muted-foreground">
              Electricity cost for {stats.totalSessions} sessions
            </p>
          </CardContent>
        </Card>

        {/* Total Grid Units */}
        <Card className="border-border/60 shadow-sm bg-card/70 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Grid Units Consumed</span>
              <Zap className="h-4 w-4 text-emerald-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              {formatNumber(stats.totalElectricity, 1)}{" "}
              <span className="text-sm font-normal text-muted-foreground">kWh</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[11px] text-muted-foreground">
              Direct electricity meter draw
            </p>
          </CardContent>
        </Card>

        {/* Total Sessions */}
        <Card className="border-border/60 shadow-sm bg-card/70 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-500" />
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Total Sessions</span>
              <BatteryCharging className="h-4 w-4 text-cyan-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              {stats.totalSessions}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[11px] text-muted-foreground">
              Logged charging cycles
            </p>
          </CardContent>
        </Card>

        {/* Average Cost */}
        <Card className="border-border/60 shadow-sm bg-card/70 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Avg Cost / Charge</span>
              <TrendingUp className="h-4 w-4 text-amber-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              {formatCurrency(stats.averageCost)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[11px] text-muted-foreground">
              Average per charging plug-in
            </p>
          </CardContent>
        </Card>

        {/* Average Battery Added */}
        <Card className="border-border/60 shadow-sm bg-card/70 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-violet-500" />
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Avg Battery Added</span>
              <Sparkles className="h-4 w-4 text-violet-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              +{stats.averageAdded}%
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[11px] text-muted-foreground">
              Average charge percentage gained
            </p>
          </CardContent>
        </Card>

        {/* Total Distance Recorded */}
        <Card className="border-border/60 shadow-sm bg-card/70 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Distance Logged</span>
              <Gauge className="h-4 w-4 text-blue-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              {stats.totalDistance > 0 ? (
                <>
                  {formatNumber(stats.totalDistance, 0)}{" "}
                  <span className="text-sm font-normal text-muted-foreground">km</span>
                </>
              ) : (
                <span className="text-muted-foreground text-lg">No odo data</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[11px] text-muted-foreground">
              Calculated from odometer delta
            </p>
          </CardContent>
        </Card>

        {/* Cost Per Km */}
        <Card className="border-border/60 shadow-sm bg-card/70 relative overflow-hidden col-span-2 md:col-span-1">
          <div className="absolute top-0 left-0 right-0 h-1 bg-pink-500" />
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Cost Per Kilometre</span>
              <Bike className="h-4 w-4 text-pink-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              {stats.costPerKm !== null ? (
                <>
                  {formatCurrency(stats.costPerKm)}
                  <span className="text-sm font-normal text-muted-foreground">/km</span>
                </>
              ) : (
                <span className="text-muted-foreground text-sm font-normal">
                  Log odometer to view
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[11px] text-muted-foreground">
              True EV operational efficiency
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Interactive Charts */}
      {sessions.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expenditure Trend Chart */}
          <Card className="border-border/60 shadow-md bg-card/70">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Cost Per Charging Session
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Expenditure (₹) per recorded session
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  {sessionChartData.length} records
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sessionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(val: number) => [`₹${val.toFixed(2)}`, "Cost"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="cost"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#costGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Grid Units Consumed Bar Chart */}
          <Card className="border-border/60 shadow-md bg-card/70">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Grid Units Consumed (kWh)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Units consumed from home/public power grid
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  kWh
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sessionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(val: number) => [`${val.toFixed(2)} units`, "Grid Units"]}
                    />
                    <Bar
                      dataKey="gridUnits"
                      fill="hsl(var(--chart-2))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Empty State */
        <Card className="border-dashed border-2 border-border/80 bg-card/40 p-8 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <BatteryCharging className="h-8 w-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-foreground">
              No charging sessions recorded for this timeframe
            </h3>
            <p className="text-xs text-muted-foreground">
              Plug in your scooter and record your battery start and end percentages to start seeing automatic calculations and charging statistics.
            </p>
          </div>
          <Link href="/add-session">
            <Button className="font-semibold shadow-md shadow-primary/25">
              <PlusCircle className="mr-2 h-4 w-4" />
              Record Your First Session
            </Button>
          </Link>
        </Card>
      )}

      {/* Recent Sessions Preview */}
      {sessions.length > 0 && (
        <Card className="border-border/60 shadow-md bg-card/70">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">
                Recent Charging Sessions
              </CardTitle>
              <CardDescription className="text-xs">
                Latest plug-in records
              </CardDescription>
            </div>
            <Link href="/history">
              <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary">
                View all
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border/60">
              {sessions.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  className="py-3 flex items-center justify-between gap-4 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">
                        {s.startPercentage}% → {s.endPercentage}%
                        <span className="ml-2 text-xs text-primary font-normal">
                          (+{s.addedPercentage}%)
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(s.date.toDate())}
                        {s.location && ` • ${s.location}`}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-foreground">
                      {formatCurrency(s.totalCost)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatNumber(s.gridUnits, 2)} units @ ₹{s.electricityRate}
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

