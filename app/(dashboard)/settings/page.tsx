"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useScooter } from "@/lib/scooter-context";
import { useTheme } from "@/lib/theme-provider";
import { updateScooter, updateUserProfile, seedDemoSessions } from "@/lib/firestore";
import { SCOOTER_MODELS, type ScooterFormData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings as SettingsIcon,
  Bike,
  User,
  Palette,
  ShieldCheck,
  Loader2,
  Lock,
  Sun,
  Moon,
  Laptop,
  Sparkles,
  Database,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const router = useRouter();
  const { user, userProfile, refreshProfile } = useAuth();
  const { scooter, refreshScooter } = useScooter();
  const { theme, setTheme } = useTheme();

  // Profile State
  const [displayName, setDisplayName] = useState(userProfile?.displayName || "");
  const [currency, setCurrency] = useState(userProfile?.currency || "₹");
  const [savingProfile, setSavingProfile] = useState(false);

  // Demo state
  const [seedingDemo, setSeedingDemo] = useState(false);

  // Scooter State
  const [scooterForm, setScooterForm] = useState<ScooterFormData>({
    name: scooter?.name || "",
    model: scooter?.model || "Ola S1 Pro Gen 2",
    batteryCapacity: scooter?.batteryCapacity || 4,
    electricityRate: scooter?.electricityRate || 12,
    chargingLoss: scooter?.chargingLoss || 10,
    registrationNumber: scooter?.registrationNumber || "",
    currentOdometer: scooter?.currentOdometer,
  });
  const [savingScooter, setSavingScooter] = useState(false);

  useEffect(() => {
    if (scooter) {
      setScooterForm({
        name: scooter.name,
        model: scooter.model,
        batteryCapacity: scooter.batteryCapacity,
        electricityRate: scooter.electricityRate,
        chargingLoss: scooter.chargingLoss,
        registrationNumber: scooter.registrationNumber || "",
        currentOdometer: scooter.currentOdometer,
      });
    }
  }, [scooter]);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || "");
      setCurrency(userProfile.currency || "₹");
    }
  }, [userProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    try {
      await updateUserProfile(user.uid, {
        displayName: displayName.trim(),
        currency,
        theme,
      });
      await refreshProfile();
      toast.success("Profile preferences saved");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile";
      toast.error(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveScooter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !scooter) return;

    if (!scooterForm.name.trim()) {
      toast.error("Scooter name cannot be empty");
      return;
    }
    if (scooterForm.batteryCapacity <= 0) {
      toast.error("Battery capacity must be greater than zero");
      return;
    }
    if (scooterForm.electricityRate <= 0) {
      toast.error("Electricity rate must be greater than zero");
      return;
    }

    setSavingScooter(true);
    try {
      await updateScooter(user.uid, scooter.id, scooterForm);
      await refreshScooter();
      toast.success("Scooter configuration updated");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update scooter";
      toast.error(msg);
    } finally {
      setSavingScooter(false);
    }
  };

  // Seed Realistic Demo Data
  const handleSeedDemo = async () => {
    if (!user || !scooter) {
      toast.error("Scooter not ready");
      return;
    }
    setSeedingDemo(true);
    try {
      const count = await seedDemoSessions(user.uid, scooter);
      toast.success(`Success! Generated ${count} realistic charging sessions across the last 3 months.`);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate demo records";
      toast.error(msg);
    } finally {
      setSeedingDemo(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <SettingsIcon className="h-4 w-4" />
          Configuration
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
          Settings & Preferences
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your scooter specs, electricity tariff, demo data, and theme
        </p>
      </div>

      <Tabs defaultValue="scooter" className="space-y-6">
        <TabsList className="bg-card/70 border border-border/60 p-1">
          <TabsTrigger value="scooter" className="gap-2 text-xs">
            <Bike className="h-3.5 w-3.5" />
            Scooter Specs
          </TabsTrigger>
          <TabsTrigger value="demo" className="gap-2 text-xs">
            <Database className="h-3.5 w-3.5" />
            Demo Showcase
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2 text-xs">
            <User className="h-3.5 w-3.5" />
            Profile & Currency
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2 text-xs">
            <Palette className="h-3.5 w-3.5" />
            Appearance
          </TabsTrigger>
        </TabsList>

        {/* Scooter Configuration Tab */}
        <TabsContent value="scooter" className="space-y-4">
          <Card className="border-border/60 shadow-md bg-card/70">
            <CardHeader>
              <CardTitle className="text-lg">Scooter Parameters</CardTitle>
              <CardDescription>
                Updates here define the defaults for upcoming charging sessions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 rounded-lg bg-primary/10 border border-primary/20 p-3.5 text-xs space-y-1">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Historical Integrity Protected
                </div>
                <p className="text-muted-foreground">
                  Modifying your electricity rate or battery capacity will{" "}
                  <span className="font-semibold text-foreground">
                    never alter historical charging records
                  </span>
                  . Past sessions retain their exact original inputs and costs.
                </p>
              </div>

              <form id="scooter-form" onSubmit={handleSaveScooter} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="scooter-name">Scooter Name</Label>
                    <Input
                      id="scooter-name"
                      value={scooterForm.name}
                      onChange={(e) => setScooterForm({ ...scooterForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scooter-model">Model</Label>
                    <Select
                      value={scooterForm.model}
                      onValueChange={(val) => setScooterForm({ ...scooterForm, model: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {SCOOTER_MODELS.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Battery Capacity (kWh)</Label>
                    <Input
                      id="capacity"
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="50"
                      value={scooterForm.batteryCapacity}
                      onChange={(e) =>
                        setScooterForm({
                          ...scooterForm,
                          batteryCapacity: parseFloat(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rate">Default Rate (₹/kWh)</Label>
                    <Input
                      id="rate"
                      type="number"
                      step="0.5"
                      min="0.1"
                      max="100"
                      value={scooterForm.electricityRate}
                      onChange={(e) =>
                        setScooterForm({
                          ...scooterForm,
                          electricityRate: parseFloat(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="loss">Charging Loss (%)</Label>
                    <Input
                      id="loss"
                      type="number"
                      step="1"
                      min="0"
                      max="40"
                      value={scooterForm.chargingLoss}
                      onChange={(e) =>
                        setScooterForm({
                          ...scooterForm,
                          chargingLoss: parseFloat(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/50">
                  <div className="space-y-2">
                    <Label htmlFor="reg">Registration Number</Label>
                    <Input
                      id="reg"
                      value={scooterForm.registrationNumber || ""}
                      onChange={(e) =>
                        setScooterForm({ ...scooterForm, registrationNumber: e.target.value })
                      }
                      placeholder="e.g. MH 12 AB 1234"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="odo">Current Odometer (km)</Label>
                    <Input
                      id="odo"
                      type="number"
                      value={scooterForm.currentOdometer ?? ""}
                      onChange={(e) =>
                        setScooterForm({
                          ...scooterForm,
                          currentOdometer: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
                      placeholder="e.g. 2400"
                    />
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter className="border-t border-border/40 pt-4">
              <Button type="submit" form="scooter-form" disabled={savingScooter}>
                {savingScooter && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Scooter Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Demo Showcase Tab */}
        <TabsContent value="demo" className="space-y-4">
          <Card className="border-primary/40 bg-card/70 shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="h-4 w-4" />
                Demo & Presentation Tool
              </div>
              <CardTitle className="text-lg">Instant Realistic Demo Data</CardTitle>
              <CardDescription>
                Preparing a video demo, portfolio review, or testing features? Populate 12 realistic charging sessions across the last 3 months with real graphs, odometer calculations, and insights in 1 tap.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-muted-foreground">
              <div className="p-4 rounded-xl bg-muted/40 border border-border/50 space-y-2">
                <div className="font-semibold text-foreground text-sm flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  What will be generated:
                </div>
                <ul className="list-disc list-inside space-y-1">
                  <li>12 charging sessions spread over the past 90 days</li>
                  <li>Real battery percentages (15% ➔ 95%, 20% ➔ 100%, 35% ➔ 85%)</li>
                  <li>Odometer deltas calculating authentic EV running costs (~₹0.38/km)</li>
                  <li>Locations: Home, Office, and Ola Hypercharger</li>
                  <li>Fully interactive charts on Dashboard and Analytics</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="border-t border-border/40 pt-4">
              <Button
                type="button"
                onClick={handleSeedDemo}
                disabled={seedingDemo}
                className="font-semibold shadow-md shadow-primary/20 gap-2"
              >
                {seedingDemo ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating 12 records...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate 12 Demo Charging Sessions
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Profile & Currency Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card className="border-border/60 shadow-md bg-card/70">
            <CardHeader>
              <CardTitle className="text-lg">User Profile & Currency</CardTitle>
              <CardDescription>
                Manage your public name and regional currency format
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form id="profile-form" onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-muted text-muted-foreground cursor-not-allowed"
                    />
                    <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Email managed by Firebase Authentication
                  </span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency Symbol</Label>
                  <Select value={currency} onValueChange={(val) => setCurrency(val)}>
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="₹">₹ (INR - Indian Rupee)</SelectItem>
                      <SelectItem value="$">$ (USD - US Dollar)</SelectItem>
                      <SelectItem value="€">€ (EUR - Euro)</SelectItem>
                      <SelectItem value="£">£ (GBP - British Pound)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </form>
            </CardContent>
            <CardFooter className="border-t border-border/40 pt-4">
              <Button type="submit" form="profile-form" disabled={savingProfile}>
                {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Profile
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-4">
          <Card className="border-border/60 shadow-md bg-card/70">
            <CardHeader>
              <CardTitle className="text-lg">Visual Theme</CardTitle>
              <CardDescription>
                Select your preferred color scheme for desktop and mobile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2 ${
                    theme === "dark"
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border/70 hover:border-border hover:bg-muted/30 text-muted-foreground"
                  }`}
                >
                  <Moon className="h-6 w-6" />
                  <span className="text-xs">Dark (EV Navy)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2 ${
                    theme === "light"
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border/70 hover:border-border hover:bg-muted/30 text-muted-foreground"
                  }`}
                >
                  <Sun className="h-6 w-6" />
                  <span className="text-xs">Light</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("system")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2 ${
                    theme === "system"
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border/70 hover:border-border hover:bg-muted/30 text-muted-foreground"
                  }`}
                >
                  <Laptop className="h-6 w-6" />
                  <span className="text-xs">System</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
