"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { VisualBatteryGauge } from "@/components/ui/battery-gauge";
import {
  ChargePulseButton,
  LiveStatusPill,
  SpotlightCard,
  TactileSwitch,
} from "@/components/ui/uiverse";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Zap,
  BatteryCharging,
  ShieldCheck,
  Smartphone,
  Gauge,
  ArrowRight,
  CheckCircle2,
  Bike,
} from "lucide-react";

export default function LandingPage() {
  const { user } = useAuth();

  // Interactive Live Calculator Preview for Public Visitors
  const [calcStart, setCalcStart] = useState<number>(28);
  const [calcEnd, setCalcEnd] = useState<number>(100);
  const [calcCap, setCalcCap] = useState<number>(4); // 4 kWh for Ola S1 Pro Gen 2
  const [calcRate, setCalcRate] = useState<number>(12); // ₹12/unit
  const [includeLoss, setIncludeLoss] = useState<boolean>(true);
  const [calcLoss, setCalcLoss] = useState<number>(10); // 10% loss

  const activeLoss = includeLoss ? calcLoss : 0;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {/* Navigation Header */}
        <header className="border-b border-border/60 ios-material sticky top-0 z-50 pt-safe">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                <Zap className="h-4 w-4 fill-current" />
              </div>
              <span className="font-bold text-base sm:text-lg tracking-tight">
                Ola Charge <span className="text-primary font-medium text-xs sm:text-sm">Tracker</span>
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {user ? (
                <Link href="/dashboard">
                  <ChargePulseButton size="sm">
                    <span>Go to Dashboard</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </ChargePulseButton>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm" className="text-xs font-semibold ios-touch">
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/register">
                    <ChargePulseButton size="sm">Get Started Free</ChargePulseButton>
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
              <LiveStatusPill label="Built for Ola Electric & Modern EV Riders" />

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight max-w-4xl mx-auto leading-tight">
                Track EV Charging, Grid Units &amp;{" "}
                <span className="text-primary">Every Single Rupee</span>
              </h1>

              <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Calculate exact wall electricity drawn after thermal charging loss. Monitor cost per kilometre, log odometer trips, and keep your private charging diary.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link href={user ? "/dashboard" : "/register"} className="w-full sm:w-auto">
                  <ChargePulseButton size="lg" className="w-full sm:w-auto">
                    <Zap className="h-4 w-4 fill-current" />
                    <span>{user ? "Open Dashboard" : "Start Tracking Free"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </ChargePulseButton>
                </Link>
                <a href="#calculator" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-6 ios-touch">
                    Try Live Calculator
                  </Button>
                </a>
              </div>

              <div className="pt-3 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  100% Private Cloud Storage
                </span>
                <span className="flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-primary" />
                  iOS &amp; Android Installable PWA
                </span>
              </div>
            </div>
          </section>

          {/* Interactive Charging Cost Calculator Preview */}
          <section id="calculator" className="py-14 bg-muted/20 border-y border-border/60">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              <div className="text-center space-y-2">
                <Badge variant="outline" className="text-primary border-primary/30">
                  Live Formula Simulator
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Try the EV Charging Calculator
                </h2>
                <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                  Drag the battery sliders and adjust tariff rates to inspect exact grid consumption before signing up.
                </p>
              </div>

              <VisualBatteryGauge
                startPct={calcStart}
                endPct={calcEnd}
                capacityKwh={calcCap}
                lossPct={activeLoss}
                ratePerKwh={calcRate}
                onRangeChange={(s, e) => {
                  setCalcStart(s);
                  setCalcEnd(e);
                }}
                interactive={true}
              />

              <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <Bike className="h-4 w-4 text-primary" />
                    <span>Scooter &amp; Tariff Parameters</span>
                  </div>
                  <TactileSwitch
                    id="loss-toggle"
                    checked={includeLoss}
                    onCheckedChange={setIncludeLoss}
                    label="Account for charger thermal loss"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="landing-cap" className="text-xs">Capacity (kWh)</Label>
                    <Input
                      id="landing-cap"
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={calcCap}
                      onChange={(e) => setCalcCap(parseFloat(e.target.value) || 0)}
                      className="font-mono-num"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="landing-rate" className="text-xs">Rate (₹/kWh)</Label>
                    <Input
                      id="landing-rate"
                      type="number"
                      step="0.5"
                      min="1"
                      value={calcRate}
                      onChange={(e) => setCalcRate(parseFloat(e.target.value) || 0)}
                      className="font-mono-num"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="landing-loss" className="text-xs">Charger Loss (%)</Label>
                    <Input
                      id="landing-loss"
                      type="number"
                      min="0"
                      max="40"
                      disabled={!includeLoss}
                      value={includeLoss ? calcLoss : 0}
                      onChange={(e) => setCalcLoss(parseFloat(e.target.value) || 0)}
                      className="font-mono-num"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Feature Highlights Grid */}
          <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Engineered for Electric Two-Wheelers
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                Everything you need to track energy consumption, cost efficiency, and battery trends over time.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <SpotlightCard>
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center mb-2">
                    <BatteryCharging className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">Loss-Compensated Math</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">
                    Charging an EV incurs heat and converter losses. We calculate true grid draw so your electricity bill matches your log.
                  </CardDescription>
                </CardHeader>
              </SpotlightCard>

              <SpotlightCard>
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-chart-2/15 text-chart-2 flex items-center justify-center mb-2">
                    <Gauge className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">True Cost Per Kilometre</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">
                    Pair charging cycles with odometer readings to reveal your exact cost per km and compare running costs against petrol.
                  </CardDescription>
                </CardHeader>
              </SpotlightCard>

              <SpotlightCard>
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-chart-4/15 text-chart-4 flex items-center justify-center mb-2">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">Private User Isolation</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">
                    Protected by Firebase Authentication and Firestore Security Rules. Your scooter records remain strictly private.
                  </CardDescription>
                </CardHeader>
              </SpotlightCard>
            </div>
          </section>

          {/* Benefits Section */}
          <section className="py-14 bg-muted/20 border-t border-border/60">
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
                <div className="flex gap-3 p-4 rounded-xl bg-card border border-border">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-foreground">Accurate Home Electricity Accounting</h4>
                    <p className="text-xs text-muted-foreground">
                      Know precisely how much your Ola scooter adds to your monthly domestic power bill.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 p-4 rounded-xl bg-card border border-border">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-foreground">Proof of EV Savings</h4>
                    <p className="text-xs text-muted-foreground">
                      Quantify your real savings over petrol scooters down to the exact rupee.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 p-4 rounded-xl bg-card border border-border">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-foreground">Long-Term Battery Health Trends</h4>
                    <p className="text-xs text-muted-foreground">
                      Observe typical charge percentages and cycle depth patterns to prolong battery longevity.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 p-4 rounded-xl bg-card border border-border">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-foreground">Export Anytime in CSV &amp; Excel</h4>
                    <p className="text-xs text-muted-foreground">
                      Export your complete log with one click for personal spreadsheets or reimbursement claims.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">
              Ready to track your Ola scooter?
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Takes less than 60 seconds to configure your scooter and record your first charge.
            </p>
            <div className="flex justify-center">
              <Link href={user ? "/dashboard" : "/register"}>
                <ChargePulseButton size="lg">
                  <Zap className="h-4 w-4 fill-current" />
                  <span>{user ? "Go to Dashboard" : "Create Free Account"}</span>
                </ChargePulseButton>
              </Link>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/60 py-8 pb-safe bg-card/40 text-center text-xs text-muted-foreground space-y-2">
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
    </TooltipProvider>
  );
}

