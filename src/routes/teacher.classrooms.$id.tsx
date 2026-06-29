import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BarChart3, Brain, RotateCcw, Trophy, TrendingUp, Zap } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useClassrooms } from "@/store/classrooms";

export const Route = createFileRoute("/teacher/classrooms/$id")({
  head: () => ({
    meta: [
      { title: "Classroom stats — InFiniLit" },
      { name: "description", content: "Per-classroom accuracy, XP, and confidence calibration over time." },
    ],
  }),
  component: ClassroomStatsPage,
});

function ClassroomStatsPage() {
  const { id } = Route.useParams();
  const classroom = useClassrooms((s) => s.classrooms.find((c) => c.id === id));
  const resetStats = useClassrooms((s) => s.resetStats);

  if (!classroom) {
    return (
      <AppShell>
        <div className="space-y-4">
          <Link to="/teacher/classrooms"><Button variant="badge" size="sm"><ArrowLeft className="h-4 w-4" /> Back</Button></Link>
          <Card className="p-8 text-center">Classroom not found.</Card>
        </div>
      </AppShell>
    );
  }

  const sessions = classroom.sessions ?? [];
  const sessionSeries = sessions.map((s, i) => ({
    label: `S${i + 1}`,
    accuracy: s.accuracy,
    xp: s.xp,
    date: s.date,
    title: s.quizTitle,
  }));

  const totalXp = sessions.reduce((a, b) => a + b.xp, 0);
  const avgAccuracy =
    sessions.length ? Math.round(sessions.reduce((a, b) => a + b.accuracy, 0) / sessions.length) : 0;

  // per-student aggregate across all sessions
  const perStudent = classroom.students.map((st) => {
    let correct = 0,
      total = 0,
      sure = 0,
      sureCorrect = 0;
    sessions.forEach((s) => {
      const row = s.perStudent.find((p) => p.studentId === st.id);
      if (row) {
        correct += row.correct;
        total += row.total;
        sure += row.sure;
        sureCorrect += row.sureCorrect;
      }
    });
    return {
      student: st.name,
      accuracy: total ? Math.round((correct / total) * 100) : 0,
      calibration: sure ? Math.round((sureCorrect / sure) * 100) : null,
      answered: total,
    };
  });

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link to="/teacher/classrooms" className="mb-3 inline-flex">
              <Button variant="badge" size="sm"><ArrowLeft className="h-4 w-4" /> Back to classrooms</Button>
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full stat-gradient-violet px-3 py-1 text-xs font-bold uppercase tracking-wider text-white chunky-border">
              <BarChart3 className="h-3 w-3" strokeWidth={3} /> Classroom stats
            </div>
            <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">{classroom.name}</h1>
            <p className="mt-1 text-muted-foreground">{classroom.students.length} students · {sessions.length} sessions recorded</p>
          </div>
          <Button
            variant="badge"
            onClick={() => {
              if (confirm("Reset all stats for this classroom? This cannot be undone.")) resetStats(classroom.id);
            }}
          >
            <RotateCcw className="h-4 w-4" /> Reset stats
          </Button>
        </div>

        {/* Hero metric cards w/ gradient */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="overflow-hidden border-0 stat-gradient-dark p-6">
            <div className="text-xs font-bold uppercase tracking-wider text-white/70">Avg accuracy</div>
            <div className="mt-2 font-display text-5xl font-black text-white">{avgAccuracy}%</div>
            <div className="mt-3 h-16">
              <ResponsiveContainer>
                <LineChart data={sessionSeries}>
                  <Line type="monotone" dataKey="accuracy" stroke="#67e8f9" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="overflow-hidden border-0 stat-gradient-mint p-6">
            <div className="text-xs font-bold uppercase tracking-wider text-white/80">Total XP earned</div>
            <div className="mt-2 font-display text-5xl font-black text-white">{totalXp.toLocaleString()}</div>
            <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white">
              <Zap className="h-3 w-3" strokeWidth={3} /> across {sessions.length} sessions
            </div>
          </Card>
          <Card className="overflow-hidden border-0 stat-gradient-violet p-6">
            <div className="text-xs font-bold uppercase tracking-wider text-white/80">Sessions played</div>
            <div className="mt-2 font-display text-5xl font-black text-white">{sessions.length}</div>
            <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white">
              <Trophy className="h-3 w-3" strokeWidth={3} /> last: {sessions.at(-1)?.date ?? "—"}
            </div>
          </Card>
        </div>

        {sessions.length === 0 ? (
          <Card className="grid place-items-center gap-3 border-2 border-dashed border-foreground/20 p-12 text-center">
            <BarChart3 className="h-10 w-10 text-muted-foreground" />
            <div className="font-display text-xl font-bold">No sessions yet</div>
            <p className="max-w-md text-sm text-muted-foreground">
              Run a quiz with this classroom selected in the Play tab. Stats land here automatically after each session.
            </p>
            <Link to="/quiz"><Button variant="coral">Go to Play</Button></Link>
          </Card>
        ) : (
          <>
            <Card className="border-2 border-foreground/10 p-6 badge-shadow">
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" /> <div className="font-display text-lg font-bold">Accuracy & XP over time</div>
              </div>
              <div className="h-72">
                <ResponsiveContainer>
                  <LineChart data={sessionSeries}>
                    <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "2px solid var(--color-foreground)" }} />
                    <Line type="monotone" dataKey="accuracy" stroke="var(--color-coral)" strokeWidth={3} dot={{ r: 5, fill: "white" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="border-2 border-foreground/10 p-6 badge-shadow">
              <div className="mb-4 flex items-center gap-2">
                <Brain className="h-5 w-5" /> <div className="font-display text-lg font-bold">Per-student performance</div>
              </div>
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={perStudent}>
                    <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="student" tickLine={false} axisLine={false} angle={-25} textAnchor="end" height={50} fontSize={11} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12 }} />
                    <Bar dataKey="accuracy" radius={[8, 8, 0, 0]} fill="var(--color-mint)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 overflow-hidden rounded-xl border-2 border-foreground/10">
                <div className="grid grid-cols-12 bg-foreground/5 px-4 py-2 text-[10px] font-bold uppercase tracking-wider">
                  <div className="col-span-5">Student</div>
                  <div className="col-span-2 text-right">Answered</div>
                  <div className="col-span-2 text-right">Accuracy</div>
                  <div className="col-span-3 text-right">Confidence calibration</div>
                </div>
                {perStudent.map((p) => (
                  <div key={p.student} className="grid grid-cols-12 border-t border-foreground/5 px-4 py-2 text-sm">
                    <div className="col-span-5 font-semibold">{p.student}</div>
                    <div className="col-span-2 text-right">{p.answered}</div>
                    <div className="col-span-2 text-right font-bold">{p.accuracy}%</div>
                    <div className="col-span-3 text-right">
                      {p.calibration === null ? <span className="text-muted-foreground">—</span> : <span className="font-bold">{p.calibration}%</span>}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Confidence calibration = % of &quot;Sure&quot; answers that were correct. Only shown for sessions with confidence tracking ON.
              </p>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}