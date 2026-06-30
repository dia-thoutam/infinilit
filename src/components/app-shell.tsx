import { Link, useRouterState } from "@tanstack/react-router";
import { Sparkles, GraduationCap, BarChart3, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/quiz", label: "Play", icon: Sparkles },
  { to: "/teacher", label: "Create", icon: GraduationCap },
  { to: "/analytics", label: "Progress", icon: BarChart3 },
] as const;

export function AppShell({ children, bare = false }: { children: ReactNode; bare?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-warm-gradient text-foreground">
      <header className="sticky top-0 z-40 border-b-2 border-foreground/10 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/quiz" className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-coral chunky-border badge-shadow">
              <Trophy className="h-5 w-5 text-coral-foreground" strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <div className="font-display text-lg font-bold">InFiniLit</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Financial Literacy</div>
            </div>
          </Link>
          <nav className="flex items-center gap-1 rounded-2xl border-2 border-foreground/10 bg-card p-1">
            {tabs.map((t) => {
              const active = pathname.startsWith(t.to);
              const Icon = t.icon;
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors sm:px-4",
                    active
                      ? "bg-foreground text-background"
                      : "text-foreground/70 hover:bg-muted",
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={2.5} />
                  <span className="hidden sm:inline">{t.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <div className="rounded-full bg-sunshine px-3 py-1 text-xs font-bold text-sunshine-foreground chunky-border">
              Dia &amp; Joshitha
            </div>
          </div>
        </div>
      </header>
      <main className={cn(bare ? "" : "mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10")}>{children}</main>
    </div>
  );
}

export function Badge3D({
  color = "coral",
  children,
  className,
}: {
  color?: "coral" | "sunshine" | "mint" | "sky";
  children: ReactNode;
  className?: string;
}) {
  const bg = {
    coral: "bg-coral text-coral-foreground",
    sunshine: "bg-sunshine text-sunshine-foreground",
    mint: "bg-mint text-mint-foreground",
    sky: "bg-sky text-sky-foreground",
  }[color];
  return (
    <div
      className={cn(
        "grid place-items-center rounded-full chunky-border badge-shadow",
        bg,
        className,
      )}
    >
      {children}
    </div>
  );
}