"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { ScooterProvider, useScooter } from "@/providers/scooter-provider";
import { useTheme, APP_THEMES } from "@/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BatteryChargeLoader, LiveStatusPill } from "@/components/shared/uiverse";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Zap,
  LayoutDashboard,
  Plus,
  History,
  TrendingUp,
  Settings,
  LogOut,
  Bike,
  Palette,
  ChevronsUpDown,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Add Session", href: "/add-session", icon: Plus },
  { label: "History", href: "/history", icon: History },
  { label: "Analytics", href: "/analytics", icon: TrendingUp },
  { label: "Settings", href: "/settings", icon: Settings },
];

const MOBILE_NAV = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "History", href: "/history", icon: History },
  { label: "Add", href: "/add-session", icon: Plus, isPrimary: true },
  { label: "Analytics", href: "/analytics", icon: TrendingUp },
  { label: "Settings", href: "/settings", icon: Settings },
];

function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userProfile, loading, logout } = useAuth();
  const {
    scooter,
    scooters,
    loadingScooter,
    setSelectedScooterId,
    viewAllVehicles,
    setViewAllVehicles,
  } = useScooter();
  const { theme, setTheme } = useTheme();
  const currency = userProfile?.currency || "₹";

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (userProfile && !userProfile.onboardingComplete) {
        router.push("/onboarding");
      }
    }
  }, [user, userProfile, loading, router]);

  if (loading || loadingScooter) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <BatteryChargeLoader label="Syncing vehicle telemetry..." />
      </div>
    );
  }

  if (!user) return null;

  const displayName = userProfile?.displayName || user.email?.split("@")[0] || "Rider";
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const cycleTheme = () => {
    const idx = APP_THEMES.indexOf(theme);
    setTheme(APP_THEMES[(idx + 1) % APP_THEMES.length]);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-background flex flex-col md:flex-row pb-24 md:pb-0">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card/60 p-4 sticky top-0 h-screen">
          {/* Brand */}
          <Link
            href="/"
            title="Go to main page"
            className="flex items-center gap-2.5 px-2 py-1.5 mb-4 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm group-hover:scale-105 transition-transform">
              <Zap className="h-4 w-4 fill-current" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm tracking-tight text-foreground">
                  Ola Charge
                </span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  v2
                </Badge>
              </div>
              <span className="text-[11px] text-muted-foreground">EV Energy Tracker</span>
            </div>
          </Link>

          {/* Active Vehicle Card / Switcher */}
          {scooter && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="mb-4 w-full text-left rounded-lg border border-border bg-background/70 p-3 space-y-1.5 hover:border-primary/40 transition-colors ios-touch"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground truncate">
                      <Bike className="h-3.5 w-3.5 text-primary shrink-0" />
                      {viewAllVehicles && scooters.length > 1 ? "All Vehicles" : scooter.name}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant="outline" className="font-mono-num text-[10px]">
                        {scooter.batteryCapacity} kWh
                      </Badge>
                      <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                    <span className="truncate">{scooter.model}</span>
                    <span className="font-mono-num">
                      {currency}{scooter.electricityRate}/u
                    </span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  Garage ({scooters.length} {scooters.length === 1 ? "vehicle" : "vehicles"})
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {scooters.map((item) => (
                  <DropdownMenuItem
                    key={item.id}
                    onClick={() => setSelectedScooterId(item.id)}
                    className="cursor-pointer justify-between"
                  >
                    <span className="truncate font-medium text-xs">{item.name}</span>
                    {!viewAllVehicles && scooter.id === item.id && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        Active
                      </Badge>
                    )}
                  </DropdownMenuItem>
                ))}
                {scooters.length > 1 && (
                  <DropdownMenuItem
                    onClick={() => setViewAllVehicles(!viewAllVehicles)}
                    className="cursor-pointer justify-between text-xs"
                  >
                    <span>View All Vehicles</span>
                    {viewAllVehicles && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0">
                        On
                      </Badge>
                    )}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push("/settings")}
                  className="cursor-pointer text-xs text-primary"
                >
                  <Plus className="mr-2 h-3.5 w-3.5" />
                  <span>Manage Garage</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Quick Add CTA */}
          <Link href="/add-session" className="mb-4">
            <Button className="w-full justify-center gap-2 font-medium" size="sm">
              <Plus className="h-4 w-4" />
              <span>Record Session</span>
            </Button>
          </Link>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-secondary text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Privacy Notice */}
          <div className="my-3 flex items-center justify-center">
            <LiveStatusPill label="Private Firestore Sync" className="w-full justify-center py-1.5" />
          </div>

          <Separator className="mb-3" />

          {/* User Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between px-2 h-auto py-2 hover:bg-muted/60"
              >
                <div className="flex items-center gap-2.5 min-w-0 text-left">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-foreground truncate">
                      {displayName}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {user.email}
                    </div>
                  </div>
                </div>
                <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{displayName}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={cycleTheme} className="cursor-pointer">
                <Palette className="mr-2 h-4 w-4 text-primary" />
                <span>Switch Theme ({theme})</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings")} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={async () => {
                  await logout();
                  router.push("/");
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </aside>

        {/* Mobile Header (iOS 17 safe area + Sheet Drawer) */}
        <header className="md:hidden flex items-center justify-between px-4 pt-safe py-2.5 border-b border-border/70 ios-material sticky top-0 z-30">
          <Link href="/" title="Go to main page" className="flex items-center gap-2 ios-touch">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="h-4 w-4 fill-current" />
            </div>
            <div className="leading-tight">
              <div className="font-semibold text-sm text-foreground">Ola Charge</div>
              <div className="text-[10px] text-muted-foreground">
                {scooter?.name || "EV Tracker"}
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {scooter && (
              <Badge variant="outline" className="font-mono-num text-[10px]">
                {scooter.batteryCapacity} kWh
              </Badge>
            )}

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full ios-touch">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary/15 text-primary text-[11px] font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[82%] sm:max-w-sm">
                <SheetHeader className="text-left">
                  <SheetTitle className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{displayName}</span>
                  </SheetTitle>
                  <SheetDescription className="truncate">{user.email}</SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-4">
                  {scooter && (
                    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1.5">
                          <Bike className="h-3.5 w-3.5 text-primary" />
                          {viewAllVehicles && scooters.length > 1 ? "All Vehicles" : scooter.name}
                        </span>
                        <Badge variant="secondary" className="font-mono-num text-[10px]">
                          {scooter.batteryCapacity} kWh
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {scooter.model} • {currency}{scooter.electricityRate}/kWh • {scooter.chargingLoss}% loss
                      </p>
                      {scooters.length > 1 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {scooters.map((item) => (
                            <Button
                              key={item.id}
                              type="button"
                              size="sm"
                              variant={!viewAllVehicles && scooter.id === item.id ? "default" : "outline"}
                              onClick={() => setSelectedScooterId(item.id)}
                              className="h-7 px-2 text-[11px]"
                            >
                              {item.name}
                            </Button>
                          ))}
                          <Button
                            type="button"
                            size="sm"
                            variant={viewAllVehicles ? "default" : "outline"}
                            onClick={() => setViewAllVehicles(!viewAllVehicles)}
                            className="h-7 px-2 text-[11px]"
                          >
                            All
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={cycleTheme}
                    >
                      <Palette className="h-4 w-4 text-primary" />
                      <span>Theme: <strong className="capitalize">{theme}</strong></span>
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => router.push("/settings")}
                    >
                      <Settings className="h-4 w-4" />
                      <span>Scooter & App Settings</span>
                    </Button>

                    <Separator className="my-2" />

                    <Button
                      variant="destructive"
                      className="w-full justify-start gap-2"
                      onClick={async () => {
                        await logout();
                        router.push("/");
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign out</span>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">{children}</div>
        </main>

        {/* Mobile Bottom Navigation (iOS 17 Frosted Tab Bar) */}
        <div className="md:hidden fixed bottom-3 left-3 right-3 z-40">
          <nav className="ios-material rounded-2xl p-1.5 shadow-2xl border border-border/80 flex items-center justify-around">
            {MOBILE_NAV.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              if (item.isPrimary) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-center -my-3 ios-touch"
                    aria-label="Add Charging Session"
                  >
                    <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg border-2 border-background">
                      <Icon className="h-6 w-6" />
                    </div>
                  </Link>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition-colors ios-touch ${
                    isActive
                      ? "text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] mt-0.5">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ScooterProvider>
      <DashboardShell>{children}</DashboardShell>
    </ScooterProvider>
  );
}
