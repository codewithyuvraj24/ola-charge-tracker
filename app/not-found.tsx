import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, ArrowLeft, LayoutDashboard } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border bg-card shadow-xl text-center">
        <CardHeader className="space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Zap className="h-6 w-6" />
          </div>
          <div className="text-xs font-mono-num uppercase tracking-widest text-primary font-semibold">
            404 • Route Not Found
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Unplugged Page
          </CardTitle>
          <CardDescription className="text-xs">
            The route you requested doesn&apos;t exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
          <Link href="/">
            <Button variant="outline" className="w-full gap-2">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button className="w-full gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Open Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

