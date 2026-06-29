import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Student {
  id: string;
  name: string;
}

export interface Classroom {
  id: string;
  name: string;
  students: Student[];
}

const seed: Classroom[] = [
  {
    id: "c-9a",
    name: "Grade 9 — Section A",
    students: [
      { id: "s1", name: "Maya" },
      { id: "s2", name: "Zara" },
      { id: "s3", name: "Ananya" },
      { id: "s4", name: "Priya" },
      { id: "s5", name: "Kabir" },
      { id: "s6", name: "Rohan" },
      { id: "s7", name: "Ishaan" },
      { id: "s8", name: "Aarav" },
    ],
  },
];

interface State {
  classrooms: Classroom[];
  upsert: (c: Classroom) => void;
  remove: (id: string) => void;
  addStudent: (classroomId: string, name: string) => void;
  removeStudent: (classroomId: string, studentId: string) => void;
  renameStudent: (classroomId: string, studentId: string, name: string) => void;
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
    }),
    { name: "infinilit-classrooms-v1" },
  ),
);