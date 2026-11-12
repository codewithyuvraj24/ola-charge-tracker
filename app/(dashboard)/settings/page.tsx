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
        <TabsList className="grid w-full grid-cols-3 sm:inline-flex sm:w-auto">
          <TabsTrigger value="appearance" className="gap-2 text-xs">
            <Palette className="h-3.5 w-3.5 text-primary" />
            <span className="truncate">Themes</span>
          </TabsTrigger>
          <TabsTrigger value="scooter" className="gap-2 text-xs">
            <Bike className="h-3.5 w-3.5" />
            <span className="truncate">Scooter Specs</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2 text-xs">
            <User className="h-3.5 w-3.5" />
            <span className="truncate">Profile</span>
          </TabsTrigger>
        </TabsList>

        {/* Live Theme Gallery Tab */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Select Active Visual Theme</CardTitle>
              <CardDescription className="text-xs">
                Tap any theme to switch the entire app&apos;s palette and contrast live.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ThemePreviewSwitcher />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scooter Configuration Tab */}
        <TabsContent value="scooter" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Vehicle & Tariff Configuration</CardTitle>
              <CardDescription className="flex items-center gap-1.5 text-xs text-primary font-medium pt-0.5">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                Historical Integrity Guaranteed: Changes apply only to new sessions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form id="scooter-form" onSubmit={handleSaveScooter} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="scooter-name" className="text-xs">Scooter Name</Label>
                    <Input
                      id="scooter-name"
                      value={scooterForm.name}
                      onChange={(e) => setScooterForm({ ...scooterForm, name: e.target.value })}
                      className="h-10"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="scooter-model" className="text-xs">Model</Label>
                    <Select
                      value={scooterForm.model}
                      onValueChange={(val) => setScooterForm({ ...scooterForm, model: val })}
                    >
                      <SelectTrigger id="scooter-model" className="h-10">
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="scooter-cap" className="text-xs">Capacity (kWh)</Label>
                    <Input
                      id="scooter-cap"
                      type="number"
                      step="0.1"
                      value={scooterForm.batteryCapacity}
                      onChange={(e) =>
                        setScooterForm({
                          ...scooterForm,
                          batteryCapacity: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="h-10 font-mono-num"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="scooter-rate" className="text-xs">Rate (₹/kWh)</Label>
                    <Input
                      id="scooter-rate"
                      type="number"
                      step="0.5"
                      value={scooterForm.electricityRate}
                      onChange={(e) =>
                        setScooterForm({
                          ...scooterForm,
                          electricityRate: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="h-10 font-mono-num"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="scooter-loss" className="text-xs">Loss (%)</Label>
                    <Input
                      id="scooter-loss"
                      type="number"
                      value={scooterForm.chargingLoss}
                      onChange={(e) =>
                        setScooterForm({
                          ...scooterForm,
                          chargingLoss: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="h-10 font-mono-num"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={savingScooter} className="font-semibold text-xs ios-touch">
                  {savingScooter && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                  {savingScooter ? "Saving..." : "Save Scooter Settings"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Profile & Display Preferences</CardTitle>
              <CardDescription className="text-xs">
                Manage your display name and preferred currency symbol.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form id="profile-form" onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="profile-name" className="text-xs">Display Name</Label>
                  <Input
                    id="profile-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="h-10"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="profile-currency" className="text-xs">Currency</Label>
                  <Select value={currency} onValueChange={(val) => setCurrency(val)}>
                    <SelectTrigger id="profile-currency" className="h-10">
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

                <Button type="submit" disabled={savingProfile} className="font-semibold text-xs ios-touch">
                  {savingProfile && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                  {savingProfile ? "Saving..." : "Save Preferences"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
