"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useScooter } from "@/providers/scooter-provider";
import {
  addScooter,
  deleteScooter,
  setDefaultScooter,
  updateScooter,
  updateUserProfile,
} from "@/lib/firestore";
import {
  DEFAULT_TARIFF_PRESETS,
  SCOOTER_MODELS,
  type ScooterFormData,
  type TariffPreset,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ThemePreviewSwitcher } from "@/components/shared/theme-switcher";
import {
  Settings as SettingsIcon,
  Bike,
  User,
  Palette,
  ShieldCheck,
  Loader2,
  Plus,
  Trash2,
  Check,
  MapPin,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user, userProfile, refreshProfile } = useAuth();
  const { scooter, scooters, refreshScooter, setSelectedScooterId } = useScooter();

  // Profile & Budget State
  const [displayName, setDisplayName] = useState(userProfile?.displayName || "");
  const [currency, setCurrency] = useState(userProfile?.currency || "₹");
  const [monthlyBudget, setMonthlyBudget] = useState<string>(
    userProfile?.monthlyBudget ? String(userProfile.monthlyBudget) : ""
  );
  const [petrolPrice, setPetrolPrice] = useState<number>(userProfile?.petrolPrice ?? 105);
  const [petrolMileage, setPetrolMileage] = useState<number>(userProfile?.petrolMileage ?? 45);
  const [presets, setPresets] = useState<TariffPreset[]>(
    userProfile?.tariffPresets?.length ? userProfile.tariffPresets : DEFAULT_TARIFF_PRESETS
  );
  const [newPresetLabel, setNewPresetLabel] = useState("");
  const [newPresetLocation, setNewPresetLocation] = useState("");
  const [newPresetRate, setNewPresetRate] = useState<string>("10");
  const [savingProfile, setSavingProfile] = useState(false);

  // Active Scooter Edit State
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

  // Add New Scooter Modal State
  const [addScooterOpen, setAddScooterOpen] = useState(false);
  const [addingScooter, setAddingScooter] = useState(false);
  const [newScooterForm, setNewScooterForm] = useState<ScooterFormData>({
    name: "Second EV",
    model: "Ola S1 Air",
    batteryCapacity: 3,
    electricityRate: 12,
    chargingLoss: 10,
    registrationNumber: "",
    currentOdometer: undefined,
  });

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
      setMonthlyBudget(userProfile.monthlyBudget ? String(userProfile.monthlyBudget) : "");
      setPetrolPrice(userProfile.petrolPrice ?? 105);
      setPetrolMileage(userProfile.petrolMileage ?? 45);
      setPresets(
        userProfile.tariffPresets?.length ? userProfile.tariffPresets : DEFAULT_TARIFF_PRESETS
      );
    }
  }, [userProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    try {
      const budgetNum = monthlyBudget ? parseFloat(monthlyBudget) : 0;
      await updateUserProfile(user.uid, {
        displayName: displayName.trim(),
        currency,
        monthlyBudget: budgetNum > 0 ? budgetNum : undefined,
        petrolPrice: petrolPrice > 0 ? petrolPrice : 105,
        petrolMileage: petrolMileage > 0 ? petrolMileage : 45,
        tariffPresets: presets,
      });
      await refreshProfile();
      toast.success("Preferences, budget & presets saved");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile";
      toast.error(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddPreset = () => {
    if (!newPresetLabel.trim() || !newPresetLocation.trim()) {
      toast.error("Enter preset name and location");
      return;
    }
    const r = parseFloat(newPresetRate);
    if (isNaN(r) || r < 0) {
      toast.error("Enter a valid rate (0 or more)");
      return;
    }
    setPresets((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        label: newPresetLabel.trim(),
        location: newPresetLocation.trim(),
        rate: r,
      },
    ]);
    setNewPresetLabel("");
    setNewPresetLocation("");
    setNewPresetRate("10");
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

  const handleAddScooter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newScooterForm.name.trim()) {
      toast.error("Please enter a scooter name");
      return;
    }

    setAddingScooter(true);
    try {
      const newId = await addScooter(user.uid, newScooterForm, false);
      await refreshScooter();
      setSelectedScooterId(newId);
      setAddScooterOpen(false);
      toast.success(`Added ${newScooterForm.name} to your garage`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add scooter";
      toast.error(msg);
    } finally {
      setAddingScooter(false);
    }
  };

  const handleSetDefault = async (scooterId: string) => {
    if (!user) return;
    try {
      await setDefaultScooter(user.uid, scooterId);
      setSelectedScooterId(scooterId);
      await refreshScooter();
      toast.success("Default scooter updated");
    } catch {
      toast.error("Failed to update default scooter");
    }
  };

  const handleDeleteScooter = async (scooterId: string) => {
    if (!user || scooters.length <= 1) return;
    try {
      await deleteScooter(user.uid, scooterId);
      await refreshScooter();
      toast.success("Vehicle removed from garage");
    } catch {
      toast.error("Failed to remove scooter");
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
          App Customization, Garage &amp; Budget
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Switch themes live, manage multiple scooters, or configure monthly budgets &amp; tariff presets
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
            <span className="truncate">Garage ({scooters.length})</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2 text-xs">
            <User className="h-3.5 w-3.5" />
            <span className="truncate">Budget &amp; Profile</span>
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

        {/* Garage & Scooter Configuration Tab */}
        <TabsContent value="scooter" className="space-y-4">
          {/* Garage Switcher Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Your Garage</CardTitle>
                <CardDescription className="text-xs">
                  Select a scooter to edit specs or add another EV
                </CardDescription>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => setAddScooterOpen(true)}
                className="gap-1.5 text-xs ios-touch"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Vehicle
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {scooters.map((item) => {
                const isSelected = scooter?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedScooterId(item.id)}
                    className={`cursor-pointer rounded-lg border p-3.5 transition-all space-y-2 ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-foreground/30 bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs truncate">{item.name}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.isDefault && (
                          <Badge variant="secondary" className="text-[10px]">
                            Default
                          </Badge>
                        )}
                        <Badge variant="outline" className="font-mono-num text-[10px]">
                          {item.batteryCapacity} kWh
                        </Badge>
                      </div>
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                      <span>{item.model}</span>
                      <span className="font-mono-num">
                        {currency}{item.electricityRate}/kWh
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-2 pt-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!item.isDefault && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(item.id)}
                          className="h-7 px-2 text-[11px]"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Set Default
                        </Button>
                      )}
                      {scooters.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteScooter(item.id)}
                          className="h-7 px-2 text-[11px] text-destructive hover:bg-destructive/10 ml-auto"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Active Scooter Specs Editor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Edit Specs — {scooter?.name}
              </CardTitle>
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
                    <Label htmlFor="scooter-rate" className="text-xs">
                      Rate ({currency}/kWh)
                    </Label>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="scooter-reg" className="text-xs">Registration Number</Label>
                    <Input
                      id="scooter-reg"
                      placeholder="e.g. MH 12 AB 1234"
                      value={scooterForm.registrationNumber || ""}
                      onChange={(e) =>
                        setScooterForm({ ...scooterForm, registrationNumber: e.target.value })
                      }
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="scooter-odo" className="text-xs">Current Odometer (km)</Label>
                    <Input
                      id="scooter-odo"
                      type="number"
                      placeholder="e.g. 2400"
                      value={scooterForm.currentOdometer ?? ""}
                      onChange={(e) =>
                        setScooterForm({
                          ...scooterForm,
                          currentOdometer: e.target.value ? parseFloat(e.target.value) : undefined,
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

        {/* Budget, Petrol Baseline, Tariff Presets & Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Profile, Budget &amp; Petrol Baseline</CardTitle>
              <CardDescription className="text-xs">
                Customize currency, monthly spend alert limit, and petrol comparison baseline.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form id="profile-form" onSubmit={handleSaveProfile} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="monthly-budget" className="text-xs flex items-center gap-1.5">
                      <Wallet className="h-3.5 w-3.5 text-primary" />
                      Monthly Budget ({currency})
                    </Label>
                    <Input
                      id="monthly-budget"
                      type="number"
                      min="0"
                      placeholder="e.g. 600"
                      value={monthlyBudget}
                      onChange={(e) => setMonthlyBudget(e.target.value)}
                      className="h-10 font-mono-num"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="petrol-price" className="text-xs">
                      Petrol Price ({currency}/L)
                    </Label>
                    <Input
                      id="petrol-price"
                      type="number"
                      step="0.5"
                      min="1"
                      value={petrolPrice}
                      onChange={(e) => setPetrolPrice(parseFloat(e.target.value) || 0)}
                      className="h-10 font-mono-num"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="petrol-mileage" className="text-xs">
                      Petrol Baseline (km/L)
                    </Label>
                    <Input
                      id="petrol-mileage"
                      type="number"
                      min="1"
                      value={petrolMileage}
                      onChange={(e) => setPetrolMileage(parseFloat(e.target.value) || 0)}
                      className="h-10 font-mono-num"
                    />
                  </div>
                </div>

                <Separator />

                {/* Location Tariff Presets */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      Quick Location &amp; Tariff Presets
                    </Label>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Appear as 1-tap shortcuts on the Add Session screen.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {presets.map((p) => (
                      <div
                        key={p.id}
                        className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-1.5 text-xs"
                      >
                        <span className="font-medium">{p.label}</span>
                        <span className="text-muted-foreground">({p.location})</span>
                        <span className="font-mono-num font-semibold text-primary">
                          {currency}{p.rate}/u
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setPresets((prev) => prev.filter((item) => item.id !== p.id))
                          }
                          className="text-muted-foreground hover:text-destructive ml-1"
                          aria-label={`Remove ${p.label} preset`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
                    <Input
                      placeholder="Label (e.g. Basement)"
                      value={newPresetLabel}
                      onChange={(e) => setNewPresetLabel(e.target.value)}
                      className="h-9 text-xs"
                    />
                    <Input
                      placeholder="Location (e.g. Home)"
                      value={newPresetLocation}
                      onChange={(e) => setNewPresetLocation(e.target.value)}
                      className="h-9 text-xs"
                    />
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder={`Rate (${currency}/kWh)`}
                      value={newPresetRate}
                      onChange={(e) => setNewPresetRate(e.target.value)}
                      className="h-9 text-xs font-mono-num"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddPreset}
                      className="h-9 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add Preset
                    </Button>
                  </div>
                </div>

                <Button type="submit" disabled={savingProfile} className="font-semibold text-xs ios-touch">
                  {savingProfile && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                  {savingProfile ? "Saving..." : "Save All Preferences"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Second Vehicle Modal */}
      <Dialog open={addScooterOpen} onOpenChange={setAddScooterOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Vehicle to Garage</DialogTitle>
            <DialogDescription>
              Track charging sessions separately for another Ola or EV scooter.
            </DialogDescription>
          </DialogHeader>

          <form id="add-scooter-form" onSubmit={handleAddScooter} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-name" className="text-xs">Vehicle Name *</Label>
              <Input
                id="new-name"
                value={newScooterForm.name}
                onChange={(e) => setNewScooterForm({ ...newScooterForm, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-model" className="text-xs">Model *</Label>
              <Select
                value={newScooterForm.model}
                onValueChange={(val) => {
                  let cap = newScooterForm.batteryCapacity;
                  if (val.includes("Gen 2") || val.includes("Pro Gen 1")) cap = 4;
                  else if (val.includes("Air") || val.includes("X+")) cap = 3;
                  else if (val.includes("X")) cap = 2;
                  setNewScooterForm({ ...newScooterForm, model: val, batteryCapacity: cap });
                }}
              >
                <SelectTrigger id="new-model">
                  <SelectValue />
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

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Pack (kWh)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={newScooterForm.batteryCapacity}
                  onChange={(e) =>
                    setNewScooterForm({
                      ...newScooterForm,
                      batteryCapacity: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="font-mono-num"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Rate ({currency})</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={newScooterForm.electricityRate}
                  onChange={(e) =>
                    setNewScooterForm({
                      ...newScooterForm,
                      electricityRate: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="font-mono-num"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Loss (%)</Label>
                <Input
                  type="number"
                  value={newScooterForm.chargingLoss}
                  onChange={(e) =>
                    setNewScooterForm({
                      ...newScooterForm,
                      chargingLoss: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="font-mono-num"
                />
              </div>
            </div>
          </form>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddScooterOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="add-scooter-form" disabled={addingScooter}>
              {addingScooter && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Vehicle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
