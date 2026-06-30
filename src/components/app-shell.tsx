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
    <div className="relative min-h-screen bg-warm-gradient text-foreground">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-glass-noise opacity-40 mix-blend-overlay"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(255,245,230,0.25),transparent_60%)]"
      />
      <header className="sticky top-0 z-40 border-b border-white/25 bg-white/10 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/quiz" className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-coral/95 chunky-border badge-shadow backdrop-blur-sm">
              <Trophy className="h-5 w-5 text-coral-foreground" strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <div className="font-display text-lg font-bold text-foreground">InFiniLit</div>
              <div className="text-[10px] uppercase tracking-widest text-foreground/70">Financial Literacy</div>
            </div>
          </Link>
          <nav className="flex items-center gap-1 rounded-2xl border border-white/25 bg-white/20 p-1 backdrop-blur-md">
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
                      ? "bg-foreground/90 text-background shadow-sm"
                      : "text-foreground/80 hover:bg-white/25 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={2.5} />
                  <span className="hidden sm:inline">{t.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <div className="rounded-full bg-sunshine/90 px-3 py-1 text-xs font-bold text-sunshine-foreground chunky-border backdrop-blur-sm">
              Dia &amp; Joshitha
            </div>
          </div>
        </div>
      </header>
      <main
        key={pathname}
        className={cn(
          "lov-tab-in relative z-10",
          bare ? "" : "mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10",
        )}
      >
        {children}
      </main>
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