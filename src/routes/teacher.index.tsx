import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Pencil, Trash2, Trophy, Calendar, Target, Zap, Sparkles, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { HexBadge } from "@/components/hex-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { xpFor } from "@/data/seed";
import { useQuizzes } from "@/store/quizzes";

export const Route = createFileRoute("/teacher/")({
  head: () => ({
    meta: [
      { title: "Create — InFiniLit Teacher Studio" },
      { name: "description", content: "Build quizzes, reuse past sessions, and track accuracy over time." },
      { property: "og:title", content: "InFiniLit Teacher Studio" },
      { property: "og:description", content: "Build quizzes and reuse past sessions." },
    ],
  }),
  component: TeacherIndex,
});

function TeacherIndex() {
  const quizzes = useQuizzes((s) => s.quizzes);
  const remove = useQuizzes((s) => s.remove);

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="section-pill inline-flex items-center gap-2 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-mint-foreground" style={{ background: "linear-gradient(180deg, #a8f0c8 0%, #5fd99a 55%, #2eb573 100%)" }}>
              <Sparkles className="h-3.5 w-3.5 drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]" strokeWidth={3.5} /> Teacher Studio
            </div>
            <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">Your quiz library</h1>
            <p className="mt-2 max-w-xl text-foreground/90 font-medium">
              Reuse, edit, and remix. Difficulty is set per question — XP awards (20 / 50 / 100) flow automatically.
            </p>
          </div>
          <Link to="/teacher/classrooms" className="inline-flex">
            <Button variant="sky" size="lg">
              <Users className="h-4 w-4 drop-shadow-sm" strokeWidth={3.5} /> Manage classrooms
            </Button>
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Link to="/teacher/new" className="group">
            <Card className="flex h-full min-h-[260px] flex-col items-center justify-center gap-3 border-2 border-dashed border-foreground/30 bg-card p-6 text-center transition-colors hover:border-coral hover:bg-coral/5">
              <HexBadge tone="coral" size={80} className="transition-transform group-hover:rotate-6">
                <Plus strokeWidth={3.5} />
              </HexBadge>
              <div className="font-display text-xl font-bold">New quiz</div>
              <p className="max-w-[200px] text-xs text-foreground/90 font-medium">
                Start from scratch. Add questions, set difficulty, write explanations.
              </p>
            </Card>
          </Link>

          {quizzes.map((q, i) => {
            const tones = ["sunshine", "mint", "sky", "coral", "violet"] as const;
            const c = tones[i % tones.length];
            const totalXp = q.questions.reduce((s, x) => s + xpFor(x.difficulty), 0);
            return (
              <Card key={q.id} className="flex h-full flex-col gap-4 border-2 border-foreground/10 p-5 badge-shadow">
                <div className="flex items-start justify-between gap-2">
                  <HexBadge tone={c} size={68}>
                    <Trophy strokeWidth={3} />
                  </HexBadge>
                  {q.lastAttempt && (
                    <div className="rounded-2xl border border-foreground/15 bg-background/95 px-3 py-2 text-right text-xs font-bold leading-tight text-foreground shadow-[0_2px_0_rgba(0,0,0,0.08)]">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-mint/90 text-mint-foreground">
                          <Target className="h-4 w-4" strokeWidth={2} />
                        </span>
                        <span className="tabular-nums">{q.lastAttempt.accuracy}%</span>
                      </div>
                      <div className="mt-1 flex items-center justify-end gap-1.5">
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-sunshine/90 text-sunshine-foreground">
                          <Zap className="h-4 w-4" strokeWidth={2} />
                        </span>
                        <span className="tabular-nums">{q.lastAttempt.xp} XP</span>
                      </div>
                      <div className="mt-1 flex items-center justify-end gap-1.5 text-foreground/80">
                        <Calendar className="h-4 w-4" strokeWidth={2} />
                        <span className="tabular-nums">{q.lastAttempt.date}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-display text-xl font-bold leading-snug">{q.title}</div>
                  <p className="mt-1 line-clamp-2 text-sm text-foreground/90 font-medium">{q.description}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-muted px-2 py-1 font-semibold">{q.questions.length} questions</span>
                  <span className="rounded-full bg-muted px-2 py-1 font-semibold">{totalXp} XP total</span>
                </div>
                <div className="flex items-center gap-2">
                  <Link to="/teacher/$id/edit" params={{ id: q.id }} className="flex-1">
                    <Button variant="badge" className="w-full">
                      <Pencil className="h-4 w-4 drop-shadow-sm" strokeWidth={3.5} /> Edit
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm(`Delete "${q.title}"?`)) remove(q.id);
                    }}
                    className={cn("rounded-xl hover:bg-coral/10 hover:text-coral")}
                  >
                    <Trash2 className="h-4 w-4 drop-shadow-sm" strokeWidth={3.5} />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}