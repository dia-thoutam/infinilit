import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, BarChart3, Brain, Flame, Target, TrendingUp, Zap } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell, Badge3D } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { seedSectionAccuracy, seedSessionScores, seedStudents } from "@/data/seed";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Progress — InFiniLit Analytics" },
      { name: "description", content: "Class accuracy, confidence calibration, misconception tracker, and per-student growth." },
      { property: "og:title", content: "InFiniLit Analytics" },
      { property: "og:description", content: "Evidence-based progress tracking for financial literacy classes." },
    ],
  }),
  component: AnalyticsPage,
});

function trend(arr: number[]) {
  const recent = arr.slice(-3).reduce((s, x) => s + x, 0) / 3;
  const earlier = arr.slice(0, 3).reduce((s, x) => s + x, 0) / 3;
  const delta = recent - earlier;
  if (delta > 5) return "up" as const;
  if (delta < -2) return "down" as const;
  return "flat" as const;
}

function AnalyticsPage() {
  const [student, setStudent] = useState(seedStudents[0]);

  const classAvg = useMemo(
    () =>
      seedSessionScores.map((s) => ({
        session: `S${s.session}`,
        date: s.date,
        avg: Math.round(
          seedStudents.reduce((sum, st) => sum + (s.scores[st] ?? 0), 0) / seedStudents.length,
        ),
      })),
    [],
  );

  const classImprovement = Math.round(
    ((classAvg.at(-1)!.avg - classAvg[0].avg) / classAvg[0].avg) * 100,
  );

  const perStudentSeries = seedSessionScores.map((s) => {
    const row: Record<string, string | number> = { session: `S${s.session}` };
    row[student] = s.scores[student] ?? 0;
    return row;
  });
  const studentScores = seedSessionScores.map((s) => s.scores[student] ?? 0);
  const studentTrend = trend(studentScores);
  const trendColor = studentTrend === "up" ? "var(--color-mint)" : studentTrend === "down" ? "var(--color-coral)" : "var(--color-amber-alert)";
  const trendLabel = studentTrend === "up" ? "Improving" : studentTrend === "down" ? "Declining" : "Plateau";

  const improvementByStudent = seedStudents.map((s) => {
    const first = seedSessionScores[0].scores[s];
    const last = seedSessionScores.at(-1)!.scores[s];
    return { student: s, improvement: Math.round(((last - first) / first) * 100) };
  });

  const misconceptions = [
    { question: "Real return when inflation > nominal", section: "Inflation", wrongPct: 71, sessions: 3 },
    { question: "APR vs one-time fee on credit balance", section: "Credit", wrongPct: 64, sessions: 4 },
    { question: "What 20% of the 50/30/20 rule covers", section: "Budgeting", wrongPct: 52, sessions: 2 },
    { question: "Diversification reduces which risk", section: "Investing", wrongPct: 48, sessions: 2 },
  ];

  const confidenceCalibration = 68; // % who said Sure and were actually correct

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-sky px-3 py-1 text-xs font-bold uppercase tracking-wider text-sky-foreground chunky-border">
            <BarChart3 className="h-3 w-3" strokeWidth={3} /> Class Analytics
          </div>
          <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">Progress, in numbers.</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Honest measures of learning — accuracy, calibration, and where the class is still tripping up.
          </p>
        </div>

        {/* Hero metric */}
        <Card className="overflow-hidden border-2 border-foreground bg-foreground p-0 text-background badge-shadow">
          <div className="grid items-center gap-6 p-8 sm:grid-cols-[1fr_auto]">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-sunshine">Since Session 1</div>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="font-display text-7xl font-black text-sunshine sm:text-8xl">
                  +{classImprovement}%
                </span>
                <span className="font-display text-2xl font-bold">class improvement</span>
              </div>
              <p className="mt-3 max-w-md text-sm text-background/70">
                Class average has climbed from {classAvg[0].avg} to {classAvg.at(-1)!.avg} over {classAvg.length} sessions. Keep the momentum.
              </p>
            </div>
            <Badge3D color="sunshine" className="h-32 w-32">
              <TrendingUp className="h-16 w-16" strokeWidth={2.5} />
            </Badge3D>
          </div>
        </Card>

        {/* KPI row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {seedSectionAccuracy.map((s, i) => {
            const delta = s.current - s.last;
            const up = delta >= 0;
            const colors = ["coral", "mint", "sky", "sunshine"] as const;
            return (
              <Card key={s.section} className="border-2 border-foreground/10 p-5 badge-shadow">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{s.section}</div>
                  <Badge3D color={colors[i]} className="h-9 w-9">
                    <Target className="h-4 w-4" strokeWidth={2.5} />
                  </Badge3D>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-4xl font-bold">{s.current}%</span>
                  <span className={cn("inline-flex items-center text-sm font-bold", up ? "text-mint-foreground" : "text-coral")}>
                    {up ? <ArrowUp className="h-4 w-4" strokeWidth={3} /> : <ArrowDown className="h-4 w-4" strokeWidth={3} />}
                    {Math.abs(delta)}
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">vs last session ({s.last}%)</div>
              </Card>
            );
          })}
        </div>

        {/* Confidence calibration + Misconceptions */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-2 border-foreground/10 p-6 badge-shadow">
            <div className="flex items-center gap-3">
              <Badge3D color="sky" className="h-10 w-10">
                <Brain className="h-5 w-5" strokeWidth={2.5} />
              </Badge3D>
              <div className="font-display text-lg font-bold">Confidence calibration</div>
            </div>
            <div className="mt-5 grid place-items-center">
              <div className="relative grid h-40 w-40 place-items-center">
                <svg viewBox="0 0 100 100" className="absolute inset-0">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-muted)" strokeWidth="10" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="var(--color-mint)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 42}
                    strokeDashoffset={2 * Math.PI * 42 * (1 - confidenceCalibration / 100)}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="text-center">
                  <div className="font-display text-4xl font-bold">{confidenceCalibration}%</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Sure & correct</div>
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Of students who said &quot;Sure&quot;, {confidenceCalibration}% were right. The honest measure of real understanding.
            </p>
          </Card>

          <Card className="border-2 border-foreground/10 p-6 lg:col-span-2 badge-shadow">
            <div className="flex items-center gap-3">
              <Badge3D color="coral" className="h-10 w-10">
                <Flame className="h-5 w-5" strokeWidth={2.5} />
              </Badge3D>
              <div>
                <div className="font-display text-lg font-bold">Misconception tracker</div>
                <div className="text-xs text-muted-foreground">Questions where the majority went wrong, across sessions.</div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {misconceptions.map((m) => (
                <div key={m.question} className="flex items-center gap-3 rounded-xl border-2 border-foreground/5 bg-background p-3">
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{m.question}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.section} · {m.sessions} sessions</div>
                  </div>
                  <div className="w-32 shrink-0">
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-coral" style={{ width: `${m.wrongPct}%` }} />
                    </div>
                  </div>
                  <div className="w-12 text-right font-bold text-coral">{m.wrongPct}%</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Individual progress */}
        <Card className="border-2 border-foreground/10 p-6 badge-shadow">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Badge3D color="mint" className="h-10 w-10">
                <TrendingUp className="h-5 w-5" strokeWidth={2.5} />
              </Badge3D>
              <div>
                <div className="font-display text-lg font-bold">Individual improvement</div>
                <div className="text-xs text-muted-foreground">Per-student growth across sessions.</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={student} onValueChange={setStudent}>
                <SelectTrigger className="h-10 w-44 rounded-xl border-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {seedStudents.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <span
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold"
                style={{ backgroundColor: trendColor, color: "white" }}
              >
                {trendLabel}
              </span>
            </div>
          </div>

          <div className="mt-6 h-64">
            <ResponsiveContainer>
              <LineChart data={perStudentSeries}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="session" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "2px solid var(--color-foreground)" }} />
                <Line
                  type="monotone"
                  dataKey={student}
                  stroke={trendColor}
                  strokeWidth={3}
                  dot={{ r: 5, strokeWidth: 2, fill: "white" }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {studentScores.map((v, i) => (
              <div key={i} className="rounded-xl border-2 border-foreground/5 bg-background p-3 text-center">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">S{i + 1}</div>
                <div className="font-display text-xl font-bold">{v}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Class-wide improvement */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-2 border-foreground/10 p-6 badge-shadow">
            <div className="flex items-center gap-3">
              <Badge3D color="coral" className="h-10 w-10">
                <Zap className="h-5 w-5" strokeWidth={2.5} />
              </Badge3D>
              <div>
                <div className="font-display text-lg font-bold">Individual improvement %</div>
                <div className="text-xs text-muted-foreground">First session vs latest.</div>
              </div>
            </div>
            <div className="mt-6 h-72">
              <ResponsiveContainer>
                <BarChart data={improvementByStudent}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="student" tickLine={false} axisLine={false} fontSize={11} interval={0} angle={-25} textAnchor="end" height={50} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "2px solid var(--color-foreground)" }} />
                  <Bar dataKey="improvement" radius={[8, 8, 0, 0]} fill="var(--color-coral)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="border-2 border-foreground/10 p-6 badge-shadow">
            <div className="flex items-center gap-3">
              <Badge3D color="mint" className="h-10 w-10">
                <TrendingUp className="h-5 w-5" strokeWidth={2.5} />
              </Badge3D>
              <div>
                <div className="font-display text-lg font-bold">Class average over time</div>
                <div className="text-xs text-muted-foreground">Average score per session.</div>
              </div>
            </div>
            <div className="mt-6 h-72">
              <ResponsiveContainer>
                <LineChart data={classAvg}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="session" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "2px solid var(--color-foreground)" }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    name="Class avg"
                    dataKey="avg"
                    stroke="var(--color-mint)"
                    strokeWidth={3}
                    dot={{ r: 5, strokeWidth: 2, fill: "white" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}