import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Student {
  id: string;
  name: string;
}

export interface StudentSessionStat {
  studentId: string;
  correct: number;
  total: number;
  sure: number;
  unsure: number;
  guessing: number;
  sureCorrect: number;
}

export interface ClassroomSession {
  id: string;
  date: string; // ISO yyyy-mm-dd
  quizId: string;
  quizTitle: string;
  accuracy: number; // 0-100, class avg
  xp: number;
  trackedConfidence: boolean;
  perStudent: StudentSessionStat[];
}

export interface Classroom {
  id: string;
  name: string;
  students: Student[];
  sessions?: ClassroomSession[];
}

const seed: Classroom[] = [];

interface State {
  classrooms: Classroom[];
  upsert: (c: Classroom) => void;
  remove: (id: string) => void;
  addStudent: (classroomId: string, name: string) => void;
  removeStudent: (classroomId: string, studentId: string) => void;
  renameStudent: (classroomId: string, studentId: string, name: string) => void;
  addSession: (classroomId: string, session: ClassroomSession) => void;
  resetStats: (classroomId: string) => void;
}

export const useClassrooms = create<State>()(
  persist(
    (set) => ({
      classrooms: seed,
      upsert: (c) =>
        set((s) => {
          const idx = s.classrooms.findIndex((x) => x.id === c.id);
          const next = [...s.classrooms];
          if (idx >= 0) next[idx] = c;
          else next.unshift(c);
          return { classrooms: next };
        }),
      remove: (id) =>
        set((s) => ({ classrooms: s.classrooms.filter((x) => x.id !== id) })),
      addStudent: (classroomId, name) =>
        set((s) => ({
          classrooms: s.classrooms.map((c) =>
            c.id === classroomId
              ? {
                  ...c,
                  students: [
                    ...c.students,
                    { id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name },
                  ],
                }
              : c,
          ),
        })),
      removeStudent: (classroomId, studentId) =>
        set((s) => ({
          classrooms: s.classrooms.map((c) =>
            c.id === classroomId
              ? { ...c, students: c.students.filter((st) => st.id !== studentId) }
              : c,
          ),
        })),
      renameStudent: (classroomId, studentId, name) =>
        set((s) => ({
          classrooms: s.classrooms.map((c) =>
            c.id === classroomId
              ? {
                  ...c,
                  students: c.students.map((st) => (st.id === studentId ? { ...st, name } : st)),
                }
              : c,
          ),
        })),
      addSession: (classroomId, session) =>
        set((s) => ({
          classrooms: s.classrooms.map((c) =>
            c.id === classroomId
              ? { ...c, sessions: [...(c.sessions ?? []), session] }
              : c,
          ),
        })),
      resetStats: (classroomId) =>
        set((s) => ({
          classrooms: s.classrooms.map((c) =>
            c.id === classroomId ? { ...c, sessions: [] } : c,
          ),
        })),
    }),
    { name: "infinilit-classrooms-v3" },
  ),
);