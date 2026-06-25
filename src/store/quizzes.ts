import { create } from "zustand";
import { persist } from "zustand/middleware";
import { seedQuizzes, type Quiz } from "@/data/seed";

interface State {
  quizzes: Quiz[];
  upsert: (q: Quiz) => void;
  remove: (id: string) => void;
  recordAttempt: (id: string, accuracy: number, xp: number) => void;
}

export const useQuizzes = create<State>()(
  persist(
    (set) => ({
      quizzes: seedQuizzes,
      upsert: (q) =>
        set((s) => {
          const idx = s.quizzes.findIndex((x) => x.id === q.id);
          const next = [...s.quizzes];
          if (idx >= 0) next[idx] = q;
          else next.unshift(q);
          return { quizzes: next };
        }),
      remove: (id) => set((s) => ({ quizzes: s.quizzes.filter((x) => x.id !== id) })),
      recordAttempt: (id, accuracy, xp) =>
        set((s) => ({
          quizzes: s.quizzes.map((q) =>
            q.id === id
              ? { ...q, lastAttempt: { date: new Date().toISOString().slice(0, 10), accuracy, xp } }
              : q,
          ),
        })),
    }),
    { name: "infinilit-quizzes-v1" },
  ),
);