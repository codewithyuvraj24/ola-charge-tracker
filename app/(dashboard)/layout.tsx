"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ScooterProvider, useScooter } from "@/lib/scooter-context";
import { Button } from "@/components/ui/button";
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
        <Zap className="h-6 w-6 text-emerald-400 animate-pulse" />
        <span className="text-xs text-muted-foreground font-mono-num">INITIALIZING TELEMETRY...</span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row pb-24 md:pb-0">
      {/* Desktop macOS Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-border bg-card p-4 sticky top-0 h-screen font-mono-num">
        <div className="flex items-center gap-2.5 px-2 py-2 mb-4">
          <div className="h-7 w-7 rounded-md bg-white flex items-center justify-center text-black font-bold">
            <Zap className="h-4 w-4 fill-current" />
          </div>
          <div>
            <div className="font-bold text-sm leading-tight text-foreground tracking-tight">
              OLA TELEMETRY
            </div>
            <div className="text-[10px] text-muted-foreground">EXECUTIVE PRO</div>
          </div>
        </div>

        {scooter && (
          <div className="mb-4 rounded-md border border-border bg-black/40 p-2.5 text-xs space-y-1">
            <div className="flex items-center justify-between font-semibold text-foreground">
              <span className="flex items-center gap-1.5 truncate">
                <Bike className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                {scooter.name}
              </span>
              <span className="text-[10px] text-zinc-400">{scooter.batteryCapacity} kWh</span>
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              {scooter.model} • ₹{scooter.electricityRate}/u
            </div>
          </div>
        )}

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-all ios-touch ${
                  isActive
                    ? "bg-zinc-100 text-zinc-950 font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-zinc-900"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border pt-3 space-y-2">
          <div className="px-2 truncate">
            <div className="font-semibold text-xs text-foreground truncate">
              {userProfile?.displayName || user.email?.split("@")[0]}
            </div>
            <div className="text-[10px] text-muted-foreground truncate font-mono">
              {user.email}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs h-8 text-zinc-400 hover:text-destructive hover:bg-destructive/10 rounded-md ios-touch"
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

      {/* iOS 17 Header with Dynamic Island & Notch Safe Area */}
      <header className="md:hidden flex items-center justify-between px-5 pt-safe pb-2.5 border-b border-border/60 ios-material sticky top-0 z-30">
        <Link href="/dashboard" className="flex items-center gap-2 ios-touch">
          <div className="h-7 w-7 rounded-lg bg-white flex items-center justify-center text-black">
            <Zap className="h-4 w-4 fill-current" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight leading-tight">Ola Charge</div>
            <div className="text-[10px] text-muted-foreground font-mono-num">{scooter?.name}</div>
          </div>
        </Link>
        <span className="text-[11px] text-emerald-400 font-mono-num font-semibold border border-emerald-900/60 px-2 py-0.5 rounded bg-emerald-950/40">
          {scooter?.batteryCapacity} kWh
        </span>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* iOS 17 Floating Frosted Glass Tab Bar with Center Quick Add */}
      <div className="md:hidden fixed bottom-3 left-3 right-3 z-40">
        <nav className="ios-material rounded-2xl p-1.5 shadow-2xl shadow-black/80 flex items-center justify-around font-mono-num">
          <Link
            href="/dashboard"
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ios-touch ${
              pathname === "/dashboard" ? "text-white font-bold" : "text-zinc-500"
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-[9px] mt-0.5 uppercase tracking-wider">Dashboard</span>
          </Link>

          <Link
            href="/history"
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ios-touch ${
              pathname === "/history" ? "text-white font-bold" : "text-zinc-500"
            }`}
          >
            <History className="h-5 w-5" />
            <span className="text-[9px] mt-0.5 uppercase tracking-wider">History</span>
          </Link>

          {/* Center Elevated Action Button */}
          <Link
            href="/add-session"
            className="flex items-center justify-center -my-3 ios-touch"
          >
            <div className="h-12 w-12 rounded-xl bg-white text-black flex items-center justify-center shadow-lg shadow-white/20 border-2 border-[#09090b]">
              <Plus className="h-6 w-6 stroke-[2.5]" />
            </div>
          </Link>

          <Link
            href="/analytics"
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ios-touch ${
              pathname === "/analytics" ? "text-white font-bold" : "text-zinc-500"
            }`}
          >
            <TrendingUp className="h-5 w-5" />
            <span className="text-[9px] mt-0.5 uppercase tracking-wider">Analytics</span>
          </Link>

          <Link
            href="/settings"
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ios-touch ${
              pathname === "/settings" ? "text-white font-bold" : "text-zinc-500"
            }`}
          >
            <Settings className="h-5 w-5" />
            <span className="text-[9px] mt-0.5 uppercase tracking-wider">Settings</span>
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
