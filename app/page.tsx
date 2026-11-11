"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { calculateSession } from "@/lib/calculations";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Zap,
  BatteryCharging,
  TrendingUp,
  ShieldCheck,
  Smartphone,
  IndianRupee,
  Gauge,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Bike,
} from "lucide-react";

export default function LandingPage() {
  const { user } = useAuth();

  // Interactive Live Calculator Preview for Public Visitors
  const [calcStart, setCalcStart] = useState<number>(28);
  const [calcEnd, setCalcEnd] = useState<number>(100);
  const [calcCap, setCalcCap] = useState<number>(4); // 4 kWh for Ola S1 Pro Gen 2
  const [calcRate, setCalcRate] = useState<number>(12); // ₹12/unit
  const [calcLoss, setCalcLoss] = useState<number>(10); // 10% loss

  const previewCalc = useMemo(() => {
    if (calcEnd <= calcStart) return null;
    return calculateSession(calcStart, calcEnd, calcCap, calcRate, calcLoss);
  }, [calcStart, calcEnd, calcCap, calcRate, calcLoss]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navigation Header */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary border border-primary/30 shadow-sm shadow-primary/20">
              <Zap className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight">
              Ola Charge <span className="text-primary font-normal text-sm">Tracker</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard">
                <Button className="font-semibold shadow-sm shadow-primary/20">
                  <span>Go to Dashboard</span>
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-xs font-semibold">
                    Sign in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="text-xs font-semibold shadow-sm shadow-primary/20">
                    Get Started Free
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold animate-fade-in">
              <Sparkles className="h-3.5 w-3.5" />
              Built for Ola Electric & Modern EV Owners
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
              Track EV Charging, Electricity Consumption &{" "}
              <span className="text-primary">Every Single Rupee</span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Calculate exact grid units consumed, accounting for charging loss. Monitor cost per kilometre, track battery cycles, and maintain your private charging diary.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-base font-semibold px-8 py-6 shadow-lg shadow-primary/25">
                  <Zap className="mr-2 h-5 w-5" />
                  Start Tracking Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#calculator" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-6 py-6">
                  Try Interactive Calculator
                </Button>
              </a>
            </div>

            <div className="pt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary" />
                100% Private Cloud Storage
              </span>
              <span className="flex items-center gap-1.5">
                <Smartphone className="h-4 w-4 text-primary" />
                Installable PWA
              </span>
            </div>
          </div>
        </section>

        {/* Interactive Charging Cost Calculator Preview (Requirement 12) */}
        <section id="calculator" className="py-16 bg-card/40 border-y border-border/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-2">
              <Badge variant="outline" className="text-primary border-primary/30">
                Live Formula Simulator
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Try the EV Charging Calculator
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                Test the mathematical engine right now. Adjust battery levels and tariff rates to see the exact cost breakdown before you even sign up.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-card/90 border border-border/80 rounded-2xl p-6 sm:p-8 shadow-xl">
              {/* Controls (7 cols) */}
              <div className="md:col-span-7 space-y-4">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <Bike className="h-4 w-4 text-primary" />
                  Charging Inputs
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Start Battery %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="99"
                      value={calcStart}
                      onChange={(e) => setCalcStart(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">End Battery %</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={calcEnd}
                      onChange={(e) => setCalcEnd(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Capacity (kWh)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={calcCap}
                      onChange={(e) => setCalcCap(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Rate (₹/kWh)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={calcRate}
                      onChange={(e) => setCalcRate(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Loss %</Label>
                    <Input
                      type="number"
                      value={calcLoss}
                      onChange={(e) => setCalcLoss(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg border border-border/40">
                  Default preset: Ola S1 Pro Gen 2 (4 kWh) at ₹12/unit with standard 10% thermal charging loss.
                </div>
              </div>

              {/* Live Preview Output (5 cols) */}
              <div className="md:col-span-5 flex flex-col justify-between bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-4">
                <div>
                  <div className="text-xs font-semibold text-primary uppercase tracking-wide">
                    Live Result
                  </div>
                  <div className="text-3xl font-extrabold text-foreground mt-1">
                    {previewCalc ? formatCurrency(previewCalc.totalCost) : "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total electricity bill cost
                  </div>
                </div>

                {previewCalc && (
                  <div className="space-y-2 text-xs border-t border-primary/20 pt-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Added Battery:</span>
                      <span className="font-semibold text-foreground">+{previewCalc.addedPercentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Energy Stored:</span>
                      <span className="font-semibold text-foreground">{formatNumber(previewCalc.energyStored, 2)} kWh</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Grid Consumed:</span>
                      <span className="font-bold text-primary">{formatNumber(previewCalc.gridUnits, 2)} units</span>
                    </div>
                  </div>
                )}

                <Link href="/register">
                  <Button className="w-full text-xs font-semibold">
                    Create Account to Save Sessions
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">
              Engineered Specifically for Electric Two-Wheelers
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Everything you need to track energy consumption, cost efficiency, and battery trends over time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border/60 bg-card/60 shadow-sm">
              <CardHeader>
                <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center mb-2">
                  <BatteryCharging className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Loss-Compensated Math</CardTitle>
                <CardDescription>
                  Charging an EV incurs heat and converter losses. We calculate true grid draw, so your electricity bill matches your records.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/60 bg-card/60 shadow-sm">
              <CardHeader>
                <div className="h-10 w-10 rounded-xl bg-cyan-500/15 text-cyan-500 flex items-center justify-center mb-2">
                  <Gauge className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">True Cost Per Kilometre</CardTitle>
                <CardDescription>
                  Pair charging cycles with odometer readings to reveal your exact cost per km. Compare real operational costs against petrol.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/60 bg-card/60 shadow-sm">
              <CardHeader>
                <div className="h-10 w-10 rounded-xl bg-violet-500/15 text-violet-500 flex items-center justify-center mb-2">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Private User Isolation</CardTitle>
                <CardDescription>
                  Protected by Firebase Authentication and Firestore Security Rules. Your vehicle records are only visible to your authenticated account.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 bg-muted/20 border-t border-border/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Why Track Your Electric Scooter Charging?
              </h2>
              <p className="text-sm text-muted-foreground">
                Smart EV ownership starts with actionable energy metrics.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex gap-3 p-4 rounded-xl bg-card border border-border/60">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-foreground">Accurate Home Electricity Accounting</h4>
                  <p className="text-xs text-muted-foreground">
                    Know precisely how much your Ola scooter adds to your monthly domestic power bill.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-4 rounded-xl bg-card border border-border/60">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-foreground">Proof of EV Savings</h4>
                  <p className="text-xs text-muted-foreground">
                    Quantify your real savings over internal combustion engine (ICE) petrol scooters down to the exact rupee.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-4 rounded-xl bg-card border border-border/60">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-foreground">Long-Term Battery Health Trends</h4>
                  <p className="text-xs text-muted-foreground">
                    Observe typical charge percentages and cycle depth patterns to prolong battery longevity.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-4 rounded-xl bg-card border border-border/60">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-foreground">Export Anytime in CSV & Excel</h4>
                  <p className="text-xs text-muted-foreground">
                    Export your complete log with one click for personal spreadsheets, reimbursement claims, or tax filings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to track your Ola scooter?
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Takes less than 60 seconds to configure your scooter and record your first charge.
          </p>
          <Link href="/register">
            <Button size="lg" className="text-base font-semibold px-8 py-6 shadow-xl shadow-primary/25">
              <Zap className="mr-2 h-5 w-5" />
              Create Free Account
            </Button>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-8 bg-card/40 text-center text-xs text-muted-foreground space-y-2">
        <div className="flex items-center justify-center gap-2 font-bold text-foreground">
          <Zap className="h-4 w-4 text-primary" />
          <span>Ola Charge Tracker</span>
        </div>
        <p>Built for Ola Electric scooter riders and EV enthusiasts.</p>
        <p className="text-[11px] text-muted-foreground/70">
          Independent community tracker. Not affiliated with or endorsed by ANI Technologies / Ola Electric.
        </p>
      </footer>
    </div>
  );
}

