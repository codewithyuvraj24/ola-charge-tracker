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
import { Button } from "@/components/ui/button";
import {
  Plus,
  ArrowUpRight,
  Filter,
  History,
  Terminal,
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

  // Interactive Battery SOC range
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
          notes: "Recorded via telemetry gauge",
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
    <div className="space-y-5 max-w-5xl mx-auto font-mono-num">
      {/* Linear-Style Minimal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest">
            <Terminal className="h-3.5 w-3.5 text-zinc-400" />
            <span>TELEMETRY CONSOLE</span>
            <span>/</span>
            <span className="text-foreground">{scooter?.name}</span>
          </div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">
            Vehicle Energy & Charging Operations
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/add-session">
            <Button size="sm" className="h-8 text-xs font-medium gap-1.5 px-3 bg-zinc-100 text-zinc-900 hover:bg-white">
              <Plus className="h-3.5 w-3.5" />
              <span>Full Form</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 🔋 INTERACTIVE VISUAL BATTERY GAUGE */}
      <div className="space-y-2">
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

        {/* Quick-commit button attached to the gauge */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-xs">
            {[
              { s: 20, e: 80 },
              { s: 20, e: 100 },
              { s: 10, e: 100 },
              { s: 30, e: 90 },
            ].map((preset) => (
              <button
                key={`${preset.s}-${preset.e}`}
                type="button"
                onClick={() => {
                  setGaugeStart(preset.s);
                  setGaugeEnd(preset.e);
                }}
                className="text-[11px] px-2.5 py-1 rounded bg-zinc-900 border border-border hover:border-zinc-700 text-zinc-400 hover:text-foreground transition-colors"
              >
                {preset.s}%→{preset.e}%
              </button>
            ))}
          </div>

          <Button
            size="sm"
            onClick={handleLogFromGauge}
            disabled={loggingQuick || !quickCalc}
            className="h-7 text-xs font-medium px-3 bg-emerald-500 hover:bg-emerald-400 text-black gap-1"
          >
            <Zap className="h-3 w-3 fill-current" />
            {loggingQuick ? "COMMITTING..." : `COMMIT TO LOG (₹${quickCalc ? quickCalc.totalCost.toFixed(2) : "0"})`}
          </Button>
        </div>
      </div>

      {/* Strict Minimal Executive Metric Grid (Notion/Linear style) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="linear-box p-3 space-y-1">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider">TOTAL SPEND</div>
          <div className="text-xl font-bold text-foreground">
            {formatCurrency(stats.totalExpenditure)}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {stats.totalSessions} sessions recorded
          </div>
        </div>

        <div className="linear-box p-3 space-y-1">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider">GRID DRAWN</div>
          <div className="text-xl font-bold text-foreground">
            {formatNumber(stats.totalElectricity, 1)} <span className="text-xs text-muted-foreground font-normal">kWh</span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            Domestic meter units
          </div>
        </div>

        <div className="linear-box p-3 space-y-1">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider">COST EFFICIENCY</div>
          <div className="text-xl font-bold text-foreground">
            {stats.costPerKm !== null ? `${formatCurrency(stats.costPerKm)}/km` : "—"}
          </div>
          <div className="text-[10px] text-emerald-400">
            {stats.totalDistance > 0 ? `${formatNumber(stats.totalDistance, 0)} km logged` : "No odometer logged"}
          </div>
        </div>

        <div className="linear-box p-3 space-y-1">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider">AVG CYCLE COST</div>
          <div className="text-xl font-bold text-foreground">
            {formatCurrency(stats.averageCost)}
          </div>
          <div className="text-[10px] text-muted-foreground">
            +{stats.averageAdded}% avg SOC added
          </div>
        </div>
      </div>

      {/* Date Filter Strip */}
      <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded linear-box">
        <span className="text-muted-foreground text-[11px] flex items-center gap-1.5">
          <Filter className="h-3 w-3" />
          TIMEFRAME:
        </span>
        <div className="flex items-center gap-1">
          {DATE_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDateFilter(opt.value)}
              className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                dateFilter === opt.value
                  ? "bg-zinc-100 text-zinc-900 font-semibold"
                  : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart: Minimalist Monospaced Series */}
      {sessions.length > 0 && (
        <div className="linear-box p-4 space-y-3">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-border">
            <span className="font-semibold text-foreground uppercase tracking-wider">EXPENDITURE TIME-SERIES</span>
            <span className="text-[11px] text-muted-foreground">{sessionChartData.length} records</span>
          </div>

          <div className="h-48 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sessionChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#222227" opacity={0.6} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#666" }} />
                <YAxis tick={{ fontSize: 10, fill: "#666" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0c0c0e",
                    borderColor: "#222227",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontFamily: "monospace",
                  }}
                  formatter={(val: number) => [`₹${val.toFixed(2)}`, "Cost"]}
                />
                <Area
                  type="stepAfter"
                  dataKey="cost"
                  stroke="#fafafa"
                  strokeWidth={1.5}
                  fillOpacity={0.08}
                  fill="#fafafa"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Minimal Table (Notion / Linear Style Monospaced Rows) */}
      {sessions.length > 0 && (
        <div className="linear-box overflow-hidden">
          <div className="p-3 border-b border-border flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-foreground">RECENT LOG ENTRIES</span>
            <Link href="/history" className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-[11px]">
              VIEW FULL DATABASE
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-border text-xs">
            {sessions.slice(0, 5).map((s) => (
              <div key={s.id} className="p-3 flex items-center justify-between hover:bg-zinc-900/40 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="text-zinc-500 text-[11px] w-24 whitespace-nowrap">
                    {formatDate(s.date.toDate())}
                  </div>
                  <div className="font-semibold text-foreground">
                    {s.startPercentage}% → {s.endPercentage}%
                    <span className="ml-2 text-emerald-400 font-normal">(+{s.addedPercentage}%)</span>
                  </div>
                  <div className="text-zinc-500 text-[11px] hidden sm:block">
                    {s.location || "Home"}
                  </div>
                </div>

                <div className="text-right flex items-center gap-6">
                  <span className="text-zinc-400 text-[11px]">
                    {formatNumber(s.gridUnits, 2)} kWh
                  </span>
                  <span className="font-bold text-foreground w-16 text-right">
                    {formatCurrency(s.totalCost)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
