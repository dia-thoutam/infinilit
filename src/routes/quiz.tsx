import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Award,
  Check,
  ChevronRight,
  Crown,
  Flame,
  Home,
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
  Legend,
  ResponsiveContainer,
} from "recharts";
import { AppShell } from "@/components/app-shell";
import { HexBadge } from "@/components/hex-badge";
import { ChartGrid, ChartTooltip, ChartXAxis, ChartYAxis, chartTokens } from "@/components/chart-style";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useClassrooms, type Classroom, type StudentSessionStat } from "@/store/classrooms";
import { useDevFlags } from "@/store/dev-flags";
import { useAuditLog } from "@/store/audit-log";
import { CompletedScreen } from "@/components/completed-screen";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { xpFor } from "@/data/seed";
import { useQuizzes } from "@/store/quizzes";
import { playCorrect, playWrong, playXp, playFanfare } from "@/lib/sfx";

/* ---------- Shared ranking + integrity ---------- */
/**
 * Deterministic tie-break: accuracy desc, XP desc, total answered desc, name asc.
 * Only real classroom students are ranked — no synthetic entries.
 */
type Ranked = {
  studentId: string;
  name: string;
  acc: number;
  xp: number;
  total: number;
};
function rankRoster(
  classroom: Classroom | null,
  tally: Record<string, StudentSessionStat>,
): Ranked[] {
  if (!classroom) return [];
  return classroom.students
    .map((s) => {
      const t = tally[s.id];
      const total = t?.total ?? 0;
      const acc = t && total ? Math.round((t.correct / total) * 100) : 0;
      const xp = t ? t.correct * 50 : 0;
      return { studentId: s.id, name: s.name, acc, xp, total };
    })
    .sort(
      (a, b) =>
        b.acc - a.acc ||
        b.xp - a.xp ||
        b.total - a.total ||
        a.name.localeCompare(b.name),
    );
}

/**
 * Label describing which tie-break rule set this row's rank relative to the
 * row above it (or the row below, for #1). Used purely for teacher display.
 */
function tieBreakReason(prev: Ranked | undefined, cur: Ranked): string {
  if (!prev) return "Highest accuracy";
  if (prev.acc !== cur.acc) return "Lower accuracy";
  if (prev.xp !== cur.xp) return "Tied accuracy · lower XP";
  if (prev.total !== cur.total) return "Tied XP · fewer answered";
  return "Tied · alphabetical";
}

// Known mock/seed placeholders that must never leak into real leaderboards.
const MOCK_NAME_BLOCKLIST = new Set([
  "Maya",
  "Zara",
  "Ananya",
  "You",
  "Player 1",
  "Player 2",
]);
function detectMockLeak(
  classroom: Classroom | null,
  displayedNames: string[],
): string | null {
  if (!classroom) return "Missing classroom roster — cannot display real ranking.";
  const roster = new Set(classroom.students.map((s) => s.name));
  for (const n of displayedNames) {
    if (n === "—") continue;
    if (MOCK_NAME_BLOCKLIST.has(n) && !roster.has(n)) {
      return `Blocked mock name in results: "${n}".`;
    }
    if (!roster.has(n)) {
      return `Name "${n}" is not in the classroom roster.`;
    }
  }
  return null;
}

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
type PhaseExt = Phase | "podium";
type Confidence = "sure" | "unsure" | "guessing";

function QuizPage() {
  const quizzes = useQuizzes((s) => s.quizzes);
  const recordAttempt = useQuizzes((s) => s.recordAttempt);
  const classrooms = useClassrooms((s) => s.classrooms);
  const addSession = useClassrooms((s) => s.addSession);
  const recordAudit = useAuditLog((s) => s.record);

  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [classroomId, setClassroomId] = useState<string | null>(null);
  const [trackConfidence, setTrackConfidence] = useState(false);
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
  const [xpPop, setXpPop] = useState<{ id: number; amount: number } | null>(null);
  const emptyPicks = (): Record<0 | 1 | 2 | 3, string[]> => ({ 0: [], 1: [], 2: [], 3: [] });
  const [studentPicks, setStudentPicks] = useState<Record<0 | 1 | 2 | 3, string[]>>(emptyPicks);
  const [studentConfidence, setStudentConfidence] = useState<Record<string, Confidence>>({});
  const [tally, setTally] = useState<Record<string, StudentSessionStat>>({});

  const quiz = useMemo(() => quizzes.find((q) => q.id === activeQuizId) ?? null, [quizzes, activeQuizId]);
  const question = quiz?.questions[qIndex];
  const classroom = useMemo(() => classrooms.find((c) => c.id === classroomId) ?? null, [classrooms, classroomId]);
  const teacherMode = !!classroom;

  // Fire feedback sound + XP pop when reveal phase starts
  useEffect(() => {
    if (phase !== "reveal" || !question) return;
    const correct = picked === question.correct;
    if (correct) {
      playCorrect();
      const amount = xpFor(question.difficulty);
      setXpPop({ id: Date.now(), amount });
      window.setTimeout(() => playXp(), 220);
      const t = window.setTimeout(() => setXpPop(null), 1600);
      return () => window.clearTimeout(t);
    } else if (picked !== null && picked !== -1) {
      playWrong();
    }
  }, [phase, picked, question]);

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
      if (question && picked !== null && picked >= 0) {
        const v: [number, number, number, number] = [0, 0, 0, 0];
        v[picked as 0 | 1 | 2 | 3] = 1;
        setVotes(v);
      } else {
        setVotes([0, 0, 0, 0]);
      }
    }, 5000);
    return () => clearTimeout(id);
  }, [phase, confidence, question]);

  const start = (id: string, cid: string | null, track: boolean) => {
    setActiveQuizId(id);
    setClassroomId(cid);
    setTrackConfidence(track);
    setPhase("question");
    setQIndex(0);
    setPicked(null);
    setConfidence(null);
    setXp(0);
    setCorrectCount(0);
    setStudentPicks(emptyPicks());
    setStudentConfidence({});
    setTally({});
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
    // update per-student tally for this question
    setTally((prev) => {
      const next = { ...prev };
      ([0, 1, 2, 3] as const).forEach((k) => {
        studentPicks[k].forEach((sid) => {
          const cur =
            next[sid] ??
            ({ studentId: sid, correct: 0, total: 0, sure: 0, unsure: 0, guessing: 0, sureCorrect: 0 } as StudentSessionStat);
          const isCorrect = k === question.correct;
          const conf = studentConfidence[sid];
          next[sid] = {
            ...cur,
            total: cur.total + 1,
            correct: cur.correct + (isCorrect ? 1 : 0),
            sure: cur.sure + (conf === "sure" ? 1 : 0),
            unsure: cur.unsure + (conf === "unsure" ? 1 : 0),
            guessing: cur.guessing + (conf === "guessing" ? 1 : 0),
            sureCorrect: cur.sureCorrect + (conf === "sure" && isCorrect ? 1 : 0),
          };
        });
      });
      return next;
    });
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
      setStudentPicks(emptyPicks());
      setStudentConfidence({});
      setPhase("question");
    } else {
      const accuracy = Math.round(((correctCount + (picked === question.correct ? 1 : 0)) / quiz.questions.length) * 100);
      const totalXp = xp + (picked === question.correct ? xpFor(question.difficulty) : 0);
      // HARD GUARDRAIL — solo runs never touch persisted progress data.
      // Only a classroom-bound run may call recordAttempt/addSession.
      if (classroom && classroomId) {
        recordAttempt(quiz.id, accuracy, totalXp);
        addSession(classroom.id, {
          id: `sess-${Date.now()}`,
          date: new Date().toISOString().slice(0, 10),
          quizId: quiz.id,
          quizTitle: quiz.title,
          accuracy,
          xp: totalXp,
          trackedConfidence: trackConfidence,
          perStudent: Object.values(tally),
        });
        // Audit: which roster IDs powered this session's leaderboard/charts.
        recordAudit({
          classroomId: classroom.id,
          classroomName: classroom.name,
          quizId: quiz.id,
          quizTitle: quiz.title,
          rosterIds: classroom.students.map((s) => s.id),
          tallyIds: Object.keys(tally),
          source: "classroom-session",
        });
      } else if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.info(
          "[quiz] solo run complete — no progress data written (accuracy=%d, xp=%d)",
          accuracy,
          totalXp,
        );
      }
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
    // Defensive: solo runs must never reach the leaderboard.
    if (!classroom) {
      setPhase("lobby");
      return null;
    }
    return (
      <LeaderboardScreen
        classroom={classroom}
        tally={tally}
        onNext={() => setPhase("progress")}
      />
    );
  }

  if (phase === "completed") {
    return (
      <CompletedScreen
        xp={finalXp}
        accuracy={finalAccuracy}
        quizTitle={quiz.title}
        isSolo={!classroom}
        // HARD RULE: solo must always return to the lobby — never route to
        // podium, leaderboard, or progress screens. Refreshing the /quiz
        // route also lands on the lobby because phase state is not persisted.
        onContinue={() => setPhase(classroom ? ("podium" as Phase) : "lobby")}
      />
    );
  }

  if ((phase as PhaseExt) === "podium") {
    // Defensive: if somehow a solo run reached podium, bounce to lobby.
    if (!classroom) {
      setPhase("lobby");
      return null;
    }
    return (
      <PodiumScreen
        classroom={classroom}
        tally={tally}
        myXp={finalXp}
        onContinue={() => setPhase("leaderboard")}
      />
    );
  }

  if (phase === "progress") {
    if (!classroom) {
      setPhase("lobby");
      return null;
    }
    return (
      <AppShell>
        <ProgressSplit classroom={classroom} onDone={() => setPhase("lobby")} />
      </AppShell>
    );
  }


  const majorityWrong = phase === "reveal" && votes[question.correct] < Math.max(...votes);

  return (
    <AppShell bare>
      {xpPop && (
        <div className="lov-xp-pop">
          <div className="rounded-full btn-gradient-sunshine chunky-border badge-shadow-pop px-6 py-3 font-display text-3xl font-black text-foreground">
            +{xpPop.amount} XP
          </div>
        </div>
      )}
      {phase === "confidence" ? (
        <ConfidenceScreen onPick={(c) => {
          setConfidence(c);
          setPhase("reveal");
          if (picked !== null && picked >= 0) {
            const v: [number, number, number, number] = [0, 0, 0, 0];
            v[picked as 0 | 1 | 2 | 3] = 1;
            setVotes(v);
          } else {
            setVotes([0, 0, 0, 0]);
          }
        }} />
      ) : (
        <div
          className={cn(
            "min-h-[calc(100vh-65px)] transition-colors",
            majorityWrong ? "bg-amber-alert/30" : "bg-background",
          )}
        >
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
            {/* Top bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wider text-foreground/90 font-medium">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (confirm("Exit quiz and return to home?")) setPhase("lobby");
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1 text-background hover:opacity-90"
                  aria-label="Exit to home"
                >
                  <Home className="h-3 w-3" strokeWidth={3} /> Home
                </button>
                <span className="rounded-full bg-foreground/10 px-3 py-1">Session 7</span>
                <span className="rounded-full bg-sky/20 px-3 py-1 text-sky">{question.section}</span>
                <span className="rounded-full bg-foreground/10 px-3 py-1">
                  Q{qIndex + 1}/{quiz.questions.length}
                </span>
                {classroom && (
                  <span className="rounded-full bg-mint/20 px-3 py-1 text-foreground">{classroom.name}</span>
                )}
                {trackConfidence && classroom && (
                  <span className="rounded-full stat-gradient-violet px-3 py-1 text-white">Confidence ON</span>
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
                      trackConfidence={trackConfidence}
                      studentConfidence={studentConfidence}
                      onSetConfidence={(sid, c) =>
                        setStudentConfidence((prev) => ({ ...prev, [sid]: c }))
                      }
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
                      isCorrect && "lov-correct",
                      isWrongPick && "lov-wrong",
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
                <div className="text-sm text-foreground/90 font-medium">
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
function Lobby({
  quizzes,
  classrooms,
  onStart,
}: {
  quizzes: ReturnType<typeof useQuizzes.getState>["quizzes"];
  classrooms: Classroom[];
  onStart: (id: string, classroomId: string | null, trackConfidence: boolean) => void;
}) {
  const [selectedClassroom, setSelectedClassroom] = useState<string>("solo");
  const [trackConfidence, setTrackConfidence] = useState(false);
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="section-pill inline-flex items-center gap-2 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-foreground" style={{ background: "linear-gradient(180deg, #ffe07a 0%, #ffc93a 55%, #f5a90b 100%)" }}>
            <Star className="h-3.5 w-3.5 drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]" strokeWidth={3.5} /> Quiz Arena
          </div>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl">
            Pick a quiz.<br />Earn your XP.
          </h1>
          <p className="mt-2 max-w-xl text-foreground/90 font-medium">
            Easy = 20 XP · Medium = 50 XP · Hard = 100 XP. Race the timer, lock in your confidence, and outscore the class.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-foreground/90 font-medium">Classroom</label>
            <Select value={selectedClassroom} onValueChange={setSelectedClassroom}>
              <SelectTrigger className="h-11 w-[240px] rounded-xl border-2 text-base"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="solo">Solo (no roster)</SelectItem>
                {classrooms.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name} · {c.students.length}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Link to="/teacher/classrooms" className="inline-flex">
            <Button variant="badge" size="lg">
              <Sparkles className="h-4 w-4" /> Manage classrooms
            </Button>
          </Link>
        </div>
      </div>

      {selectedClassroom !== "solo" && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-2 border-foreground/10 p-4 stat-gradient-violet text-white badge-shadow">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider opacity-90">Confidence tracking</div>
            <div className="text-sm">Add sure / unsure / guessing buttons next to each student in the picker.</div>
          </div>
          <label className="inline-flex items-center gap-2 text-sm font-semibold">
            <Switch checked={trackConfidence} onCheckedChange={setTrackConfidence} /> {trackConfidence ? "ON" : "OFF"}
          </label>
        </Card>
      )}

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
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-display text-xl font-bold leading-snug">{q.title}</div>
                  <p className="mt-1 text-sm text-foreground/90 font-medium">{q.description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-foreground/90 font-medium">
                  <span className="rounded-full bg-muted px-2 py-1 font-semibold">{q.questions.length} questions</span>
                  <span className="rounded-full bg-muted px-2 py-1 font-semibold">
                    {q.questions.reduce((sum, x) => sum + xpFor(x.difficulty), 0)} XP total
                  </span>
                </div>
                <Button variant="coral" className="w-full" size="lg" onClick={() => onStart(q.id, selectedClassroom === "solo" ? null : selectedClassroom, trackConfidence)}>
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

/* ---------- Choice w/ student picker (teacher mode) ---------- */
function ChoiceWithStudents({
  letter,
  text,
  classroom,
  picked,
  allPicks,
  onToggle,
  trackConfidence,
  studentConfidence,
  onSetConfidence,
}: {
  letter: string;
  text: string;
  classroom: Classroom;
  picked: string[];
  allPicks: Record<0 | 1 | 2 | 3, string[]>;
  onToggle: (studentId: string) => void;
  trackConfidence: boolean;
  studentConfidence: Record<string, Confidence>;
  onSetConfidence: (studentId: string, c: Confidence) => void;
}) {
  const assignedElsewhere = (sid: string) =>
    ([0, 1, 2, 3] as const).some((k) => allPicks[k].includes(sid)) && !picked.includes(sid);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "group flex items-center gap-4 rounded-2xl border-2 border-foreground/10 bg-card p-4 text-left transition-all badge-shadow hover:-translate-y-1 hover:border-coral",
            picked.length > 0 && "border-mint bg-mint/10",
          )}
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl chunky-border bg-sunshine font-display text-xl font-bold text-foreground">
            {letter}
          </div>
          <div className="flex-1 font-medium">{text}</div>
          <div className="grid h-9 min-w-9 place-items-center rounded-full bg-foreground px-2 text-sm font-bold text-background">
            {picked.length}
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="end">
        <div className="mb-1 px-2 py-1 text-xs font-bold uppercase tracking-wider text-foreground/90 font-medium">
          Who picked {letter}?
        </div>
        <div className="max-h-72 overflow-y-auto">
          {classroom.students.length === 0 ? (
            <div className="px-2 py-3 text-sm text-foreground/90 font-medium">No students in this classroom.</div>
          ) : (
            classroom.students.map((s) => {
              const checked = picked.includes(s.id);
              const elsewhere = assignedElsewhere(s.id);
              return (
                <div
                  key={s.id}
                  className={cn(
                    "flex w-full flex-col gap-1 rounded-lg px-2 py-2 text-sm",
                    checked && "bg-mint/15",
                  )}
                >
                  <button
                    onClick={() => onToggle(s.id)}
                    className="flex w-full items-center gap-2 text-left hover:bg-muted/50 rounded"
                  >
                    <span
                      className={cn(
                        "grid h-5 w-5 shrink-0 place-items-center rounded border-2",
                        checked ? "border-mint bg-mint text-mint-foreground" : "border-foreground/30",
                      )}
                    >
                      {checked && <Check className="h-3 w-3" strokeWidth={4} />}
                    </span>
                    <span className="flex-1 font-medium">{s.name}</span>
                    {elsewhere && (
                      <span className="text-[10px] uppercase tracking-wider text-foreground/90 font-medium">moves</span>
                    )}
                  </button>
                  {trackConfidence && checked && (
                    <div className="ml-7 flex gap-1">
                      {(["sure", "unsure", "guessing"] as const).map((c) => {
                        const active = studentConfidence[s.id] === c;
                        const icon = c === "sure" ? Check : c === "unsure" ? Sparkles : Zap;
                        const Icon = icon;
                        return (
                          <button
                            key={c}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSetConfidence(s.id, c);
                            }}
                            className={cn(
                              "inline-flex flex-1 items-center justify-center gap-1 rounded-md border px-1.5 py-1 text-[10px] font-bold uppercase",
                              active
                                ? c === "sure"
                                  ? "bg-mint text-mint-foreground border-mint"
                                  : c === "unsure"
                                  ? "bg-sunshine text-foreground border-sunshine"
                                  : "bg-coral text-coral-foreground border-coral"
                                : "border-foreground/20 text-foreground/90 font-medium hover:bg-muted",
                            )}
                          >
                            <Icon className="h-3 w-3" strokeWidth={3} /> {c}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
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
        <div className="text-xs font-bold uppercase tracking-wider text-foreground/90 font-medium">Class voted</div>
        <div className="text-xs text-foreground/90 font-medium">{votes.reduce((a, b) => a + b, 0)} responses</div>
      </div>
      <div className="h-32">
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
            <ChartXAxis type="number" hide />
            <ChartYAxis type="category" dataKey="name" width={28} />
            <Bar dataKey="votes" radius={[10, 10, 10, 10]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

/* ---------- Leaderboard ---------- */
function LeaderboardScreen({
  classroom,
  tally,
  onNext,
}: {
  classroom: Classroom | null;
  tally: Record<string, StudentSessionStat>;
  onNext: () => void;
}) {
  const rankedRaw = rankRoster(classroom, tally);
  const ranked = rankedRaw.map((r) => ({ name: r.name, improvement: r.acc, xp: r.xp }));
  const integrityError = detectMockLeak(classroom, ranked.map((r) => r.name));
  const padded = [...ranked];
  while (padded.length < 3) padded.push({ name: "—", improvement: 0, xp: 0 });
  const top3 = padded.slice(0, 3);
  const topScorer = ranked[0]?.name ?? "—";
  const awards = [
    { label: "Top Scorer", winner: topScorer, color: "sunshine" as const, icon: Crown },
    { label: "Runner-up", winner: ranked[1]?.name ?? "—", color: "coral" as const, icon: TrendingUp },
    { label: "Third place", winner: ranked[2]?.name ?? "—", color: "mint" as const, icon: Target },
  ];

  return (
    <div className="min-h-screen bg-sunshine text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {integrityError && (
          <div className="mb-4 rounded-2xl border-2 border-coral bg-coral/15 px-4 py-3 text-sm font-semibold text-coral">
            Data integrity check failed: {integrityError} Only real classroom data is shown.
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/quiz" className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-bold uppercase text-background">
              <Home className="h-4 w-4" strokeWidth={3} /> Home
            </Link>
            <span className="inline-flex items-center gap-2 rounded-full stat-gradient-violet px-4 py-2 text-xs font-bold uppercase text-white">
              <Trophy className="h-4 w-4" strokeWidth={3} /> Session Leaderboard
            </span>
          </div>
          <Button variant="coral" onClick={onNext}>
            See class progress <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <h1 className="mt-6 text-center font-display text-5xl font-bold sm:text-7xl">Final standings</h1>
        <p className="mt-2 text-center text-sm font-semibold uppercase tracking-wider">
          Ranked by accuracy → XP → questions answered → name
        </p>

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
                <div className="mt-3 text-xs font-bold uppercase tracking-wider text-foreground/90 font-medium">{a.label}</div>
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
/* ---------- Podium (1st / 2nd / 3rd with hex badges) ---------- */
function PodiumScreen({
  classroom,
  tally,
  myXp,
  onContinue,
}: {
  classroom: Classroom | null;
  tally: Record<string, StudentSessionStat>;
  myXp: number;
  onContinue: () => void;
}) {
  useEffect(() => {
    const t = window.setTimeout(() => playFanfare(), 250);
    return () => window.clearTimeout(t);
  }, []);
  // Podium is a classroom-only screen. Rank only real roster + real tally.
  // No synthetic entries — the leaderboard is padded visually with "—".
  void myXp;
  const ranked = rankRoster(classroom, tally).map((r) => ({
    name: r.name,
    xp: r.xp,
    acc: r.acc,
  }));
  const integrityError = detectMockLeak(classroom, ranked.map((r) => r.name));
  const top3 = ranked.slice(0, 3);
  while (top3.length < 3) top3.push({ name: "—", xp: 0, acc: 0 });

  const tones = ["sunshine", "sky", "coral"] as const;
  const icons = [Crown, Medal, Award];
  const labels = ["1st place", "2nd place", "3rd place"];
  const sizes = [180, 150, 130];
  // Visual order: 2nd, 1st, 3rd
  const order = [1, 0, 2];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#7B5BFF] via-[#5C3FE0] to-[#3B249E] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-30">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="absolute h-2 w-2 rounded-full bg-white"
            style={{
              left: `${(i * 53) % 100}%`,
              top: `${(i * 37) % 90 + 5}%`,
              opacity: 0.3 + ((i % 5) / 10),
            }}
          />
        ))}
      </div>
      {/* Animated falling confetti */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 60 }).map((_, i) => {
          const colors = ["#FFD25A", "#FF7A5C", "#4DDC9A", "#65A8EE", "#B78BFF", "#FFFFFF"];
          const c = colors[i % colors.length];
          const left = (i * 17 + 7) % 100;
          const w = 6 + ((i * 3) % 8);
          const h = 10 + ((i * 5) % 10);
          const dur = 3.5 + ((i * 13) % 30) / 10;
          const delay = ((i * 7) % 40) / 10;
          const drift = ((i % 7) - 3) * 30;
          const spin = 360 + ((i * 47) % 720);
          return (
            <span
              key={`c-${i}`}
              className="lov-confetti-piece"
              style={{
                left: `${left}%`,
                width: w,
                height: h,
                background: c,
                animationDuration: `${dur}s`,
                animationDelay: `${delay}s`,
                ["--lov-drift" as never]: `${drift}px`,
                ["--lov-spin" as never]: `${spin}deg`,
              }}
            />
          );
        })}
      </div>
      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-8">
        {integrityError && (
          <div className="mb-4 rounded-2xl border-2 border-white/60 bg-white/15 px-4 py-3 text-sm font-semibold text-white backdrop-blur">
            Data integrity check failed: {integrityError}
          </div>
        )}
        <div className="flex items-center justify-between">
          <Link to="/quiz" className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-bold uppercase backdrop-blur">
            <Home className="h-4 w-4" strokeWidth={3} /> Home
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-bold uppercase backdrop-blur">
            <Trophy className="h-4 w-4" strokeWidth={3} /> Podium
          </span>
        </div>

        <div className="mt-6 text-center">
          <h1 className="font-display text-5xl font-black sm:text-7xl drop-shadow">Top of the class</h1>
          <p className="mt-2 text-sm font-semibold uppercase tracking-[0.25em] text-white/80">
            Quiz complete · winners
          </p>
        </div>

        <div className="mt-12 flex flex-1 items-end justify-center gap-4 sm:gap-8">
          {order.map((rank) => {
            const s = top3[rank];
            const Icon = icons[rank];
            const heights = ["h-44", "h-64", "h-36"];
            const visualSlot = rank === 0 ? 1 : rank === 1 ? 0 : 2;
            const popDelay = visualSlot * 200;
            return (
              <div
                key={rank}
                className="lov-pop-in flex flex-1 max-w-[220px] flex-col items-center"
                style={{ animationDelay: `${popDelay}ms` }}
              >
                <div className="mb-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur">
                  {labels[rank]}
                </div>
                <HexBadge tone={tones[rank]} size={sizes[rank]} className="lov-badge-float bg-white/95">
                  <Icon className="h-full w-full" strokeWidth={2.5} />
                </HexBadge>
                <div className="mt-4 text-center font-display text-2xl font-bold drop-shadow">
                  {s.name}
                </div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-white/75">
                  {s.acc}% · {s.xp} XP
                </div>
                <div
                  className={cn(
                    "mt-4 w-full rounded-t-2xl border-x-2 border-t-2 border-white/20 bg-white/10 backdrop-blur grid place-items-center font-display text-5xl font-black",
                    heights[visualSlot],
                  )}
                >
                  {rank + 1}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            onClick={onContinue}
            className="h-14 rounded-2xl bg-white px-10 text-base font-bold text-[#5C3FE0] shadow-[0_8px_0_rgba(0,0,0,0.18)] hover:bg-white/95"
          >
            See full leaderboard <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProgressSplit({ classroom, onDone }: { classroom: Classroom | null; onDone: () => void }) {
  const sessions = classroom?.sessions ?? [];
  // Compare the two most recent recorded sessions of this classroom, if any.
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  const last = sorted[sorted.length - 2];
  const current = sorted[sorted.length - 1];
  const data = current
    ? [
        {
          section: current.quizTitle,
          "Last session": last?.accuracy ?? 0,
          "This session": current.accuracy,
        },
      ]
    : [];

  // Spotlights from real per-student tally on the most recent session.
  const perStudent = current?.perStudent ?? [];
  const nameFor = (sid: string) => classroom?.students.find((s) => s.id === sid)?.name ?? "—";
  const byAcc = [...perStudent].sort((a, b) => {
    const aAcc = a.total ? a.correct / a.total : 0;
    const bAcc = b.total ? b.correct / b.total : 0;
    return bAcc - aAcc;
  });
  const bySureCorrect = [...perStudent].sort((a, b) => b.sureCorrect - a.sureCorrect);
  const spotlights = current
    ? [
        {
          label: "Top Scorer",
          name: byAcc[0] ? nameFor(byAcc[0].studentId) : "—",
          value: byAcc[0] && byAcc[0].total ? `${Math.round((byAcc[0].correct / byAcc[0].total) * 100)}%` : "—",
          color: "coral" as const,
          icon: TrendingUp,
        },
        {
          label: "Class average",
          name: `${current.accuracy}%`,
          value: `${current.perStudent.length} students`,
          color: "mint" as const,
          icon: Target,
        },
        {
          label: "Most confident right",
          name: bySureCorrect[0] ? nameFor(bySureCorrect[0].studentId) : "—",
          value: bySureCorrect[0] ? `${bySureCorrect[0].sureCorrect} sure-correct` : "—",
          color: "sky" as const,
          icon: Zap,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-mint px-3 py-1 text-xs font-bold uppercase text-mint-foreground chunky-border">
            <TrendingUp className="h-3 w-3" strokeWidth={3} /> Class Progress
          </div>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">This session vs last</h2>
        </div>
        <div className="flex gap-2">
          <Link to="/quiz"><Button variant="badge"><Home className="h-4 w-4" /> Home</Button></Link>
          <Button variant="coral" onClick={onDone}>Back to lobby</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-2 border-foreground/10 p-5 badge-shadow">
          <div className="mb-4 flex items-baseline justify-between">
            <div className="font-display text-xl font-bold">By section</div>
            <div className="text-xs text-foreground/90 font-medium">Accuracy %</div>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={data}>
                <ChartGrid />
                <ChartXAxis dataKey="section" />
                <ChartYAxis />
                <ChartTooltip />
                <Legend wrapperStyle={chartTokens.legend} />
                <Bar dataKey="Last session" fill={chartTokens.palette.secondary} radius={chartTokens.barRadius} />
                <Bar dataKey="This session" fill={chartTokens.palette.primary} radius={chartTokens.barRadius} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="space-y-4">
          {spotlights.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="flex items-center gap-4 border-2 border-foreground/10 p-5 badge-shadow">
                <HexBadge tone={s.color} size={68}>
                  <Icon strokeWidth={3} />
                </HexBadge>
                <div className="flex-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-foreground/90 font-medium">{s.label}</div>
                  <div className="font-display text-2xl font-bold">{s.name}</div>
                  <div className="text-sm text-foreground/90">{s.value}</div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}