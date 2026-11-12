"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useScooter } from "@/lib/scooter-context";
import { getChargingSessions } from "@/lib/firestore";
import {
  computeDashboardStats,
  computeMonthlyData,
  computeLocationData,
  computeEvVsPetrolSavings,
} from "@/lib/calculations";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import type { ChargingSession } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  TrendingUp,
  Zap,
  Gauge,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  BarChart3,
  Calendar,
  Flame,
  MapPin,
  BatteryCharging,
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const monthlyChartConfig = {
  expenditure: {
    label: "Expenditure",
    color: "hsl(var(--chart-1))",
  },
  electricity: {
    label: "Grid Power (kWh)",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export default function AnalyticsPage() {
  const { user, userProfile } = useAuth();
  const { scooter, scooters, activeFilterScooterId, viewAllVehicles } = useScooter();
  const currency = userProfile?.currency || "₹";
  const petrolPrice = userProfile?.petrolPrice ?? 105;
  const petrolMileage = userProfile?.petrolMileage ?? 45;

  const [sessions, setSessions] = useState<ChargingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        setLoading(true);
        const data = await getChargingSessions(
          user.uid,
          undefined,
          undefined,
          activeFilterScooterId
        );
        setSessions(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, activeFilterScooterId]);

  const stats = useMemo(() => computeDashboardStats(sessions), [sessions]);
  const monthlyData = useMemo(() => computeMonthlyData(sessions), [sessions]);
  const locationData = useMemo(() => computeLocationData(sessions), [sessions]);
  const savings = useMemo(
    () =>
      computeEvVsPetrolSavings(
        stats.totalDistance,
        stats.totalExpenditure,
        petrolPrice,
        petrolMileage
      ),
    [stats.totalDistance, stats.totalExpenditure, petrolPrice, petrolMileage]
  );

  const extrema = useMemo(() => {
    if (sessions.length === 0) return { maxSession: null, minSession: null };
    const sorted = [...sessions].sort((a, b) => b.totalCost - a.totalCost);
    return {
      maxSession: sorted[0],
      minSession: sorted[sorted.length - 1],
    };
  }, [sessions]);

  const currentMonthInsight = useMemo(() => {
    const now = new Date();
    const thisMonthSessions = sessions.filter((s) => {
      const d = s.date.toDate();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    if (thisMonthSessions.length === 0) return null;
    const totalCost = thisMonthSessions.reduce((sum, s) => sum + s.totalCost, 0);
    return {
      totalCost,
      avgCost: totalCost / thisMonthSessions.length,
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
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <TrendingUp className="h-4 w-4" />
          Intelligence &amp; Trends
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
          Charging Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {viewAllVehicles && scooters.length > 1
            ? `Aggregated metrics across all ${scooters.length} vehicles`
            : `${scooter?.name || "Vehicle"} • Long-term energy, cycle & savings insights`}
        </p>
      </div>

      {/* EV vs Petrol Savings + Smart Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center gap-2 text-xs font-medium text-primary">
              <Flame className="h-4 w-4" />
              EV vs Petrol Savings
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-1">
            {savings.hasDistance ? (
              <>
                <p className="text-sm text-foreground">
                  Saved{" "}
                  <span className="font-bold font-mono-num text-primary">
                    {formatCurrency(savings.netSavings, currency)}
                  </span>{" "}
                  vs petrol.
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Petrol equiv: {formatCurrency(savings.petrolCost, currency)} ({currency}{petrolPrice}/L @ {petrolMileage} km/L).
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Log start &amp; end odometer readings to compute real savings vs a petrol scooter.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Monthly Benchmark
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-1">
            {currentMonthInsight ? (
              <>
                <p className="text-sm text-foreground">
                  Avg cost this month is{" "}
                  <span className="font-bold font-mono-num text-primary">
                    {formatCurrency(currentMonthInsight.avgCost, currency)}
                  </span>
                  .
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Across {currentMonthInsight.count} session{currentMonthInsight.count > 1 ? "s" : ""} this month.
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Log a session this month to unlock monthly benchmark insights.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Calendar className="h-4 w-4 text-chart-2" />
              Yearly Expenditure
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-1">
            {thisYearSpent !== null ? (
              <>
                <p className="text-sm text-foreground">
                  Spent{" "}
                  <span className="font-bold font-mono-num text-chart-2">
                    {formatCurrency(thisYearSpent, currency)}
                  </span>{" "}
                  in {new Date().getFullYear()}.
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Cumulative grid power bill year-to-date.
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Log charging sessions to track your annual electricity budget.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <BatteryCharging className="h-4 w-4 text-chart-3" />
              Battery Cycles
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-1">
            <p className="text-sm text-foreground">
              <span className="font-bold font-mono-num text-foreground">
                {formatNumber(stats.equivalentCycles, 2)} eq. cycles
              </span>
            </p>
            <p className="text-[11px] text-muted-foreground">
              Full 0→100% equivalents across {stats.totalSessions} plug-ins.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Extrema Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Highest-Cost Charge</span>
              <ArrowUpRight className="h-4 w-4 text-destructive" />
            </div>
            <CardTitle className="text-xl font-bold font-mono-num mt-1">
              {extrema.maxSession ? formatCurrency(extrema.maxSession.totalCost, currency) : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            {extrema.maxSession
              ? `${formatDate(extrema.maxSession.date.toDate())} (+${extrema.maxSession.addedPercentage}%)`
              : "No sessions"}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Lowest-Cost Charge</span>
              <ArrowDownRight className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-xl font-bold font-mono-num mt-1">
              {extrema.minSession ? formatCurrency(extrema.minSession.totalCost, currency) : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            {extrema.minSession
              ? `${formatDate(extrema.minSession.date.toDate())} (+${extrema.minSession.addedPercentage}%)`
              : "No sessions"}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Avg Units / Session</span>
              <Zap className="h-4 w-4 text-chart-3" />
            </div>
            <CardTitle className="text-xl font-bold font-mono-num mt-1">
              {formatNumber(avgUnitsPerSession, 2)}{" "}
              <span className="text-xs font-normal text-muted-foreground">kWh</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            Grid power per charge
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Cost / km</span>
              <Gauge className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-xl font-bold font-mono-num mt-1">
              {stats.costPerKm !== null ? `${formatCurrency(stats.costPerKm, currency)}/km` : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            {stats.totalDistance > 0
              ? `${formatNumber(stats.totalDistance, 0)} km tracked`
              : "Add odometer to track"}
          </CardContent>
        </Card>
      </div>

      {/* Spend by Location Breakdown */}
      {!loading && locationData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Cost &amp; Energy by Location
                </CardTitle>
                <CardDescription className="text-xs">
                  Charging distribution across home, office, and fast chargers
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono-num text-xs">
                {locationData.length} location{locationData.length > 1 ? "s" : ""}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {locationData.map((loc) => {
              const pct =
                stats.totalExpenditure > 0
                  ? Math.round((loc.expenditure / stats.totalExpenditure) * 100)
                  : 0;
              return (
                <div key={loc.location} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{loc.location}</span>
                      <Badge variant="secondary" className="text-[10px] font-mono-num">
                        {loc.sessions} {loc.sessions === 1 ? "log" : "logs"}
                      </Badge>
                    </div>
                    <div className="font-mono-num text-right">
                      <span className="font-bold text-foreground">
                        {formatCurrency(loc.expenditure, currency)}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        ({formatNumber(loc.electricity, 1)} kWh • {pct}%)
                      </span>
                    </div>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* shadcn/ui ChartContainers */}
      {!loading && monthlyData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                Monthly Expenditure ({currency})
              </CardTitle>
              <CardDescription className="text-xs">
                Total money spent on scooter electricity by month
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <ChartContainer config={monthlyChartConfig} className="h-72 w-full">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -16, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="expenditure"
                    fill="var(--color-expenditure)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                Monthly Grid Electricity (kWh)
              </CardTitle>
              <CardDescription className="text-xs">
                Total power units consumed per month
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <ChartContainer config={monthlyChartConfig} className="h-72 w-full">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="elecGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-electricity)" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="var(--color-electricity)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                  <Area
                    type="monotone"
                    dataKey="electricity"
                    stroke="var(--color-electricity)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#elecGrad)"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      ) : (
        !loading && (
          <Card className="border-dashed text-center py-10 px-4">
            <CardContent className="space-y-3 pt-2">
              <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
              <p className="font-semibold text-foreground">Not enough data for monthly trends yet</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Once you log charging sessions across days and months, interactive trend charts and spend projections will render here.
              </p>
              <Link href="/add-session">
                <Button size="sm" className="font-semibold mt-2">
                  Record a Session
                </Button>
              </Link>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
