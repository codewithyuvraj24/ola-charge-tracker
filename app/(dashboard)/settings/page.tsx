"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useScooter } from "@/lib/scooter-context";
import { updateScooter, updateUserProfile } from "@/lib/firestore";
import { SCOOTER_MODELS, type ScooterFormData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemePreviewSwitcher } from "@/components/ui/theme-switcher";
import {
  Settings as SettingsIcon,
  Bike,
  User,
  Palette,
  ShieldCheck,
  Loader2,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user, userProfile, refreshProfile } = useAuth();
  const { scooter, refreshScooter } = useScooter();

  // Profile State
  const [displayName, setDisplayName] = useState(userProfile?.displayName || "");
  const [currency, setCurrency] = useState(userProfile?.currency || "₹");
  const [savingProfile, setSavingProfile] = useState(false);

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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <SettingsIcon className="h-4 w-4" />
          Settings
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
          App Customization & Specs
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Switch themes live or configure your scooter battery profile
        </p>
      </div>

      <Tabs defaultValue="appearance" className="space-y-6">
        <TabsList className="ios-glass p-1 rounded-2xl">
          <TabsTrigger value="appearance" className="gap-2 text-xs rounded-xl">
            <Palette className="h-3.5 w-3.5 text-primary" />
            Theme Gallery (Live Demo)
          </TabsTrigger>
          <TabsTrigger value="scooter" className="gap-2 text-xs rounded-xl">
            <Bike className="h-3.5 w-3.5" />
            Scooter Specs
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2 text-xs rounded-xl">
            <User className="h-3.5 w-3.5" />
            Profile & Currency
          </TabsTrigger>
        </TabsList>

        {/* Live Theme Gallery Tab */}
        <TabsContent value="appearance" className="space-y-4">
          <Card className="ios-glass-card p-5 space-y-3">
            <div>
              <CardTitle className="text-base font-bold">Select Active Visual Theme</CardTitle>
              <CardDescription className="text-xs">
                Tap any card to instantly switch the entire app&apos;s colors and contrast live.
              </CardDescription>
            </div>
            <ThemePreviewSwitcher />
          </Card>
        </TabsContent>

        {/* Scooter Configuration Tab */}
        <TabsContent value="scooter" className="space-y-4">
          <Card className="ios-glass-card p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs text-primary font-semibold">
              <ShieldCheck className="h-4 w-4" />
              Historical Integrity Guaranteed: Changes apply only to new sessions.
            </div>

            <form id="scooter-form" onSubmit={handleSaveScooter} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="scooter-name" className="text-xs">Scooter Name</Label>
                  <Input
                    id="scooter-name"
                    value={scooterForm.name}
                    onChange={(e) => setScooterForm({ ...scooterForm, name: e.target.value })}
                    className="rounded-xl h-11"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="scooter-model" className="text-xs">Model</Label>
                  <Select
                    value={scooterForm.model}
                    onValueChange={(val) => setScooterForm({ ...scooterForm, model: val })}
                  >
                    <SelectTrigger className="rounded-xl h-11">
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

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Capacity (kWh)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={scooterForm.batteryCapacity}
                    onChange={(e) =>
                      setScooterForm({
                        ...scooterForm,
                        batteryCapacity: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="rounded-xl h-11"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Rate (₹/kWh)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={scooterForm.electricityRate}
                    onChange={(e) =>
                      setScooterForm({
                        ...scooterForm,
                        electricityRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="rounded-xl h-11"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Loss (%)</Label>
                  <Input
                    type="number"
                    value={scooterForm.chargingLoss}
                    onChange={(e) =>
                      setScooterForm({
                        ...scooterForm,
                        chargingLoss: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="rounded-xl h-11"
                  />
                </div>
              </div>

              <Button type="submit" disabled={savingScooter} className="rounded-xl font-bold text-xs mt-2">
                {savingScooter ? "Saving..." : "Save Scooter Settings"}
              </Button>
            </form>
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card className="ios-glass-card p-5 space-y-4">
            <form id="profile-form" onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs">Display Name</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="rounded-xl h-11"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Currency</Label>
                <Select value={currency} onValueChange={(val) => setCurrency(val)}>
                  <SelectTrigger className="rounded-xl h-11">
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

              <Button type="submit" disabled={savingProfile} className="rounded-xl font-bold text-xs">
                {savingProfile ? "Saving..." : "Save Preferences"}
              </Button>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
