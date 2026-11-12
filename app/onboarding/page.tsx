"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { completeOnboarding } from "@/lib/firestore";
import { SCOOTER_MODELS, DEFAULT_SCOOTER, type ScooterFormData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Bike, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, userProfile, loading, refreshProfile } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<ScooterFormData>({
    name: DEFAULT_SCOOTER.name,
    model: DEFAULT_SCOOTER.model,
    batteryCapacity: DEFAULT_SCOOTER.batteryCapacity,
    electricityRate: DEFAULT_SCOOTER.electricityRate,
    chargingLoss: DEFAULT_SCOOTER.chargingLoss,
    registrationNumber: "",
    currentOdometer: undefined,
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (!loading && userProfile?.onboardingComplete) {
      router.push("/dashboard");
    }
  }, [user, userProfile, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.name.trim()) {
      toast.error("Please enter a name for your scooter");
      return;
    }
    if (formData.batteryCapacity <= 0) {
      toast.error("Battery capacity must be greater than 0");
      return;
    }
    if (formData.electricityRate <= 0) {
      toast.error("Electricity rate must be greater than 0");
      return;
    }

    setSubmitting(true);
    try {
      await completeOnboarding(user.uid, formData);
      await refreshProfile();
      toast.success("Scooter configured! Welcome to your dashboard.");
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save configuration";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-primary font-bold text-xl">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
              <Bike className="h-6 w-6" />
            </div>
            <span>Setup Your Scooter</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">One quick step before you begin</h1>
          <p className="text-sm text-muted-foreground">
            Configure your electric scooter&apos;s battery and local power rate for precise calculations
          </p>
        </div>

        <Card className="border-border/60 shadow-xl bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-4 w-4" />
              Default configuration loaded
            </div>
            <CardTitle className="text-xl">Vehicle & Energy Profile</CardTitle>
            <CardDescription>
              We&apos;ve preloaded settings for the popular Ola S1 Pro Gen 2. You can customize them now or anytime in Settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form id="onboarding-form" onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Scooter Nickname *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. My Ola S1 Pro"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Scooter Model *</Label>
                  <Select
                    value={formData.model}
                    onValueChange={(val) => {
                      let capacity = formData.batteryCapacity;
                      if (val.includes("Gen 2") || val.includes("Pro Gen 1")) capacity = 4;
                      else if (val.includes("Air")) capacity = 3;
                      else if (val.includes("X+")) capacity = 3;
                      else if (val.includes("X")) capacity = 2;
                      setFormData({ ...formData, model: val, batteryCapacity: capacity });
                    }}
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
                  <Label htmlFor="capacity">Battery Capacity (kWh) *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="50"
                    value={formData.batteryCapacity}
                    onChange={(e) =>
                      setFormData({ ...formData, batteryCapacity: parseFloat(e.target.value) || 0 })
                    }
                    required
                  />
                  <span className="text-[11px] text-muted-foreground">Ola S1 Pro is 4 kWh</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rate">Electricity Rate (₹/kWh) *</Label>
                  <Input
                    id="rate"
                    type="number"
                    step="0.5"
                    min="1"
                    max="100"
                    value={formData.electricityRate}
                    onChange={(e) =>
                      setFormData({ ...formData, electricityRate: parseFloat(e.target.value) || 0 })
                    }
                    required
                  />
                  <span className="text-[11px] text-muted-foreground">Default ₹12/unit</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loss">Charging Loss (%) *</Label>
                  <Input
                    id="loss"
                    type="number"
                    step="1"
                    min="0"
                    max="40"
                    value={formData.chargingLoss}
                    onChange={(e) =>
                      setFormData({ ...formData, chargingLoss: parseFloat(e.target.value) || 0 })
                    }
                    required
                  />
                  <span className="text-[11px] text-muted-foreground">Standard EV loss: 10%</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/40">
                <div className="space-y-2">
                  <Label htmlFor="reg">Registration Number (Optional)</Label>
                  <Input
                    id="reg"
                    placeholder="e.g. MH 12 AB 1234"
                    value={formData.registrationNumber || ""}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="odometer">Current Odometer (km, Optional)</Label>
                  <Input
                    id="odometer"
                    type="number"
                    placeholder="e.g. 1500"
                    value={formData.currentOdometer ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currentOdometer: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
              </div>

              <div className="rounded-lg bg-muted/40 p-3.5 border border-border/50 text-xs text-muted-foreground space-y-1">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  Formula guarantee
                </div>
                <div>
                  Grid Consumption = (Added % / 100 × Capacity) ÷ (1 - Loss %)
                </div>
                <div>Cost = Grid Consumption × Electricity Rate</div>
              </div>
            </form>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              form="onboarding-form"
              className="w-full text-base font-semibold py-5"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up your tracker...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Save & Go to Dashboard
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

