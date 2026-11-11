"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ScooterProvider, useScooter } from "@/lib/scooter-context";
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
  Bike,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Add Session", href: "/add-session", icon: Plus },
  { label: "History", href: "/history", icon: History },
  { label: "Analytics", href: "/analytics", icon: TrendingUp },
  { label: "Settings", href: "/settings", icon: Settings },
];

function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userProfile, loading, logout } = useAuth();
  const { scooter, loadingScooter } = useScooter();

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-2 text-xs text-muted-foreground">
        <Zap className="h-5 w-5 text-primary animate-pulse" />
        <span>Loading workspace...</span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row pb-16 md:pb-0">
      {/* Desktop Sidebar - Clean, Professional Enterprise Navigation */}
      <aside className="hidden md:flex flex-col w-60 border-r border-border bg-card p-4 sticky top-0 h-screen">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-2 py-2 mb-4">
          <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <div className="font-semibold text-sm leading-tight text-foreground">
              Ola Charge
            </div>
            <div className="text-[10px] text-muted-foreground">EV Telemetry</div>
          </div>
        </div>

        {/* Scooter Status Chip */}
        {scooter && (
          <div className="mb-4 rounded-md border border-border bg-muted/30 p-2.5 text-xs space-y-1">
            <div className="flex items-center justify-between font-medium text-foreground">
              <span className="flex items-center gap-1.5 truncate">
                <Bike className="h-3.5 w-3.5 text-primary shrink-0" />
                {scooter.name}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">{scooter.batteryCapacity} kWh</span>
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              {scooter.model} • ₹{scooter.electricityRate}/unit
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-secondary text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Account Controls */}
        <div className="border-t border-border pt-3 space-y-2">
          <div className="px-2 truncate">
            <div className="font-medium text-xs text-foreground truncate">
              {userProfile?.displayName || user.email?.split("@")[0]}
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              {user.email}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card sticky top-0 z-30">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-primary flex items-center justify-center text-primary-foreground">
            <Zap className="h-3.5 w-3.5" />
          </div>
          <span className="font-semibold text-sm">Ola Charge</span>
        </Link>
        <span className="text-xs text-muted-foreground font-medium">{scooter?.name}</span>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border flex items-center justify-around py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 text-[10px] font-medium transition-colors ${
                isActive ? "text-primary font-bold" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="mt-1">{item.label}</span>
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
