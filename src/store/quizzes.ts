import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Quiz } from "@/data/seed";

interface State {
  quizzes: Quiz[];
  upsert: (q: Quiz) => void;
  remove: (id: string) => void;
  recordAttempt: (id: string, accuracy: number, xp: number) => void;
  clearAttemptsInRange: (from: string, to: string) => void;
  clearAllAttempts: () => void;
  wipeAll: () => void;
}

export const useQuizzes = create<State>()(
  persist(
    (set) => ({
      quizzes: [],
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
      clearAttemptsInRange: (from, to) =>
        set((s) => ({
          quizzes: s.quizzes.map((q) =>
            q.lastAttempt && q.lastAttempt.date >= from && q.lastAttempt.date <= to
              ? { ...q, lastAttempt: undefined }
              : q,
          ),
        })),
      clearAllAttempts: () =>
        set((s) => ({
          quizzes: s.quizzes.map((q) => ({ ...q, lastAttempt: undefined })),
        })),
      wipeAll: () => set({ quizzes: [] }),
    }),
    { name: "infinilit-quizzes-v2" },
  ),
);