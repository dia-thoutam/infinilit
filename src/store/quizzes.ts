import { create } from "zustand";
import { api } from "@/lib/api";
import type { Quiz } from "@/data/seed";

interface State {
  quizzes: Quiz[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  upsert: (q: Quiz) => Promise<void>;
  remove: (id: string) => Promise<void>;
  recordAttempt: (id: string, accuracy: number, xp: number) => Promise<void>;
  clearAllAttempts: () => void;
  wipeAll: () => void;
}

export const useQuizzes = create<State>((set, get) => ({
  quizzes: [],
  loading: false,
  error: null,

  async load() {
    set({ loading: true, error: null });
    try {
      const res = await api.get<{ quizzes: Quiz[] }>("/quizzes");
      set({ quizzes: res.quizzes, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  async upsert(q) {
    try {
      if (q.id) {
        const res = await api.put<{ quiz: Quiz }>(`/quizzes/${q.id}`, q);
        set({ quizzes: get().quizzes.map((x) => (x.id === q.id ? res.quiz : x)) });
      } else {
        const res = await api.post<{ quiz: Quiz }>("/quizzes", q);
        set({ quizzes: [res.quiz, ...get().quizzes] });
      }
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  async remove(id) {
    try {
      await api.del(`/quizzes/${id}`);
      set({ quizzes: get().quizzes.filter((x) => x.id !== id) });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  async recordAttempt(id, accuracy, xp) {
    set({
      quizzes: get().quizzes.map((q) =>
        q.id === id
          ? { ...q, lastAttempt: { date: new Date().toISOString().slice(0, 10), accuracy, xp } }
          : q,
      ),
    });
  },

  clearAllAttempts() {
    set({ quizzes: get().quizzes.map((q) => ({ ...q, lastAttempt: undefined })) });
  },

  wipeAll() {
    set({ quizzes: [] });
  },
}));