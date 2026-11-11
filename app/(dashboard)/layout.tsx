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
  PlusCircle,
  History,
  TrendingUp,
  Settings,
  LogOut,
  Sun,
  Moon,
  Bike,
  Loader2,
  ShieldCheck,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Add Session", href: "/add-session", icon: PlusCircle },
  { label: "History", href: "/history", icon: History },
  { label: "Analytics", href: "/analytics", icon: TrendingUp },
  { label: "Settings", href: "/settings", icon: Settings },
];

function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userProfile, loading, logout } = useAuth();
  const { scooter, loadingScooter } = useScooter();
  const { theme, setTheme, resolvedTheme } = useTheme();

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
        <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/30 animate-pulse">
          <Zap className="h-6 w-6" />
        </div>
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Loading your secure garage...
        </p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row pb-20 md:pb-0">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border/70 bg-card/50 backdrop-blur-md p-4 sticky top-0 h-screen">
        {/* Brand */}
        <div className="flex items-center gap-3 px-3 py-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary border border-primary/30 shadow-sm shadow-primary/20">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-base tracking-tight leading-tight flex items-center gap-1.5">
              <span>Ola Charge</span>
              <Badge variant="success" className="text-[10px] px-1.5 py-0">PRO</Badge>
            </div>
            <div className="text-[11px] text-muted-foreground uppercase font-medium tracking-wider">
              EV Tracker
            </div>
          </div>
        </div>

        {/* Scooter Card in Sidebar */}
        {scooter && (
          <div className="mb-6 rounded-xl bg-muted/40 border border-border/60 p-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Bike className="h-3.5 w-3.5 text-primary" />
                {scooter.name}
              </span>
              <Badge variant="outline" className="text-[10px]">{scooter.batteryCapacity} kWh</Badge>
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              {scooter.model} • ₹{scooter.electricityRate}/unit
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25 font-semibold"
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
        <div className="py-3 px-3 my-2 rounded-lg bg-muted/20 border border-border/40 text-[11px] text-muted-foreground flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
          <span>Private encrypted data</span>
        </div>

        {/* User profile & controls */}
        <div className="border-t border-border/60 pt-4 space-y-2">
          <div className="flex items-center justify-between px-2">
            <div className="truncate text-xs">
              <div className="font-semibold text-foreground truncate">
                {userProfile?.displayName || user.email?.split("@")[0]}
              </div>
              <div className="text-muted-foreground truncate text-[11px]">
                {user.email}
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              title="Toggle theme"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
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

      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border/70 bg-card/60 backdrop-blur-md sticky top-0 z-30">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
            <Zap className="h-4 w-4" />
          </div>
          <span className="font-bold text-sm tracking-tight">Ola Charge</span>
        </Link>

        <div className="flex items-center gap-2">
          {scooter && (
            <Badge variant="outline" className="text-[10px] hidden xs:inline-flex">
              {scooter.model.split(" ")[0]} {scooter.batteryCapacity}kWh
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border flex items-center justify-around py-2 px-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const isAdd = item.href === "/add-session";

          if (isAdd) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/40 border-2 border-background">
                  <PlusCircle className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-semibold text-primary mt-0.5">
                  Add
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-md transition-colors ${
                isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
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
