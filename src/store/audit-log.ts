import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Session audit log. Records which classroom roster IDs were used to compute
 * the leaderboard and charts for each recorded quiz session, so a teacher can
 * later verify no synthetic data leaked in.
 *
 * NOTE: This is a client-side persisted log (localStorage). A true
 * server-side audit trail requires enabling Lovable Cloud and writing entries
 * from a `createServerFn` handler into a `session_audit` table with RLS.
 * The record shape here matches what that table's row would look like, so
 * migrating is a copy-paste.
 */
export interface AuditEntry {
  id: string;
  ts: string; // ISO timestamp
  classroomId: string;
  classroomName: string;
  quizId: string;
  quizTitle: string;
  rosterIds: string[]; // student IDs the leaderboard/charts were computed from
  tallyIds: string[]; // student IDs that actually recorded picks
  source: "classroom-session";
}

interface State {
  entries: AuditEntry[];
  record: (e: Omit<AuditEntry, "id" | "ts">) => void;
  clear: () => void;
}

export const useAuditLog = create<State>()(
  persist(
    (set) => ({
      entries: [],
      record: (e) =>
        set((s) => ({
          entries: [
            {
              ...e,
              id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              ts: new Date().toISOString(),
            },
            ...s.entries,
          ].slice(0, 200), // cap to 200 most recent
        })),
      clear: () => set({ entries: [] }),
    }),
    { name: "infinilit-audit-log-v1" },
  ),
);