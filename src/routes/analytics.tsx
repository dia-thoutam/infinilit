import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, BarChart3, Brain, Flame, Target, TrendingUp, Zap } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/app-shell";
import { HexBadge } from "@/components/hex-badge";
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

  // Highlight best-improving student in the bar chart
  const topImproverIdx = improvementByStudent.reduce(
    (best, x, i, arr) => (x.improvement > arr[best].improvement ? i : best),
    0,
  );

  // Highlight biggest session-over-session jump on the class average line
  const biggestJump = classAvg.reduce(
    (acc, p, i) => {
      if (i === 0) return acc;
      const delta = p.avg - classAvg[i - 1].avg;
      return delta > acc.delta ? { idx: i, delta, point: p } : acc;
    },
    { idx: 0, delta: -Infinity, point: classAvg[0] },
  );

  // Highlight best-moving section in the KPI row
  const bestSectionIdx = seedSectionAccuracy.reduce(
    (best, s, i, arr) => (s.current - s.last > arr[best].current - arr[best].last ? i : best),
    0,
  );

  const misconceptions = [
    { question: "Real return when inflation > nominal", section: "Inflation", wrongPct: 71, sessions: 3 },
    { question: "APR vs one-time fee on credit balance", section: "Credit", wrongPct: 64, sessions: 4 },
    { question: "What 20% of the 50/30/20 rule covers", section: "Budgeting", wrongPct: 52, sessions: 2 },
    { question: "Diversification reduces which risk", section: "Investing", wrongPct: 48, sessions: 2 },
  ];

  const confidenceCalibration = 68; // % who said Sure and were actually correct

  return (
    <AppShell>
      <div className="space-y-8 rounded-3xl bg-white/55 p-6 sm:p-8 backdrop-blur-md border-2 border-white/70 shadow-2xl">
        <div>
          <div className="section-pill inline-flex items-center gap-2 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-white" style={{ background: "linear-gradient(180deg, #9fc8ff 0%, #5a9cff 55%, #2b6fe0 100%)" }}>
            <BarChart3 className="h-3.5 w-3.5 drop-shadow-[0_1px_0_rgba(0,0,0,0.25)]" strokeWidth={3.5} /> Class Analytics
          </div>
          <h1 className="mt-3 font-display text-4xl font-black text-foreground sm:text-5xl [text-shadow:0_1px_0_rgba(255,255,255,0.6)]">Progress, in numbers.</h1>
          <p className="mt-2 max-w-2xl font-semibold text-foreground">
            Honest measures of learning — accuracy, calibration, and where the class is still tripping up.
          </p>
        </div>

        {/* Hero metric */}
        <Card className="relative overflow-hidden border-2 border-foreground/20 p-0 badge-shadow bg-gradient-to-br from-[#fff7ed] via-[#ffedd5] to-[#fed7aa]">
          <div className="relative grid items-center gap-8 p-8 sm:grid-cols-[1fr_auto]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border-2 border-foreground/10 bg-foreground px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-background">
                <Flame className="h-3.5 w-3.5 text-sunshine" strokeWidth={3} /> Since Session 1
              </div>
                <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-2">
                  <span
                    className="font-display text-[5rem] font-black leading-none tracking-tight sm:text-[7rem]"
                    style={{
                      background: "linear-gradient(180deg, #fffbe8 0%, #ffe7a3 35%, #ffc95c 70%, #e85d2b 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      filter: "drop-shadow(0 3px 0 rgba(80,35,10,0.18)) drop-shadow(0 6px 14px rgba(120,60,20,0.25))",
                    }}
                  >
                    +{classImprovement}%
                  </span>
                  <span className="font-display text-2xl font-black text-foreground sm:text-3xl">class improvement</span>
                </div>
              <p className="mt-4 max-w-md text-sm font-semibold text-foreground">
                Class average climbed from <span className="font-black text-foreground">{classAvg[0].avg}</span> to <span className="font-black text-foreground">{classAvg.at(-1)!.avg}</span> over {classAvg.length} sessions. Keep the momentum.
              </p>
            </div>
            <div className="relative hidden sm:grid h-28 w-28 shrink-0 place-items-center rounded-full bg-sunshine/90 border-2 border-foreground/10 shadow-lg">
              <TrendingUp className="h-14 w-14 text-foreground" strokeWidth={2.5} />
            </div>
          </div>
        </Card>

        {/* KPI row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {seedSectionAccuracy.map((s, i) => {
            const delta = s.current - s.last;
            const up = delta >= 0;
            const colors = ["coral", "mint", "sky", "sunshine"] as const;
            const isBest = i === bestSectionIdx;
            return (
              <Card
                key={s.section}
                className={cn(
                  "border-2 border-foreground/20 p-5 badge-shadow relative",
                  isBest && "border-sunshine ring-4 ring-sunshine/40",
                )}
              >
                {isBest && (
                  <span className="absolute -top-2 -right-2 inline-flex items-center gap-1 rounded-full bg-sunshine border-2 border-foreground px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-foreground badge-shadow">
                    Top mover
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black uppercase tracking-wider text-foreground">{s.section}</div>
                  <HexBadge tone={colors[i]} size={36}>
                    <Target className="h-4 w-4" strokeWidth={2.5} />
                  </HexBadge>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-4xl font-black text-foreground [text-shadow:0_1px_0_rgba(255,255,255,0.7)]">{s.current}%</span>
                  <span className={cn("inline-flex items-center text-sm font-black", up ? "text-mint-foreground" : "text-coral")}>
                    {up ? <ArrowUp className="h-4 w-4" strokeWidth={3} /> : <ArrowDown className="h-4 w-4" strokeWidth={3} />}
                    {Math.abs(delta)}
                  </span>
                </div>
                <div className="mt-1 text-xs font-bold text-foreground">vs last session ({s.last}%)</div>
              </Card>
            );
          })}
        </div>

        {/* Confidence calibration + Misconceptions */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-2 border-foreground/20 p-6 badge-shadow bg-white">
            <div className="flex items-center gap-3">
              <HexBadge tone="sky" size={40}>
                <Brain className="h-5 w-5" strokeWidth={2.5} />
              </HexBadge>
              <div className="font-display text-lg font-black text-foreground">Confidence calibration</div>
            </div>
            <div className="mt-5 grid place-items-center">
              <div className="relative grid h-40 w-40 place-items-center">
                <svg viewBox="0 0 100 100" className="absolute inset-0">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-border)" strokeWidth="12" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="var(--color-mint)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 42}
                    strokeDashoffset={2 * Math.PI * 42 * (1 - confidenceCalibration / 100)}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="text-center">
                  <div className="font-display text-4xl font-black text-foreground [text-shadow:0_1px_0_rgba(255,255,255,0.7)]">{confidenceCalibration}%</div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-foreground">Sure & correct</div>
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs font-semibold text-foreground">
              Of students who said &quot;Sure&quot;, {confidenceCalibration}% were right. The honest measure of real understanding.
            </p>
          </Card>

          <Card className="border-2 border-foreground/20 p-6 lg:col-span-2 badge-shadow bg-white">
            <div className="flex items-center gap-3">
              <HexBadge tone="coral" size={40}>
                <Flame className="h-5 w-5" strokeWidth={2.5} />
              </HexBadge>
              <div>
                <div className="font-display text-lg font-black text-foreground">Misconception tracker</div>
                <div className="text-xs font-semibold text-foreground">Questions where the majority went wrong, across sessions.</div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {misconceptions.map((m) => (
                <div key={m.question} className="flex items-center gap-3 rounded-xl border-2 border-foreground/15 bg-white p-3">
                  <div className="flex-1">
                    <div className="text-sm font-black text-foreground">{m.question}</div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-foreground">{m.section} · {m.sessions} sessions</div>
                  </div>
                  <div className="w-32 shrink-0">
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-coral" style={{ width: `${m.wrongPct}%` }} />
                    </div>
                  </div>
                  <div className="w-12 text-right font-black text-coral [text-shadow:0_1px_0_rgba(255,255,255,0.7)]">{m.wrongPct}%</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Individual progress */}
        <Card className="border-2 border-foreground/20 p-6 badge-shadow bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <HexBadge tone="mint" size={40}>
                <TrendingUp className="h-5 w-5" strokeWidth={2.5} />
              </HexBadge>
              <div>
                <div className="font-display text-lg font-black text-foreground">Individual improvement</div>
                <div className="text-xs font-semibold text-foreground">Per-student growth across sessions.</div>
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
                className="inline-flex items-center gap-1 rounded-full border-2 border-foreground/20 px-3 py-1 text-xs font-black text-white [text-shadow:0_1px_0_rgba(0,0,0,0.35)]"
                style={{ backgroundColor: trendColor }}
              >
                {trendLabel}
              </span>
            </div>
          </div>

          <div className="mt-6 h-64">
            <ResponsiveContainer>
              <LineChart data={perStudentSeries}>
                <CartesianGrid stroke="var(--color-foreground)" strokeOpacity={0.12} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="session" tickLine={false} axisLine={{ stroke: "var(--color-foreground)", strokeOpacity: 0.35 }} tick={{ fill: "var(--color-foreground)", fontSize: 12, fontWeight: 700 }} />
                <YAxis tickLine={false} axisLine={{ stroke: "var(--color-foreground)", strokeOpacity: 0.35 }} tick={{ fill: "var(--color-foreground)", fontSize: 12, fontWeight: 700 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "2px solid var(--color-foreground)", color: "var(--color-foreground)" }} />
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
              <div key={i} className="rounded-xl border-2 border-foreground/15 bg-white p-3 text-center shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-wider text-foreground">S{i + 1}</div>
                <div className="font-display text-xl font-black text-foreground [text-shadow:0_1px_0_rgba(255,255,255,0.7)]">{v}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Class-wide improvement */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-2 border-foreground/20 p-6 badge-shadow bg-white">
            <div className="flex items-center gap-3">
              <HexBadge tone="coral" size={40}>
                <Zap className="h-5 w-5" strokeWidth={2.5} />
              </HexBadge>
              <div>
                <div className="font-display text-lg font-black text-foreground">Individual improvement %</div>
                <div className="text-xs font-semibold text-foreground">First session vs latest.</div>
              </div>
            </div>
            <div className="mt-6 h-72">
              <ResponsiveContainer>
                <BarChart data={improvementByStudent}>
                  <CartesianGrid stroke="var(--color-foreground)" strokeOpacity={0.12} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="student" tickLine={false} axisLine={{ stroke: "var(--color-foreground)", strokeOpacity: 0.35 }} tick={{ fill: "var(--color-foreground)", fontSize: 11, fontWeight: 700 }} interval={0} angle={-25} textAnchor="end" height={50} />
                  <YAxis tickLine={false} axisLine={{ stroke: "var(--color-foreground)", strokeOpacity: 0.35 }} tick={{ fill: "var(--color-foreground)", fontSize: 12, fontWeight: 700 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "2px solid var(--color-foreground)", color: "var(--color-foreground)" }} />
                  <Bar dataKey="improvement" radius={[8, 8, 0, 0]}>
                    {improvementByStudent.map((_, i) => (
                      <Cell
                        key={i}
                        fill={i === topImproverIdx ? "var(--color-sunshine)" : "var(--color-coral)"}
                        stroke={i === topImproverIdx ? "var(--color-foreground)" : "none"}
                        strokeWidth={i === topImproverIdx ? 2 : 0}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="border-2 border-foreground/20 p-6 badge-shadow bg-white">
            <div className="flex items-center gap-3">
              <HexBadge tone="mint" size={40}>
                <TrendingUp className="h-5 w-5" strokeWidth={2.5} />
              </HexBadge>
              <div>
                <div className="font-display text-lg font-black text-foreground">Class average over time</div>
                <div className="text-xs font-semibold text-foreground">Average score per session.</div>
              </div>
            </div>
            <div className="mt-6 h-72">
              <ResponsiveContainer>
                <LineChart data={classAvg}>
                  <CartesianGrid stroke="var(--color-foreground)" strokeOpacity={0.12} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="session" tickLine={false} axisLine={{ stroke: "var(--color-foreground)", strokeOpacity: 0.35 }} tick={{ fill: "var(--color-foreground)", fontSize: 12, fontWeight: 700 }} />
                  <YAxis tickLine={false} axisLine={{ stroke: "var(--color-foreground)", strokeOpacity: 0.35 }} tick={{ fill: "var(--color-foreground)", fontSize: 12, fontWeight: 700 }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "2px solid var(--color-foreground)", color: "var(--color-foreground)" }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-foreground)", fontWeight: 700 }} />
                  <Line
                    type="monotone"
                    name="Class avg"
                    dataKey="avg"
                    stroke="var(--color-mint)"
                    strokeWidth={5}
                    dot={{ r: 5, strokeWidth: 2, fill: "white" }}
                    activeDot={{ r: 8 }}
                  />
                  {Number.isFinite(biggestJump.delta) && (
                    <ReferenceDot
                      x={biggestJump.point.session}
                      y={biggestJump.point.avg}
                      r={9}
                      fill="var(--color-sunshine)"
                      stroke="var(--color-foreground)"
                      strokeWidth={2.5}
                      label={{
                        value: `+${biggestJump.delta} biggest jump`,
                        position: "top",
                        fontSize: 11,
                        fontWeight: 700,
                        fill: "var(--color-foreground)",
                      }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}