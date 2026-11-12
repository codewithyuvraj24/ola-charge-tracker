"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useTheme, APP_THEMES } from "@/lib/theme-provider";
import { calculateSession } from "@/lib/calculations";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { VisualBatteryGauge } from "@/components/ui/battery-gauge";
import {
  ChargePulseButton,
  LiveStatusPill,
  SpotlightCard,
  TactileSwitch,
} from "@/components/ui/uiverse";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Zap,
  ShieldCheck,
  Smartphone,
  ArrowRight,
  Lock,
  FileSpreadsheet,
  Palette,
  Gauge,
  Flame,
} from "lucide-react";

const SCOOTER_PRESETS = [
  { label: "S1 Pro", capacity: 4 },
  { label: "S1 Air", capacity: 3 },
  { label: "S1 X", capacity: 2 },
];

export default function LandingPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  // Live Interactive Simulator State (synced across Hero & Bento Formula Breakdown)
  const [calcStart, setCalcStart] = useState<number>(20);
  const [calcEnd, setCalcEnd] = useState<number>(100);
  const [calcCap, setCalcCap] = useState<number>(4);
  const [calcRate, setCalcRate] = useState<number>(12);
  const [includeLoss, setIncludeLoss] = useState<boolean>(true);
  const [calcLoss, setCalcLoss] = useState<number>(10);

  const activeLoss = includeLoss ? calcLoss : 0;
  const efficiencyPct = Math.max(0, 100 - activeLoss);

  const liveCalc = useMemo(() => {
    if (calcEnd <= calcStart) return null;
    return calculateSession(calcStart, calcEnd, calcCap, calcRate, activeLoss);
  }, [calcStart, calcEnd, calcCap, calcRate, activeLoss]);

  const cycleTheme = () => {
    const idx = APP_THEMES.indexOf(theme);
    setTheme(APP_THEMES[(idx + 1) % APP_THEMES.length]);
  };

  // Illustrative per-km math at ~32 km real-world range per kWh stored
  const estRangeKm = liveCalc ? liveCalc.energyStored * 32 : 0;
  const estEvCostPerKm = liveCalc && estRangeKm > 0 ? liveCalc.totalCost / estRangeKm : 0;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {/* Compact Sticky Frosted Header */}
        <header className="border-b border-border/70 ios-material sticky top-0 z-50 pt-safe">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                <Zap className="h-4 w-4 fill-current" />
              </div>
              <span className="font-bold text-base tracking-tight">
                Ola Charge
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
              <a href="#simulator" className="hover:text-foreground transition-colors">
                Simulator
              </a>
              <a href="#architecture" className="hover:text-foreground transition-colors">
                Formula &amp; Bento
              </a>
              <a href="#workflow" className="hover:text-foreground transition-colors">
                Workflow
              </a>
              <a href="#faq" className="hover:text-foreground transition-colors">
                FAQ
              </a>
            </nav>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={cycleTheme}
                className="hidden sm:inline-flex gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                title="Preview live app themes"
              >
                <Palette className="h-3.5 w-3.5 text-primary" />
                <span className="capitalize">{theme}</span>
              </Button>

              {user ? (
                <Link href="/dashboard">
                  <ChargePulseButton size="sm">
                    <span>Dashboard</span>
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
                    <ChargePulseButton size="sm">Get Started</ChargePulseButton>
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1">
          {/* 1. Asymmetric Split Hero + Above-the-Fold Simulator */}
          <section id="simulator" className="py-10 sm:py-16 lg:py-20 border-b border-border/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
                {/* Left Editorial Column (5 cols) */}
                <div className="lg:col-span-5 space-y-6 text-left">
                  <LiveStatusPill label="EV Energy Telemetry • v2" />

                  <div className="space-y-3">
                    <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.08]">
                      Know what your scooter{" "}
                      <span className="text-primary">actually draws</span> from the wall.
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Dashboard apps only show battery percentages. Ola Charge logs wall grid units after charger heat loss, tracks tariff rates per session, and calculates real cost per kilometre.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <Link href={user ? "/dashboard" : "/register"}>
                      <ChargePulseButton size="lg" className="w-full sm:w-auto">
                        <Zap className="h-4 w-4 fill-current" />
                        <span>{user ? "Open Dashboard" : "Start Free Logbook"}</span>
                        <ArrowRight className="h-4 w-4" />
                      </ChargePulseButton>
                    </Link>
                    <a href="#architecture">
                      <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 ios-touch">
                        See the Math
                      </Button>
                    </a>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <div>
                      <div className="text-xs font-semibold text-foreground font-mono-num">
                        10% Loss
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Wall-to-pack math
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground font-mono-num">
                        ₹ / km
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Odometer linked
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground font-mono-num">
                        CSV / XLSX
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        1-tap exports
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Interactive Telemetry Panel (7 cols) */}
                <div className="lg:col-span-7 space-y-3">
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

                  <Card className="border-border bg-card/80">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-medium text-muted-foreground mr-1">
                            Model preset:
                          </span>
                          {SCOOTER_PRESETS.map((p) => (
                            <Button
                              key={p.label}
                              type="button"
                              size="sm"
                              variant={calcCap === p.capacity ? "secondary" : "outline"}
                              onClick={() => setCalcCap(p.capacity)}
                              className="h-7 px-2.5 text-xs font-mono-num ios-touch"
                            >
                              {p.label} ({p.capacity}kWh)
                            </Button>
                          ))}
                        </div>

                        <TactileSwitch
                          id="hero-loss-toggle"
                          checked={includeLoss}
                          onCheckedChange={setIncludeLoss}
                          label="Include 10% charger loss"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3 pt-1">
                        <div className="space-y-1">
                          <Label htmlFor="hero-cap" className="text-[11px] text-muted-foreground">
                            Pack (kWh)
                          </Label>
                          <Input
                            id="hero-cap"
                            type="number"
                            step="0.5"
                            min="0.5"
                            value={calcCap}
                            onChange={(e) => setCalcCap(parseFloat(e.target.value) || 0)}
                            className="h-9 font-mono-num text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="hero-rate" className="text-[11px] text-muted-foreground">
                            Tariff (₹/kWh)
                          </Label>
                          <Input
                            id="hero-rate"
                            type="number"
                            step="0.5"
                            min="1"
                            value={calcRate}
                            onChange={(e) => setCalcRate(parseFloat(e.target.value) || 0)}
                            className="h-9 font-mono-num text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="hero-loss" className="text-[11px] text-muted-foreground">
                            Loss (%)
                          </Label>
                          <Input
                            id="hero-loss"
                            type="number"
                            min="0"
                            max="40"
                            disabled={!includeLoss}
                            value={activeLoss}
                            onChange={(e) => setCalcLoss(parseFloat(e.target.value) || 0)}
                            className="h-9 font-mono-num text-xs"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Asymmetric Bento Architecture */}
          <section id="architecture" className="py-14 sm:py-20 bg-muted/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-1.5">
                  <Badge variant="outline" className="text-primary border-primary/30">
                    System Architecture
                  </Badge>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    Engineered for Accurate EV Accounting
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
                  Every calculation below reacts live to the battery range and tariff selected in the simulator above.
                </p>
              </div>

              {/* Top Bento Row: 7 cols Formula Breakdown + 5 cols Petrol Economics */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <SpotlightCard className="lg:col-span-7">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold">
                        Live Loss-Compensated Pipeline
                      </CardTitle>
                      <Badge variant="secondary" className="font-mono-num text-[11px]">
                        {efficiencyPct}% Transfer Efficiency
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      AC-to-DC onboard conversion dissipates heat. Wall meter billing always exceeds stored battery kWh.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-mono-num">
                        <span className="text-muted-foreground">Stored into Battery</span>
                        <span className="font-semibold text-foreground">
                          {liveCalc ? `${formatNumber(liveCalc.energyStored, 2)} kWh` : "—"}
                        </span>
                      </div>
                      <Progress value={efficiencyPct} className="h-2" />
                      <div className="flex justify-between text-[11px] text-muted-foreground font-mono-num">
                        <span>{efficiencyPct}% stored in cells</span>
                        <span>{activeLoss}% thermal loss</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 pt-1">
                      <div className="rounded-lg border border-border bg-muted/30 p-3">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          1. Delta SOC
                        </div>
                        <div className="mt-1 text-sm font-bold font-mono-num">
                          +{liveCalc ? liveCalc.addedPercentage : 0}%
                        </div>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/30 p-3">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          2. Wall Draw
                        </div>
                        <div className="mt-1 text-sm font-bold font-mono-num">
                          {liveCalc ? formatNumber(liveCalc.gridUnits, 2) : "0.00"} u
                        </div>
                      </div>
                      <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
                        <div className="text-[10px] uppercase tracking-wider text-primary">
                          3. Bill Impact
                        </div>
                        <div className="mt-1 text-sm font-bold font-mono-num text-primary">
                          {liveCalc ? formatCurrency(liveCalc.totalCost) : "₹0.00"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </SpotlightCard>

                <SpotlightCard className="lg:col-span-5">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-primary" />
                        Unit Running Economics
                      </CardTitle>
                      <Badge variant="outline" className="text-[10px] font-mono-num">
                        ~32 km/kWh
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      Estimated cost per kilometre for your current selection vs a ₹105/L petrol scooter (~45 km/L).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3.5 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-foreground">Electric Scooter</div>
                        <div className="text-[11px] text-muted-foreground">
                          Est. {formatNumber(estRangeKm, 0)} km range added
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold font-mono-num text-primary">
                          {formatCurrency(estEvCostPerKm)}/km
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border bg-muted/30 p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flame className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-xs font-semibold text-foreground">Petrol Equivalent</div>
                          <div className="text-[11px] text-muted-foreground">
                            Standard 110cc reference
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold font-mono-num text-muted-foreground">
                          ₹2.33/km
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </SpotlightCard>
              </div>

              {/* Bottom Bento Row: 3 Architectural Guarantees */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <SpotlightCard>
                  <CardHeader>
                    <div className="h-9 w-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center mb-1.5">
                      <Lock className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-base">Immutable Rate Snapshots</CardTitle>
                    <CardDescription className="text-xs leading-relaxed">
                      Updating your electricity tariff or charger loss in Settings never corrupts past logs. Every session locks its own historical snapshot.
                    </CardDescription>
                  </CardHeader>
                </SpotlightCard>

                <SpotlightCard>
                  <CardHeader>
                    <div className="h-9 w-9 rounded-lg bg-chart-2/15 text-chart-2 flex items-center justify-center mb-1.5">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-base">Private Per-User Garage</CardTitle>
                    <CardDescription className="text-xs leading-relaxed">
                      Backed by Firebase Authentication and user-scoped Firestore rules. Only your authenticated account can read or export your records.
                    </CardDescription>
                  </CardHeader>
                </SpotlightCard>

                <SpotlightCard>
                  <CardHeader>
                    <div className="h-9 w-9 rounded-lg bg-chart-3/15 text-chart-3 flex items-center justify-center mb-1.5">
                      <FileSpreadsheet className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-base">CSV, Excel &amp; iOS PWA</CardTitle>
                    <CardDescription className="text-xs leading-relaxed">
                      Export full histories to `.csv` or `.xlsx` in one tap, or add the app to your iPhone Home Screen with native safe-area ergonomics.
                    </CardDescription>
                  </CardHeader>
                </SpotlightCard>
              </div>
            </div>
          </section>

          {/* 3. Three-Step Horizontal Workflow */}
          <section id="workflow" className="py-14 sm:py-20 border-t border-border/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              <div className="max-w-xl space-y-1.5">
                <Badge variant="outline">3-Step Workflow</Badge>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  From Plug-Out to Ledger in Seconds
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    step: "01",
                    title: "Set Scooter & Tariff Once",
                    desc: "Pick your Ola S1 model (4 kWh, 3 kWh, or 2 kWh), home electricity rate, and charger loss percentage during onboarding.",
                  },
                  {
                    step: "02",
                    title: "Slide & Tap Quick Log",
                    desc: "After charging, drag the start/end battery gauge or pick a preset like 20%→80% and commit the session in one tap.",
                  },
                  {
                    step: "03",
                    title: "Audit Monthly Costs & Range",
                    desc: "Inspect monthly bar trends, filter by date window, check your real ₹/km efficiency, and export Excel reports anytime.",
                  },
                ].map((item) => (
                  <Card key={item.step} className="border-border bg-card/60">
                    <CardHeader className="space-y-2">
                      <span className="font-mono-num text-xs font-bold text-primary">
                        STEP {item.step}
                      </span>
                      <CardTitle className="text-base font-semibold">{item.title}</CardTitle>
                      <CardDescription className="text-xs leading-relaxed">
                        {item.desc}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* 4. Split FAQ + Editorial CTA */}
          <section id="faq" className="py-14 sm:py-20 bg-muted/20 border-t border-border/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left FAQ Accordion (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight">
                      Frequently Asked Questions
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Details on energy accounting, data privacy, and iOS installation.
                    </p>
                  </div>

                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="loss">
                          <AccordionTrigger className="text-sm font-medium text-left">
                            Why does wall consumption exceed battery kWh?
                          </AccordionTrigger>
                          <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                            EV portable chargers and BMS cooling fans lose roughly 8–12% of incoming AC energy as heat. Dividing stored kWh by (1 − loss%) aligns your app totals with your actual home utility meter.
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="history">
                          <AccordionTrigger className="text-sm font-medium text-left">
                            If my electricity tariff rises, will old logs change?
                          </AccordionTrigger>
                          <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                            No. Each recorded session stores the exact capacity, tariff rate, and charging loss active when it was logged. Updating Settings only applies to future sessions.
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="ios" className="border-b-0">
                          <AccordionTrigger className="text-sm font-medium text-left">
                            How do I install it on iPhone like a native app?
                          </AccordionTrigger>
                          <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                            Open the site in Safari, tap the Share button, and choose &ldquo;Add to Home Screen&rdquo;. The app automatically adapts to iOS notch safe areas and frosted bottom navigation.
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Launch Card (5 cols) */}
                <div className="lg:col-span-5">
                  <Card className="border-primary/30 bg-card shadow-sm">
                    <CardHeader className="space-y-2">
                      <LiveStatusPill label="Ready in 60 seconds" className="w-fit" />
                      <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight pt-1">
                        Start Your Private Charging Ledger
                      </CardTitle>
                      <CardDescription className="text-xs leading-relaxed">
                        Zero ads, zero clutter, and full spreadsheet ownership of your EV energy history.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Link href={user ? "/dashboard" : "/register"} className="block">
                        <ChargePulseButton size="lg" className="w-full">
                          <Zap className="h-4 w-4 fill-current" />
                          <span>{user ? "Go to Dashboard" : "Create Free Account"}</span>
                          <ArrowRight className="h-4 w-4" />
                        </ChargePulseButton>
                      </Link>
                      <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Smartphone className="h-3.5 w-3.5 text-primary" />
                          iOS &amp; Android Ready
                        </span>
                        <span>•</span>
                        <span>5 Live Themes</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
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
