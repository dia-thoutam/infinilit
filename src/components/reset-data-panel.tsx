import { useEffect, useState } from "react";
import { KeyRound, Trash2, ShieldAlert, CalendarRange, Lock, FlaskConical, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { HexBadge } from "@/components/hex-badge";
import { useClassrooms } from "@/store/classrooms";
import { useQuizzes } from "@/store/quizzes";
import { useDevFlags } from "@/store/dev-flags";
import { useAuditLog } from "@/store/audit-log";

const PIN_KEY = "infinilit-teacher-pin";
const DEFAULT_PIN = "2468";

function getPin(): string {
  if (typeof window === "undefined") return DEFAULT_PIN;
  return localStorage.getItem(PIN_KEY) ?? DEFAULT_PIN;
}

export function ResetDataPanel() {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [changingPin, setChangingPin] = useState(false);
  const [newPin, setNewPin] = useState("");

  const deleteSessionsInRange = useClassrooms((s) => s.deleteSessionsInRange);
  const resetAllStats = useClassrooms((s) => s.resetAllStats);
  const wipeClassrooms = useClassrooms((s) => s.wipeAll);
  const clearAllAttempts = useQuizzes((s) => s.clearAllAttempts);
  const wipeQuizzes = useQuizzes((s) => s.wipeAll);
  const leakDetection = useDevFlags((s) => s.leakDetection);
  const setLeakDetection = useDevFlags((s) => s.setLeakDetection);
  const auditEntries = useAuditLog((s) => s.entries);
  const clearAudit = useAuditLog((s) => s.clear);
  const [showAudit, setShowAudit] = useState(false);

  useEffect(() => {
    if (notice) {
      const t = setTimeout(() => setNotice(null), 3500);
      return () => clearTimeout(t);
    }
  }, [notice]);

  function submitPin(e: React.FormEvent) {
    e.preventDefault();
    if (pin === getPin()) {
      setUnlocked(true);
      setError(null);
      setPin("");
    } else {
      setError("Incorrect PIN.");
    }
  }

  function handleRangeDelete() {
    if (!from || !to) {
      setNotice("Pick both a start and end date.");
      return;
    }
    if (from > to) {
      setNotice("Start date must be before end date.");
      return;
    }
    if (!confirm(`Delete all classroom sessions and quiz attempts between ${from} and ${to}?`)) return;
    deleteSessionsInRange(from, to);
    clearAttemptsInRange(from, to);
    setNotice(`Deleted data from ${from} to ${to}.`);
  }

  function handleWipeAll() {
    if (!confirm("This will delete ALL classrooms, students, sessions, and quizzes. Continue?")) return;
    if (!confirm("Really wipe everything? This cannot be undone.")) return;
    wipeClassrooms();
    wipeQuizzes();
    setNotice("All data wiped.");
  }

  function handleClearStatsOnly() {
    if (!confirm("Clear all recorded stats/sessions but keep classrooms and quizzes?")) return;
    resetAllStats();
    clearAllAttempts();
    setNotice("Stats cleared. Classrooms and quizzes kept.");
  }

  function handleSetPin(e: React.FormEvent) {
    e.preventDefault();
    if (newPin.length < 4) {
      setNotice("PIN must be at least 4 characters.");
      return;
    }
    localStorage.setItem(PIN_KEY, newPin);
    setNewPin("");
    setChangingPin(false);
    setNotice("Teacher PIN updated.");
  }

  if (!unlocked) {
    return (
      <Card className="border-2 border-foreground/20 badge-shadow p-6">
        <div className="flex flex-wrap items-center gap-4">
          <HexBadge tone="coral" size={56}>
            <Lock strokeWidth={3} />
          </HexBadge>
          <div className="flex-1 min-w-[220px]">
            <div className="font-display text-xl font-black text-foreground">Teacher-only data controls</div>
            <p className="text-xs font-semibold text-foreground/90">
              PIN-protected. Delete a date range or wipe every record. Default PIN:{" "}
              <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono font-black">{DEFAULT_PIN}</span>
            </p>
          </div>
          <form onSubmit={submitPin} className="flex items-center gap-2">
            <Input
              type="password"
              inputMode="numeric"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-32 font-black tracking-widest"
            />
            <Button type="submit" variant="coral">
              <KeyRound className="h-4 w-4" strokeWidth={3} /> Unlock
            </Button>
          </form>
        </div>
        {error && <div className="mt-3 text-sm font-black text-coral">{error}</div>}
      </Card>
    );
  }

  return (
    <Card className="border-2 border-coral/40 badge-shadow p-6 space-y-6">
      <div className="flex items-start gap-3">
        <HexBadge tone="coral" size={56}>
          <ShieldAlert strokeWidth={3} />
        </HexBadge>
        <div className="flex-1">
          <div className="font-display text-xl font-black text-foreground">Data controls unlocked</div>
          <p className="text-xs font-semibold text-foreground/90">
            Destructive actions. Choose a date range for a partial delete, or wipe everything at once.
          </p>
        </div>
        <Button variant="ghost" onClick={() => setUnlocked(false)} className="text-xs font-black">
          Lock
        </Button>
      </div>

      {notice && (
        <div className="rounded-xl border-2 border-foreground/20 bg-mint/25 px-4 py-2 text-sm font-black text-foreground">
          {notice}
        </div>
      )}

      {/* Range delete */}
      <div className="rounded-2xl border-2 border-foreground/15 bg-background/70 p-4">
        <div className="flex items-center gap-2 text-sm font-black text-foreground">
          <CalendarRange className="h-4 w-4" strokeWidth={2.5} /> Delete data in a time period
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-black uppercase tracking-wider">
            From
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-44" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-black uppercase tracking-wider">
            To
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-44" />
          </label>
          <Button variant="coral" onClick={handleRangeDelete}>
            <Trash2 className="h-4 w-4" strokeWidth={3} /> Delete in range
          </Button>
        </div>
        <p className="mt-2 text-[11px] font-semibold text-foreground/80">
          Removes classroom sessions and quiz attempts whose date falls inside the range. Classrooms and quiz definitions stay.
        </p>
      </div>

      {/* Stats only */}
      <div className="rounded-2xl border-2 border-foreground/15 bg-background/70 p-4">
        <div className="text-sm font-black text-foreground">Clear all stats (keep classrooms & quizzes)</div>
        <p className="mt-1 text-[11px] font-semibold text-foreground/80">
          Wipes every recorded session and attempt so graphs go back to empty. Handy before a fresh cohort.
        </p>
        <Button variant="badge" onClick={handleClearStatsOnly} className="mt-3">
          <Trash2 className="h-4 w-4" strokeWidth={3} /> Clear all stats
        </Button>
      </div>

      {/* Wipe all */}
      <div className="rounded-2xl border-2 border-coral/50 bg-coral/10 p-4">
        <div className="text-sm font-black text-coral">Wipe ALL data</div>
        <p className="mt-1 text-[11px] font-semibold text-foreground/90">
          Deletes every classroom, student, session, quiz, and attempt. There is no undo.
        </p>
        <Button variant="coral" onClick={handleWipeAll} className="mt-3">
          <Trash2 className="h-4 w-4" strokeWidth={3} /> Delete everything
        </Button>
      </div>

      {/* PIN management */}
      <div className="rounded-2xl border-2 border-foreground/15 bg-background/70 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-black text-foreground">Teacher PIN</div>
          {!changingPin && (
            <Button variant="ghost" onClick={() => setChangingPin(true)} className="text-xs font-black">
              Change PIN
            </Button>
          )}
        </div>
        {changingPin && (
          <form onSubmit={handleSetPin} className="mt-3 flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs font-black uppercase tracking-wider">
              New PIN
              <Input
                type="password"
                inputMode="numeric"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                className="w-44 font-black tracking-widest"
              />
            </label>
            <Button type="submit" variant="badge">
              <KeyRound className="h-4 w-4" strokeWidth={3} /> Save PIN
            </Button>
            <Button type="button" variant="ghost" onClick={() => { setChangingPin(false); setNewPin(""); }}>
              Cancel
            </Button>
          </form>
        )}
      </div>

      {/* Dev flags */}
      <div className="rounded-2xl border-2 border-foreground/15 bg-background/70 p-4">
        <div className="flex items-center gap-2 text-sm font-black text-foreground">
          <FlaskConical className="h-4 w-4" strokeWidth={2.5} /> Developer flags
        </div>
        <label className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2 text-xs font-semibold">
          <div>
            <div className="text-sm font-black text-foreground">Mock / seed leak detection</div>
            <div className="text-[11px] text-foreground/70">
              Shows a red banner on the leaderboard / podium when a displayed name isn't in the classroom roster.
              Turn OFF while testing solo or fresh-classroom flows.
            </div>
          </div>
          <Switch checked={leakDetection} onCheckedChange={setLeakDetection} />
        </label>
      </div>

      {/* Audit log */}
      <div className="rounded-2xl border-2 border-foreground/15 bg-background/70 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-black text-foreground">
            <ScrollText className="h-4 w-4" strokeWidth={2.5} /> Session audit log ({auditEntries.length})
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setShowAudit((v) => !v)} className="text-xs font-black">
              {showAudit ? "Hide" : "View"}
            </Button>
            <Button variant="ghost" onClick={clearAudit} className="text-xs font-black text-coral">
              Clear
            </Button>
          </div>
        </div>
        <p className="mt-1 text-[11px] font-semibold text-foreground/70">
          Records the classroom roster IDs used to compute each recorded session's leaderboard / charts. Client-side; a true server-side log requires enabling Lovable Cloud.
        </p>
        {showAudit && (
          <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-foreground/10 bg-background text-xs">
            {auditEntries.length === 0 ? (
              <div className="p-3 text-foreground/60">No entries yet.</div>
            ) : (
              auditEntries.map((e) => (
                <div key={e.id} className="border-b border-foreground/5 p-3 last:border-b-0">
                  <div className="font-black">{e.quizTitle} · {e.classroomName}</div>
                  <div className="text-[10px] text-foreground/70">{new Date(e.ts).toLocaleString()}</div>
                  <div className="mt-1">
                    <span className="font-semibold">Roster ({e.rosterIds.length}):</span>{" "}
                    <span className="font-mono text-[10px]">{e.rosterIds.join(", ") || "—"}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Recorded picks ({e.tallyIds.length}):</span>{" "}
                    <span className="font-mono text-[10px]">{e.tallyIds.join(", ") || "—"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
