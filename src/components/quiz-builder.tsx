import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Trash2, Save, ArrowLeft, Check } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Difficulty, Question, Quiz } from "@/data/seed";
import { useQuizzes } from "@/store/quizzes";

function emptyQuestion(): Question {
  return {
    id: crypto.randomUUID(),
    text: "",
    choices: ["", "", "", ""],
    correct: 0,
    explanation: "",
    difficulty: "easy",
    section: "Budgeting",
  };
}

export function QuizBuilder({ existing }: { existing?: Quiz }) {
  const navigate = useNavigate();
  const upsert = useQuizzes((s) => s.upsert);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [questions, setQuestions] = useState<Question[]>(existing?.questions ?? [emptyQuestion()]);

  const updateQ = (i: number, patch: Partial<Question>) =>
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));

  const save = () => {
    if (!title.trim()) {
      alert("Give your quiz a title.");
      return;
    }
    const quiz: Quiz = {
      id: existing?.id ?? `q-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || "No description yet.",
      questions,
      createdAt: existing?.createdAt ?? new Date().toISOString().slice(0, 10),
      lastAttempt: existing?.lastAttempt,
    };
    upsert(quiz);
    navigate({ to: "/teacher" });
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="badge" onClick={() => navigate({ to: "/teacher" })}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Button variant="coral" size="lg" onClick={save}>
            <Save className="h-4 w-4" /> Save & reuse
          </Button>
        </div>

        <Card className="space-y-4 border-2 border-foreground/10 p-6 badge-shadow">
          <h1 className="font-display text-3xl font-bold">
            {existing ? "Edit quiz" : "Create a new quiz"}
          </h1>
          <div className="grid gap-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-foreground/90 font-medium">Quiz title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Compound Interest Crash Course"
                className="h-12 rounded-xl border-2 text-base"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-foreground/90 font-medium">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short summary students will see."
                className="min-h-[80px] rounded-xl border-2"
              />
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          {questions.map((q, i) => (
            <Card key={q.id} className="space-y-4 border-2 border-foreground/10 p-6 badge-shadow">
              <div className="flex items-center justify-between">
                <div className="font-display text-xl font-bold">Question {i + 1}</div>
                {questions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuestions((qs) => qs.filter((_, idx) => idx !== i))}
                    className="text-coral hover:bg-coral/10"
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                  </Button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-foreground/90 font-medium">Section</label>
                  <Input
                    value={q.section}
                    onChange={(e) => updateQ(i, { section: e.target.value })}
                    className="h-10 rounded-xl border-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-foreground/90 font-medium">Difficulty</label>
                  <Select value={q.difficulty} onValueChange={(v) => updateQ(i, { difficulty: v as Difficulty })}>
                    <SelectTrigger className="h-10 rounded-xl border-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy · 20 XP</SelectItem>
                      <SelectItem value="medium">Medium · 50 XP</SelectItem>
                      <SelectItem value="hard">Hard · 100 XP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-foreground/90 font-medium">Correct</label>
                  <Select value={String(q.correct)} onValueChange={(v) => updateQ(i, { correct: Number(v) as 0 | 1 | 2 | 3 })}>
                    <SelectTrigger className="h-10 rounded-xl border-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">A</SelectItem>
                      <SelectItem value="1">B</SelectItem>
                      <SelectItem value="2">C</SelectItem>
                      <SelectItem value="3">D</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-foreground/90 font-medium">Question</label>
                <Textarea
                  value={q.text}
                  onChange={(e) => updateQ(i, { text: e.target.value })}
                  className="min-h-[60px] rounded-xl border-2"
                  placeholder="What do you want to ask?"
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {q.choices.map((c, idx) => {
                  const correct = q.correct === idx;
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border-2 p-2",
                        correct ? "border-mint bg-mint/10" : "border-foreground/10",
                      )}
                    >
                      <div
                        className={cn(
                          "grid h-9 w-9 shrink-0 place-items-center rounded-lg chunky-border font-display font-bold",
                          correct ? "bg-mint text-mint-foreground" : "bg-sunshine",
                        )}
                      >
                        {correct ? <Check className="h-4 w-4" strokeWidth={3} /> : "ABCD"[idx]}
                      </div>
                      <Input
                        value={c}
                        onChange={(e) => {
                          const choices = [...q.choices] as [string, string, string, string];
                          choices[idx] = e.target.value;
                          updateQ(i, { choices });
                        }}
                        placeholder={`Choice ${"ABCD"[idx]}`}
                        className="h-10 border-0 bg-transparent shadow-none focus-visible:ring-0"
                      />
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-foreground/90 font-medium">Explanation</label>
                <Textarea
                  value={q.explanation}
                  onChange={(e) => updateQ(i, { explanation: e.target.value })}
                  className="min-h-[60px] rounded-xl border-2"
                  placeholder="Shown after the reveal."
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-foreground/90 font-medium">Common misconception (optional)</label>
                <Textarea
                  value={q.misconception ?? ""}
                  onChange={(e) => updateQ(i, { misconception: e.target.value })}
                  className="min-h-[50px] rounded-xl border-2"
                  placeholder="Shown when the majority gets it wrong — sparks discussion."
                />
              </div>
            </Card>
          ))}

          <Button variant="badge" size="xl" className="w-full" onClick={() => setQuestions((qs) => [...qs, emptyQuestion()])}>
            <Plus className="h-5 w-5" /> Add another question
          </Button>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="coral" size="xl" onClick={save}>
            <Save className="h-5 w-5" /> Save & reuse
          </Button>
        </div>
      </div>
    </AppShell>
  );
}