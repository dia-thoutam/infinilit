import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Award,
  Check,
  ChevronRight,
  Crown,
  Flame,
  Medal,
  Sparkles,
  Star,
  Target,
  Timer,
  TrendingUp,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell, Badge3D } from "@/components/app-shell";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClassrooms, type Classroom } from "@/store/classrooms";
import { HexBadge } from "@/components/hex-badge";
import { CompletedScreen } from "@/components/completed-screen";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { mockVoteDistribution, seedSectionAccuracy, xpFor } from "@/data/seed";
import { useQuizzes } from "@/store/quizzes";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "Play — InFiniLit Quiz Arena" },
      { name: "description", content: "Quiz arena: answer financial literacy questions, earn XP, and climb the class leaderboard." },
      { property: "og:title", content: "InFiniLit Quiz Arena" },
      { property: "og:description", content: "Earn XP and climb the leaderboard in the InFiniLit quiz arena." },
    ],
  }),
  component: QuizPage,
});

type Phase = "lobby" | "question" | "confidence" | "reveal" | "completed" | "leaderboard" | "progress";
type Confidence = "sure" | "unsure" | "guessing";

function QuizPage() {
  const quizzes = useQuizzes((s) => s.quizzes);
  const recordAttempt = useQuizzes((s) => s.recordAttempt);
  const classrooms = useClassrooms((s) => s.classrooms);

  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [classroomId, setClassroomId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("lobby");
  const [qIndex, setQIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [xp, setXp] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [votes, setVotes] = useState<[number, number, number, number]>([0, 0, 0, 0]);
  const [finalXp, setFinalXp] = useState(0);
  const [finalAccuracy, setFinalAccuracy] = useState(0);
  const emptyPicks = (): Record<0 | 1 | 2 | 3, string[]> => ({ 0: [], 1: [], 2: [], 3: [] });
  const [studentPicks, setStudentPicks] = useState<Record<0 | 1 | 2 | 3, string[]>>(emptyPicks);

  const quiz = useMemo(() => quizzes.find((q) => q.id === activeQuizId) ?? null, [quizzes, activeQuizId]);
  const question = quiz?.questions[qIndex];
  const classroom = useMemo(() => classrooms.find((c) => c.id === classroomId) ?? null, [classrooms, classroomId]);
  const teacherMode = !!classroom;

  // Question timer
  useEffect(() => {
    if (phase !== "question") return;
    setSecondsLeft(30);
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          // auto move to confidence with no pick
          setPicked((p) => (p === null ? -1 : p));
          setPhase("confidence");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase, qIndex]);

  // Confidence auto-advance after 5s
  useEffect(() => {
    if (phase !== "confidence") return;
    const id = setTimeout(() => {
      if (!confidence) setConfidence("guessing");
      setPhase("reveal");
      if (question) setVotes(mockVoteDistribution(question.correct));
    }, 5000);
    return () => clearTimeout(id);
  }, [phase, confidence, question]);

  const start = (id: string, cid: string | null) => {
    setActiveQuizId(id);
    setClassroomId(cid);
    setPhase("question");
    setQIndex(0);
    setPicked(null);
    setConfidence(null);
    setXp(0);
    setCorrectCount(0);
    setStudentPicks(emptyPicks());
  };

  const choose = (idx: number) => {
    if (phase !== "question") return;
    if (teacherMode) return; // teacher mode uses per-choice student picker
    setPicked(idx);
    setPhase("confidence");
  };

  const toggleStudentPick = (choice: 0 | 1 | 2 | 3, studentId: string) => {
    setStudentPicks((prev) => {
      const next = { ...prev, 0: [...prev[0]], 1: [...prev[1]], 2: [...prev[2]], 3: [...prev[3]] };
      // remove from all other choices (a student can only vote once)
      ([0, 1, 2, 3] as const).forEach((k) => {
        next[k] = next[k].filter((id) => id !== studentId);
      });
      if (!prev[choice].includes(studentId)) next[choice] = [...next[choice], studentId];
      return next;
    });
  };

  const lockInTeacherVotes = () => {
    if (!question) return;
    const v: [number, number, number, number] = [
      studentPicks[0].length,
      studentPicks[1].length,
      studentPicks[2].length,
      studentPicks[3].length,
    ];
    setVotes(v);
    // pick = the choice with most votes (for advance logic / xp award proxy)
    const top = v.indexOf(Math.max(...v));
    setPicked(top);
    setPhase("reveal");
  };

  const advance = () => {
    if (!quiz || !question) return;
    // award xp
    if (picked === question.correct) {
      setXp((x) => x + xpFor(question.difficulty));
      setCorrectCount((c) => c + 1);
    }
    if (qIndex + 1 < quiz.questions.length) {
      setQIndex((i) => i + 1);
      setPicked(null);
      setConfidence(null);
      setPhase("question");
    } else {
      const accuracy = Math.round(((correctCount + (picked === question.correct ? 1 : 0)) / quiz.questions.length) * 100);
      const totalXp = xp + (picked === question.correct ? xpFor(question.difficulty) : 0);
      recordAttempt(quiz.id, accuracy, totalXp);
      setFinalAccuracy(accuracy);
      setFinalXp(totalXp);
      setPhase("completed");
    }
  };

  if (phase === "lobby" || !quiz || !question) {
    return (
      <AppShell>
        <Lobby quizzes={quizzes} classrooms={classrooms} onStart={start} />
      </AppShell>
    );
  }

  if (phase === "leaderboard") {
    return <LeaderboardScreen onNext={() => setPhase("progress")} myXp={finalXp || xp} />;
  }

  if (phase === "completed") {
    return (
      <CompletedScreen
        xp={finalXp}
        accuracy={finalAccuracy}
        quizTitle={quiz.title}
        onContinue={() => setPhase("leaderboard")}
      />
    );
  }

  if (phase === "progress") {
    return (
      <AppShell>
        <ProgressSplit onDone={() => setPhase("lobby")} />
      </AppShell>
    );
  }

  const majorityWrong = phase === "reveal" && votes[question.correct] < Math.max(...votes);

  return (
    <AppShell bare>
      {phase === "confidence" ? (
        <ConfidenceScreen onPick={(c) => { setConfidence(c); setPhase("reveal"); setVotes(mockVoteDistribution(question.correct)); }} />
      ) : (
        <div
          className={cn(
            "min-h-[calc(100vh-65px)] transition-colors",
            majorityWrong ? "bg-amber-alert/30" : "bg-background",
          )}
        >
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
            {/* Top bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-foreground/10 px-3 py-1">Session 7</span>
                <span className="rounded-full bg-sky/20 px-3 py-1 text-sky">{question.section}</span>
                <span className="rounded-full bg-foreground/10 px-3 py-1">
                  Q{qIndex + 1}/{quiz.questions.length}
                </span>
                {classroom && (
                  <span className="rounded-full bg-mint/20 px-3 py-1 text-foreground">{classroom.name}</span>
                )}
                <span
                  className={cn(
                    "rounded-full px-3 py-1",
                    question.difficulty === "hard" && "bg-coral/20 text-coral",
                    question.difficulty === "medium" && "bg-sunshine/30 text-foreground",
                    question.difficulty === "easy" && "bg-mint/20 text-foreground",
                  )}
                >
                  {question.difficulty} · {xpFor(question.difficulty)} XP
                </span>
              </div>
              <TimerCircle seconds={secondsLeft} max={30} />
            </div>

            {/* Question 60% */}
            <div className="mt-8 grid min-h-[35vh] place-items-center">
              <h1 className="font-display text-3xl font-bold leading-tight sm:text-5xl">
                {question.text}
              </h1>
            </div>

            {/* Choices 40% */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {question.choices.map((c, i) => {
                const letter = "ABCD"[i];
                const isCorrect = phase === "reveal" && i === question.correct;
                const isWrongPick = phase === "reveal" && i === picked && i !== question.correct;
                const dim = phase === "reveal" && i !== question.correct;
                if (teacherMode && phase === "question") {
                  return (
                    <ChoiceWithStudents
                      key={i}
                      letter={letter}
                      text={c}
                      classroom={classroom!}
                      picked={studentPicks[i as 0 | 1 | 2 | 3]}
                      allPicks={studentPicks}
                      onToggle={(sid) => toggleStudentPick(i as 0 | 1 | 2 | 3, sid)}
                    />
                  );
                }
                return (
                  <button
                    key={i}
                    onClick={() => choose(i)}
                    disabled={phase !== "question"}
                    className={cn(
                      "group flex items-center gap-4 rounded-2xl border-2 border-foreground/10 bg-card p-4 text-left transition-all badge-shadow",
                      phase === "question" && "hover:-translate-y-1 hover:border-coral",
                      isCorrect && "border-mint bg-mint/15 scale-[1.02]",
                      isWrongPick && "border-coral bg-coral/10",
                      dim && !isCorrect && "opacity-50",
                      picked === i && phase !== "reveal" && "border-coral",
                    )}
                  >
                    <div
                      className={cn(
                        "grid h-12 w-12 shrink-0 place-items-center rounded-xl chunky-border font-display text-xl font-bold",
                        isCorrect ? "bg-mint text-mint-foreground" : "bg-sunshine text-foreground",
                      )}
                    >
                      {isCorrect ? <Check className="h-6 w-6" strokeWidth={3} /> : letter}
                    </div>
                    <div className="flex-1 font-medium">{c}</div>
                    {isWrongPick && <X className="h-5 w-5 text-coral" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>

            {teacherMode && phase === "question" && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground">
                  {Object.values(studentPicks).reduce((a, b) => a + b.length, 0)} / {classroom!.students.length} students recorded
                </div>
                <Button variant="coral" size="xl" onClick={lockInTeacherVotes}>
                  Lock in & reveal <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            )}

            {phase === "reveal" && (
              <div className="mt-6 space-y-4">
                <Card className="border-2 border-foreground bg-foreground p-4 text-background">
                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-sunshine" strokeWidth={2.5} />
                    <p className="text-sm font-medium">{question.explanation}</p>
                  </div>
                </Card>

                <VoteBar votes={votes} correct={question.correct} />

                {majorityWrong && (
                  <Card className="border-2 border-amber-alert bg-amber-alert/20 p-5">
                    <div className="flex items-start gap-3">
                      <Flame className="mt-1 h-6 w-6 shrink-0 text-amber-alert" strokeWidth={2.5} />
                      <div>
                        <div className="font-display text-xl font-bold">Let&apos;s talk about this</div>
                        <p className="mt-1 text-sm">
                          {question.misconception ??
                            "Most of the class went a different direction — worth opening the floor and walking through the reasoning together."}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                <div className="flex justify-end pt-2">
                  <Button variant="coral" size="xl" onClick={advance}>
                    {qIndex + 1 < quiz.questions.length ? "Next question" : "See leaderboard"}
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}

/* ---------- Lobby ---------- */
function Lobby({ quizzes, onStart }: { quizzes: ReturnType<typeof useQuizzes.getState>["quizzes"]; onStart: (id: string) => void }) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-sunshine px-3 py-1 text-xs font-bold uppercase tracking-wider text-foreground chunky-border">
            <Star className="h-3 w-3" strokeWidth={3} /> Quiz Arena
          </div>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl">
            Pick a quiz.<br />Earn your XP.
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Easy = 20 XP · Medium = 50 XP · Hard = 100 XP. Race the timer, lock in your confidence, and outscore the class.
          </p>
        </div>
        <Link to="/teacher" className="inline-flex">
          <Button variant="badge" size="lg">
            <Sparkles className="h-4 w-4" /> Browse all quizzes
          </Button>
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {quizzes.map((q, i) => {
          const colors = ["coral", "sunshine", "mint", "sky"] as const;
          const c = colors[i % colors.length];
          return (
            <Card key={q.id} className="overflow-hidden border-2 border-foreground/10 p-0 badge-shadow">
              <div className={cn("h-2", c === "coral" && "bg-coral", c === "sunshine" && "bg-sunshine", c === "mint" && "bg-mint", c === "sky" && "bg-sky")} />
              <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <HexBadge tone={c} size={64}>
                    <Trophy className="h-full w-full" strokeWidth={2.5} />
                  </HexBadge>
                  {q.lastAttempt && (
                    <div className="text-right text-xs">
                      <div className="font-bold text-mint">{q.lastAttempt.accuracy}% acc</div>
                      <div className="text-muted-foreground">{q.lastAttempt.xp} XP</div>
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-display text-xl font-bold leading-snug">{q.title}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{q.description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-muted px-2 py-1 font-semibold">{q.questions.length} questions</span>
                  <span className="rounded-full bg-muted px-2 py-1 font-semibold">
                    {q.questions.reduce((sum, x) => sum + xpFor(x.difficulty), 0)} XP total
                  </span>
                </div>
                <Button variant="coral" className="w-full" size="lg" onClick={() => onStart(q.id)}>
                  Start <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Timer ---------- */
function TimerCircle({ seconds, max }: { seconds: number; max: number }) {
  const pct = seconds / max;
  const r = 18;
  const C = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex h-12 w-12 items-center justify-center">
      <svg className="absolute inset-0" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={r} stroke="currentColor" className="text-foreground/10" strokeWidth="4" fill="none" />
        <circle
          cx="22"
          cy="22"
          r={r}
          stroke="currentColor"
          className={cn(seconds <= 5 ? "text-coral" : "text-foreground")}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - pct)}
          transform="rotate(-90 22 22)"
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>
      <Timer className="h-4 w-4" strokeWidth={2.5} />
      <span className="sr-only">{seconds}s</span>
    </div>
  );
}

/* ---------- Confidence ---------- */
function ConfidenceScreen({ onPick }: { onPick: (c: Confidence) => void }) {
  return (
    <div className="grid min-h-[calc(100vh-65px)] place-items-center bg-foreground px-4 py-10 text-background">
      <div className="w-full max-w-5xl space-y-10 text-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-sunshine px-3 py-1 text-xs font-bold uppercase tracking-wider text-foreground">
            5 second check
          </div>
          <h2 className="mt-4 font-display text-5xl font-bold sm:text-7xl">How sure are you?</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Button variant="mint" size="massive" onClick={() => onPick("sure")}>
            <Check className="h-7 w-7" strokeWidth={3} /> Sure
          </Button>
          <Button variant="sunshine" size="massive" onClick={() => onPick("unsure")}>
            <Sparkles className="h-7 w-7" strokeWidth={2.5} /> Unsure
          </Button>
          <Button variant="coral" size="massive" onClick={() => onPick("guessing")}>
            <Zap className="h-7 w-7" strokeWidth={2.5} /> Guessing
          </Button>
        </div>
        <p className="text-sm text-background/60">Reveal in a few seconds…</p>
      </div>
    </div>
  );
}

/* ---------- Vote bar ---------- */
function VoteBar({ votes, correct }: { votes: [number, number, number, number]; correct: number }) {
  const data = votes.map((v, i) => ({ name: "ABCD"[i], votes: v, fill: i === correct ? "var(--color-mint)" : "var(--color-muted-foreground)" }));
  return (
    <Card className="border-2 border-foreground/10 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Class voted</div>
        <div className="text-xs text-muted-foreground">{votes.reduce((a, b) => a + b, 0)} responses</div>
      </div>
      <div className="h-32">
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={24} tickLine={false} axisLine={false} />
            <Bar dataKey="votes" radius={[8, 8, 8, 8]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

/* ---------- Leaderboard ---------- */
function LeaderboardScreen({ onNext, myXp }: { onNext: () => void; myXp: number }) {
  const ranked = [
    { name: "You", improvement: 28, xp: 1820 + myXp },
    { name: "Maya", improvement: 24, xp: 1740 },
    { name: "Zara", improvement: 21, xp: 1690 },
    { name: "Ananya", improvement: 18, xp: 1610 },
    { name: "Priya", improvement: 16, xp: 1540 },
    { name: "Kabir", improvement: 14, xp: 1470 },
    { name: "Aarav", improvement: 12, xp: 1390 },
    { name: "Dev", improvement: 9, xp: 1280 },
    { name: "Tara", improvement: 7, xp: 1190 },
    { name: "Ishita", improvement: 5, xp: 1080 },
    { name: "Vikram", improvement: 2, xp: 980 },
    { name: "Rohan", improvement: -3, xp: 860 },
  ];
  const top3 = ranked.slice(0, 3);
  const awards = [
    { label: "Most Improved", winner: "Maya", color: "coral" as const, icon: TrendingUp },
    { label: "Most Consistent", winner: "Ananya", color: "mint" as const, icon: Target },
    { label: "Fastest Mind", winner: "Zara", color: "sky" as const, icon: Zap },
    { label: "Top Scorer", winner: "You", color: "sunshine" as const, icon: Crown },
  ];

  return (
    <div className="min-h-screen bg-sunshine text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between">
          <Link to="/quiz" className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-bold uppercase text-background">
            <Trophy className="h-4 w-4" strokeWidth={3} /> Session Leaderboard
          </Link>
          <Button variant="coral" onClick={onNext}>
            See class progress <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <h1 className="mt-6 text-center font-display text-5xl font-bold sm:text-7xl">Final standings</h1>
        <p className="mt-2 text-center text-sm font-semibold uppercase tracking-wider">Ranked by improvement score</p>

        {/* Top 3 */}
        <div className="mt-10 grid items-end gap-4 sm:grid-cols-3">
          {[1, 0, 2].map((order) => {
            const s = top3[order];
            const heights = ["h-56", "h-72", "h-48"];
            const colors = ["bg-card", "bg-coral text-coral-foreground", "bg-mint text-mint-foreground"];
            const icons = [Medal, Crown, Award];
            const Icon = icons[order];
            return (
              <div key={s.name} className={cn("rounded-3xl chunky-border badge-shadow p-5 flex flex-col items-center justify-between", heights[order === 0 ? 1 : order === 1 ? 0 : 2], colors[order])}>
                <Icon className="h-10 w-10" strokeWidth={2.5} />
                <div className="text-center">
                  <div className="font-display text-3xl font-bold">#{order + 1}</div>
                  <div className="mt-1 font-display text-2xl font-bold">{s.name}</div>
                </div>
                <div className="rounded-full bg-foreground px-4 py-2 text-sm font-bold text-background">
                  +{s.improvement} pts
                </div>
              </div>
            );
          })}
        </div>

        {/* Full table */}
        <Card className="mt-8 overflow-hidden border-2 border-foreground bg-card p-0 badge-shadow">
          <div className="grid grid-cols-12 border-b-2 border-foreground/10 bg-foreground/5 px-5 py-3 text-xs font-bold uppercase tracking-wider">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Student</div>
            <div className="col-span-4">Improvement</div>
            <div className="col-span-2 text-right">XP</div>
          </div>
          {ranked.map((s, i) => (
            <div
              key={s.name}
              className={cn(
                "grid grid-cols-12 items-center border-b border-foreground/5 px-5 py-3 text-sm last:border-b-0",
                s.name === "You" && "bg-coral/10 font-bold",
              )}
            >
              <div className="col-span-1 font-bold">{i + 1}</div>
              <div className="col-span-5">{s.name}</div>
              <div className="col-span-4 flex items-center gap-2">
                <div className="h-2 w-24 overflow-hidden rounded-full bg-foreground/10">
                  <div className={cn("h-full", s.improvement >= 0 ? "bg-mint" : "bg-coral")} style={{ width: `${Math.min(100, Math.abs(s.improvement) * 3)}%` }} />
                </div>
                <span className={cn("font-semibold", s.improvement >= 0 ? "text-mint-foreground" : "text-coral")}>
                  {s.improvement > 0 ? "+" : ""}{s.improvement}
                </span>
              </div>
              <div className="col-span-2 text-right font-bold">{s.xp.toLocaleString()}</div>
            </div>
          ))}
        </Card>

        {/* Awards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {awards.map((a) => {
            const Icon = a.icon;
            return (
              <Card key={a.label} className="border-2 border-foreground bg-card p-5 text-center badge-shadow">
                <div className="mx-auto w-fit">
                  <HexBadge tone={a.color} size={88}>
                    <Icon className="h-full w-full" strokeWidth={2.5} />
                  </HexBadge>
                </div>
                <div className="mt-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{a.label}</div>
                <div className="mt-1 font-display text-xl font-bold">{a.winner}</div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- Progress split ---------- */
function ProgressSplit({ onDone }: { onDone: () => void }) {
  const data = seedSectionAccuracy.map((s) => ({ section: s.section, "Last session": s.last, "This session": s.current }));
  const spotlights = [
    { label: "Most Improved", name: "Kabir", value: "+33 pts", color: "coral" as const, icon: TrendingUp },
    { label: "Most Consistent", name: "Ananya", value: "6 sessions ↑", color: "mint" as const, icon: Target },
    { label: "Fastest Mind", name: "Zara", value: "avg 6.4s", color: "sky" as const, icon: Zap },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-mint px-3 py-1 text-xs font-bold uppercase text-mint-foreground chunky-border">
            <TrendingUp className="h-3 w-3" strokeWidth={3} /> Class Progress
          </div>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">This session vs last</h2>
        </div>
        <Button variant="coral" onClick={onDone}>Back to lobby</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-2 border-foreground/10 p-5 badge-shadow">
          <div className="mb-4 flex items-baseline justify-between">
            <div className="font-display text-xl font-bold">By section</div>
            <div className="text-xs text-muted-foreground">Accuracy %</div>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={data}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="section" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "2px solid var(--color-foreground)" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Last session" fill="var(--color-muted-foreground)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="This session" fill="var(--color-coral)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="space-y-4">
          {spotlights.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="flex items-center gap-4 border-2 border-foreground/10 p-5 badge-shadow">
                <Badge3D color={s.color} className="h-16 w-16">
                  <Icon className="h-7 w-7" strokeWidth={2.5} />
                </Badge3D>
                <div className="flex-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{s.label}</div>
                  <div className="font-display text-2xl font-bold">{s.name}</div>
                  <div className="text-sm text-foreground/70">{s.value}</div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}