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
import { VisualBatteryGauge } from "@/components/ui/battery-gauge";
import { ChargePulseButton } from "@/components/ui/uiverse";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Plus,
  ArrowUpRight,
  IndianRupee,
  Zap,
  Gauge,
  BatteryCharging,
  TrendingDown,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

const chartConfig = {
  cost: {
    label: "Charging Cost (₹)",
    color: "hsl(var(--chart-1))",
  },
  gridUnits: {
    label: "Grid Units (kWh)",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export default function DashboardPage() {
  const { user } = useAuth();
  const { scooter } = useScooter();
  const [sessions, setSessions] = useState<ChargingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>("30d");

  const [gaugeStart, setGaugeStart] = useState<number>(20);
  const [gaugeEnd, setGaugeEnd] = useState<number>(100);
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
    if (!scooter || gaugeEnd <= gaugeStart) return null;
    return calculateSession(
      gaugeStart,
      gaugeEnd,
      scooter.batteryCapacity,
      scooter.electricityRate,
      scooter.chargingLoss
    );
  }, [gaugeStart, gaugeEnd, scooter]);

  const handleLogFromGauge = async () => {
    if (!user || !scooter || !quickCalc) return;
    setLoggingQuick(true);
    try {
      await addChargingSession(
        user.uid,
        {
          date: new Date(),
          startPercentage: gaugeStart,
          endPercentage: gaugeEnd,
          electricityRate: scooter.electricityRate,
          location: "Home",
          notes: "Quick telemetry log",
        },
        scooter
      );
      toast.success(`Session saved (${formatCurrency(quickCalc.totalCost)})`);
      await fetchSessions();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to record session";
      toast.error(msg);
    } finally {
      setLoggingQuick(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Charging Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {scooter?.name} • {scooter?.model} ({scooter?.batteryCapacity} kWh)
          </p>
        </div>

        <Link href="/add-session">
          <Button className="gap-2 font-medium ios-touch">
            <Plus className="h-4 w-4" />
            <span>Full Session Form</span>
          </Button>
        </Link>
      </div>

      {/* Interactive shadcn/ui Battery Gauge + Quick Commit */}
      <div className="space-y-3">
        <VisualBatteryGauge
          startPct={gaugeStart}
          endPct={gaugeEnd}
          capacityKwh={scooter?.batteryCapacity || 4}
          lossPct={scooter?.chargingLoss ?? 10}
          ratePerKwh={scooter?.electricityRate || 12}
          onRangeChange={(s, e) => {
            setGaugeStart(s);
            setGaugeEnd(e);
          }}
          interactive={true}
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { s: 20, e: 80 },
              { s: 20, e: 100 },
              { s: 10, e: 100 },
              { s: 30, e: 90 },
            ].map((preset) => {
              const active = gaugeStart === preset.s && gaugeEnd === preset.e;
              return (
                <Button
                  key={`${preset.s}-${preset.e}`}
                  type="button"
                  size="sm"
                  variant={active ? "secondary" : "outline"}
                  onClick={() => {
                    setGaugeStart(preset.s);
                    setGaugeEnd(preset.e);
                  }}
                  className="h-8 text-xs font-mono-num ios-touch"
                >
                  {preset.s}% → {preset.e}%
                </Button>
              );
            })}
          </div>

          <ChargePulseButton
            size="sm"
            loading={loggingQuick}
            onClick={handleLogFromGauge}
            disabled={!quickCalc}
            className="font-medium"
          >
            {!loggingQuick && <Zap className="h-3.5 w-3.5 fill-current" />}
            <span>
              {loggingQuick
                ? "Saving..."
                : `Quick Log (${quickCalc ? formatCurrency(quickCalc.totalCost) : "₹0.00"})`}
            </span>
          </ChargePulseButton>
        </div>
      </div>

      {/* Timeframe Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card/50 p-2">
        <span className="text-xs font-medium text-muted-foreground px-2">Timeframe</span>
        <div className="flex flex-wrap gap-1">
          {DATE_FILTER_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              size="sm"
              variant={dateFilter === opt.value ? "default" : "ghost"}
              onClick={() => setDateFilter(opt.value)}
              className="h-7 px-2.5 text-xs"
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <Card key={n}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-28 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-5 sm:pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Total Spend
              </CardTitle>
              <IndianRupee className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
              <div className="text-2xl font-bold font-mono-num">
                {formatCurrency(stats.totalExpenditure)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {stats.totalSessions} charging sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-5 sm:pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Grid Consumed
              </CardTitle>
              <Zap className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
              <div className="text-2xl font-bold font-mono-num">
                {formatNumber(stats.totalElectricity, 1)}{" "}
                <span className="text-sm font-normal text-muted-foreground">kWh</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Includes {scooter?.chargingLoss}% charging loss
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-5 sm:pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Cost / km
              </CardTitle>
              <Gauge className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
              <div className="text-2xl font-bold font-mono-num">
                {stats.costPerKm !== null ? `${formatCurrency(stats.costPerKm)}/km` : "—"}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                {stats.totalDistance > 0 ? (
                  <>
                    <TrendingDown className="h-3 w-3 text-primary" />
                    {formatNumber(stats.totalDistance, 0)} km tracked
                  </>
                ) : (
                  "Log odometer to compute"
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-5 sm:pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Avg Cost / Charge
              </CardTitle>
              <BatteryCharging className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
              <div className="text-2xl font-bold font-mono-num">
                {formatCurrency(stats.averageCost)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                +{stats.averageAdded}% average battery added
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* shadcn/ui ChartContainer */}
      {!loading && sessions.length > 0 ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold">Charging Expenditure</CardTitle>
              <CardDescription className="text-xs">
                Electricity cost (₹) per recorded plug-in
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono-num text-xs">
              {sessionChartData.length} sessions
            </Badge>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <AreaChart
                data={sessionChartData}
                margin={{ top: 10, right: 10, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fillCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-cost)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--color-cost)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={11}
                />
                <YAxis tickLine={false} axisLine={false} fontSize={11} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Area
                  dataKey="cost"
                  type="monotone"
                  fill="url(#fillCost)"
                  stroke="var(--color-cost)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      ) : (
        !loading && (
          <Card className="border-dashed text-center py-10 px-4">
            <CardContent className="space-y-3 pt-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <BatteryCharging className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-base">No sessions recorded yet</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Use the battery gauge above for a 1-tap log, or open the full session form to record odometer &amp; notes.
                </p>
              </div>
              <Link href="/add-session">
                <Button size="sm" className="mt-2 gap-1.5">
                  <Plus className="h-4 w-4" />
                  Record First Session
                </Button>
              </Link>
            </CardContent>
          </Card>
        )
      )}

      {/* Recent Sessions Table */}
      {!loading && sessions.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Recent Plug-ins</CardTitle>
              <CardDescription className="text-xs">Latest charging records</CardDescription>
            </div>
            <Link href="/history">
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                View all
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Battery</TableHead>
                  <TableHead className="hidden sm:table-cell text-xs">Location</TableHead>
                  <TableHead className="text-right text-xs">Units</TableHead>
                  <TableHead className="text-right text-xs">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.slice(0, 5).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-xs font-medium whitespace-nowrap">
                      {formatDate(s.date.toDate())}
                    </TableCell>
                    <TableCell className="text-xs font-mono-num whitespace-nowrap">
                      {s.startPercentage}% → {s.endPercentage}%{" "}
                      <Badge variant="secondary" className="ml-1 text-[10px]">
                        +{s.addedPercentage}%
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                      {s.location || "Home"}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono-num text-muted-foreground">
                      {formatNumber(s.gridUnits, 2)} kWh
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono-num font-semibold">
                      {formatCurrency(s.totalCost)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
