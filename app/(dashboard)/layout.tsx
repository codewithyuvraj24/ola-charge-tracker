"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ScooterProvider, useScooter } from "@/lib/scooter-context";
import { useTheme } from "@/lib/theme-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  LayoutDashboard,
  Plus,
  History,
  TrendingUp,
  Settings,
  LogOut,
  Palette,
  Bike,
  ShieldCheck,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "History", href: "/history", icon: History },
  { label: "Analytics", href: "/analytics", icon: TrendingUp },
  { label: "Settings", href: "/settings", icon: Settings },
];

function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userProfile, loading, logout } = useAuth();
  const { scooter, loadingScooter } = useScooter();
  const { theme, setTheme } = useTheme();

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
        <div className="h-14 w-14 rounded-2xl ios-glass flex items-center justify-center text-primary shadow-xl shadow-primary/15 animate-pulse">
          <Zap className="h-7 w-7" />
        </div>
        <p className="text-xs font-medium text-muted-foreground tracking-wide">
          Connecting to your garage...
        </p>
      </div>
    );
  }

  if (!user) return null;

  // Next theme in cycle for quick toggle button
  const cycleNextTheme = () => {
    const list: ("cyberpunk" | "stealth" | "solar" | "emerald" | "light")[] = [
      "cyberpunk",
      "stealth",
      "solar",
      "emerald",
      "light",
    ];
    const currentIndex = list.indexOf(theme);
    const nextTheme = list[(currentIndex + 1) % list.length];
    setTheme(nextTheme);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row pb-28 md:pb-0">
      {/* Desktop Sidebar (macOS/iPad Pro style) */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border/50 ios-glass p-5 sticky top-0 h-screen">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 py-2 mb-5">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-primary to-primary/80 flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/25">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-base tracking-tight leading-tight flex items-center gap-1.5">
              <span>Ola Charge</span>
              <Badge variant="success" className="text-[9px] px-1.5 py-0 font-bold">PRO</Badge>
            </div>
            <div className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
              Smart Energy
            </div>
          </div>
        </div>

        {/* Scooter Card in Sidebar */}
        {scooter && (
          <div className="mb-6 rounded-2xl ios-glass-card p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-semibold text-xs text-foreground">
                <Bike className="h-3.5 w-3.5 text-primary" />
                {scooter.name}
              </span>
              <Badge variant="outline" className="text-[10px] font-semibold">{scooter.batteryCapacity} kWh</Badge>
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center justify-between">
              <span>{scooter.model}</span>
              <span className="font-medium text-foreground">₹{scooter.electricityRate}/u</span>
            </div>
          </div>
        )}

        {/* Quick Add Session Button for Desktop */}
        <Link href="/add-session" className="mb-4">
          <Button className="w-full rounded-2xl font-semibold gap-2 py-5 shadow-lg shadow-primary/20 ios-pressable">
            <Plus className="h-4 w-4" />
            <span>Record Session</span>
          </Button>
        </Link>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ios-pressable ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Security badge */}
        <div className="py-2.5 px-3 my-2 rounded-xl bg-muted/20 border border-border/30 text-[11px] text-muted-foreground flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>Encrypted Private Vault</span>
        </div>

        {/* User profile & controls */}
        <div className="border-t border-border/50 pt-3 space-y-2">
          <div className="flex items-center justify-between px-2">
            <div className="truncate text-xs">
              <div className="font-semibold text-foreground truncate">
                {userProfile?.displayName || user.email?.split("@")[0]}
              </div>
              <div className="text-muted-foreground truncate text-[10px]">
                {user.email}
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground ios-pressable"
              onClick={cycleNextTheme}
              title="Cycle theme"
            >
              <Palette className="h-4 w-4 text-primary" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 ios-pressable"
            onClick={async () => {
              await logout();
              router.push("/");
            }}
          >
            <LogOut className="mr-2 h-3.5 w-3.5" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* iOS 17 Mobile Top Navigation Bar */}
      <header className="md:hidden flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/40 ios-glass sticky top-0 z-30">
        <Link href="/dashboard" className="flex items-center gap-2.5 ios-pressable">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-primary to-primary/80 flex items-center justify-center text-primary-foreground shadow-md shadow-primary/20">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight leading-tight">Ola Charge</div>
            <div className="text-[10px] text-muted-foreground">{scooter?.name || "EV Tracker"}</div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 rounded-xl text-xs gap-1.5 ios-pressable bg-muted/40"
            onClick={cycleNextTheme}
          >
            <Palette className="h-3.5 w-3.5 text-primary" />
            <span className="capitalize text-[11px] font-bold">{theme}</span>
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* iOS 17 Floating Tab Bar with Center Dynamic Charging Action */}
      <div className="md:hidden fixed bottom-3 left-4 right-4 z-40">
        <nav className="ios-glass rounded-3xl p-1.5 shadow-2xl shadow-black/40 border border-white/10 flex items-center justify-around">
          <Link
            href="/dashboard"
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all ios-pressable ${
              pathname === "/dashboard" ? "text-primary font-bold" : "text-muted-foreground"
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 tracking-tight">Overview</span>
          </Link>

          <Link
            href="/history"
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all ios-pressable ${
              pathname === "/history" ? "text-primary font-bold" : "text-muted-foreground"
            }`}
          >
            <History className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 tracking-tight">History</span>
          </Link>

          {/* Center Floating Plus */}
          <Link
            href="/add-session"
            className="flex items-center justify-center -my-2.5 ios-pressable"
          >
            <div className="h-13 w-13 rounded-2xl bg-gradient-to-tr from-primary to-primary/80 text-primary-foreground p-3 shadow-lg shadow-primary/40 border-2 border-background/60">
              <Plus className="h-6 w-6 stroke-[2.5]" />
            </div>
          </Link>

          <Link
            href="/analytics"
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all ios-pressable ${
              pathname === "/analytics" ? "text-primary font-bold" : "text-muted-foreground"
            }`}
          >
            <TrendingUp className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 tracking-tight">Analytics</span>
          </Link>

          <Link
            href="/settings"
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all ios-pressable ${
              pathname === "/settings" ? "text-primary font-bold" : "text-muted-foreground"
            }`}
          >
            <Settings className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 tracking-tight">Settings</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ScooterProvider>
      <DashboardShell>{children}</DashboardShell>
    </ScooterProvider>
  );
}
