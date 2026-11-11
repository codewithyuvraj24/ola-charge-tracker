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
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import type { ChargingSession } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  IndianRupee,
  Zap,
  BatteryCharging,
  Gauge,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  BarChart3,
  Calendar,
  PieChart,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { scooter } = useScooter();
  const [sessions, setSessions] = useState<ChargingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        setLoading(true);
        const data = await getChargingSessions(user.uid);
        setSessions(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const stats = useMemo(() => computeDashboardStats(sessions), [sessions]);
  const monthlyData = useMemo(() => computeMonthlyData(sessions), [sessions]);

  // Analytics extrema
  const extrema = useMemo(() => {
    if (sessions.length === 0) return { maxSession: null, minSession: null };
    const sorted = [...sessions].sort((a, b) => b.totalCost - a.totalCost);
    return {
      maxSession: sorted[0],
      minSession: sorted[sorted.length - 1],
    };
  }, [sessions]);

  // Current month & year stats for insights
  const currentMonthInsight = useMemo(() => {
    const now = new Date();
    const thisMonthSessions = sessions.filter((s) => {
      const d = s.date.toDate();
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    });
    if (thisMonthSessions.length === 0) return null;
    const totalCost = thisMonthSessions.reduce((sum, s) => sum + s.totalCost, 0);
    const avgCost = totalCost / thisMonthSessions.length;
    return {
      totalCost,
      avgCost,
      count: thisMonthSessions.length,
    };
  }, [sessions]);

  const thisYearSpent = useMemo(() => {
    const now = new Date();
    const thisYearSessions = sessions.filter(
      (s) => s.date.toDate().getFullYear() === now.getFullYear()
    );
    if (thisYearSessions.length === 0) return null;
    return thisYearSessions.reduce((sum, s) => sum + s.totalCost, 0);
  }, [sessions]);

  const avgUnitsPerSession = useMemo(() => {
    if (sessions.length === 0) return 0;
    return stats.totalElectricity / sessions.length;
  }, [sessions, stats]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <TrendingUp className="h-4 w-4" />
          Intelligence & Trends
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
          Charging Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Long-term energy consumption trends, cost metrics, and predictive insights.
        </p>
      </div>

      {/* Smart Insights Cards (Requirement 8) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Insight 1: Current Month */}
        <Card className="border-primary/30 bg-primary/5 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center gap-2 text-xs font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Monthly Benchmark
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-1">
            {currentMonthInsight ? (
              <>
                <p className="text-sm text-foreground">
                  Your average charging cost this month is{" "}
                  <span className="font-bold text-primary">
                    {formatCurrency(currentMonthInsight.avgCost)}
                  </span>
                  .
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Across {currentMonthInsight.count} charging sessions recorded this month.
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Log a charging session this month to unlock monthly benchmark insights.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Insight 2: Annual Spend */}
        <Card className="border-border/60 bg-card/70 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Calendar className="h-4 w-4 text-cyan-500" />
              Yearly Expenditure
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-1">
            {thisYearSpent !== null ? (
              <>
                <p className="text-sm text-foreground">
                  You have spent{" "}
                  <span className="font-bold text-cyan-500">
                    {formatCurrency(thisYearSpent)}
                  </span>{" "}
                  on electricity this year.
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Total grid electricity cost for {new Date().getFullYear()}.
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Log charging sessions to track your cumulative annual electricity budget.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Insight 3: Cost Per KM */}
        <Card className="border-border/60 bg-card/70 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Gauge className="h-4 w-4 text-emerald-500" />
              Riding Efficiency
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-1">
            {stats.costPerKm !== null ? (
              <>
                <p className="text-sm text-foreground">
                  Your average charging cost per kilometre is{" "}
                  <span className="font-bold text-emerald-500">
                    {formatCurrency(stats.costPerKm)}/km
                  </span>
                  .
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Based on {formatNumber(stats.totalDistance, 0)} km recorded via odometer.
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Enter start and end odometers when logging sessions to calculate cost per kilometre.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics Key Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Most Expensive Session */}
        <Card className="border-border/60 shadow-sm bg-card/70">
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Highest-Cost Charge</span>
              <ArrowUpRight className="h-4 w-4 text-destructive" />
            </div>
            <CardTitle className="text-xl font-bold mt-1 text-foreground">
              {extrema.maxSession ? formatCurrency(extrema.maxSession.totalCost) : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            {extrema.maxSession
              ? `${formatDate(extrema.maxSession.date.toDate())} (+${extrema.maxSession.addedPercentage}%)`
              : "No sessions"}
          </CardContent>
        </Card>

        {/* Lowest Cost Session */}
        <Card className="border-border/60 shadow-sm bg-card/70">
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Lowest-Cost Charge</span>
              <ArrowDownRight className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-xl font-bold mt-1 text-foreground">
              {extrema.minSession ? formatCurrency(extrema.minSession.totalCost) : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            {extrema.minSession
              ? `${formatDate(extrema.minSession.date.toDate())} (+${extrema.minSession.addedPercentage}%)`
              : "No sessions"}
          </CardContent>
        </Card>

        {/* Average Units Per Session */}
        <Card className="border-border/60 shadow-sm bg-card/70">
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Avg Units / Session</span>
              <Zap className="h-4 w-4 text-amber-500" />
            </div>
            <CardTitle className="text-xl font-bold mt-1 text-foreground">
              {formatNumber(avgUnitsPerSession, 2)}{" "}
              <span className="text-xs font-normal text-muted-foreground">kWh</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            Grid power per charge
          </CardContent>
        </Card>

        {/* Average Cost Per Session */}
        <Card className="border-border/60 shadow-sm bg-card/70">
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Avg Session Cost</span>
              <IndianRupee className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-xl font-bold mt-1 text-foreground">
              {formatCurrency(stats.averageCost)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            Mean expenditure per plug-in
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown Charts */}
      {monthlyData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Expenditure Trend */}
          <Card className="border-border/60 shadow-md bg-card/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                Monthly Expenditure (₹)
              </CardTitle>
              <CardDescription className="text-xs">
                Total money spent on scooter electricity by month
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(val: number) => [`₹${val.toFixed(2)}`, "Expenditure"]}
                    />
                    <Bar
                      dataKey="expenditure"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Electricity Consumption Trend */}
          <Card className="border-border/60 shadow-md bg-card/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                Monthly Grid Electricity (kWh)
              </CardTitle>
              <CardDescription className="text-xs">
                Total power units consumed per month
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="elecGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(val: number) => [`${val.toFixed(2)} kWh`, "Grid Electricity"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="electricity"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#elecGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border-dashed border-2 border-border/70 bg-card/40 p-8 text-center space-y-3">
          <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
          <p className="font-semibold text-foreground">
            Not enough data for monthly trends yet
          </p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Once you log charging sessions across days and months, interactive trend charts and spend projections will render here.
          </p>
          <Link href="/add-session">
            <Button size="sm" className="font-semibold mt-2">
              Record a Session
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
