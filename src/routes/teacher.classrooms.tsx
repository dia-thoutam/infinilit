import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, BarChart3, Plus, Trash2, Users, UserPlus, GraduationCap } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { HexBadge } from "@/components/hex-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useClassrooms } from "@/store/classrooms";

export const Route = createFileRoute("/teacher/classrooms")({
  head: () => ({
    meta: [
      { title: "Classrooms — InFiniLit" },
      { name: "description", content: "Manage classrooms and student rosters used during quiz sessions." },
    ],
  }),
  component: ClassroomsPage,
});

function ClassroomsPage() {
  const classrooms = useClassrooms((s) => s.classrooms);
  const upsert = useClassrooms((s) => s.upsert);
  const remove = useClassrooms((s) => s.remove);
  const addStudent = useClassrooms((s) => s.addStudent);
  const removeStudent = useClassrooms((s) => s.removeStudent);
  const renameStudent = useClassrooms((s) => s.renameStudent);

  const [newName, setNewName] = useState("");

  const createClassroom = () => {
    const name = newName.trim();
    if (!name) return;
    upsert({ id: `c-${Date.now()}`, name, students: [] });
    setNewName("");
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Link to="/teacher" className="mb-3 inline-flex">
              <Button variant="badge" size="sm"><ArrowLeft className="h-4 w-4" /> Back to library</Button>
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full bg-sky px-3 py-1 text-xs font-bold uppercase tracking-wider text-sky-foreground chunky-border">
              <Users className="h-3 w-3" strokeWidth={3} /> Classrooms
            </div>
            <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">Your classrooms</h1>
            <p className="mt-2 max-w-xl text-foreground/90 font-medium">
              Make a classroom, drop in your student roster, then pick it before starting a quiz. During the session you can tag which students chose each A/B/C/D.
            </p>
          </div>
        </div>

        <Card className="flex flex-wrap items-center gap-3 border-2 border-foreground/10 p-4 badge-shadow">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createClassroom()}
            placeholder="New classroom name — e.g. Grade 10 · Section B"
            className="h-11 flex-1 rounded-xl border-2 text-base"
          />
          <Button variant="coral" size="lg" onClick={createClassroom}>
            <Plus className="h-4 w-4" /> Create classroom
          </Button>
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          {classrooms.map((c, i) => {
            const tones = ["coral", "sunshine", "mint", "sky"] as const;
            const tone = tones[i % tones.length];
            return (
              <Card key={c.id} className="space-y-4 border-2 border-foreground/10 p-5 badge-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <HexBadge tone={tone} size={48}>
                      <GraduationCap className="h-5 w-5" strokeWidth={2.5} />
                    </HexBadge>
                    <div>
                      <Input
                        value={c.name}
                        onChange={(e) => upsert({ ...c, name: e.target.value })}
                        className="h-9 rounded-lg border-2 font-display text-lg font-bold"
                      />
                      <div className="mt-1 text-xs text-foreground/90 font-medium">
                        {c.students.length} students · {c.sessions?.length ?? 0} sessions
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                  <Link to="/teacher/classrooms/$id" params={{ id: c.id }}>
                    <Button variant="gradient" size="sm">
                      <BarChart3 className="h-4 w-4" /> Stats
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl hover:bg-coral/10 hover:text-coral"
                    onClick={() => {
                      if (confirm(`Delete "${c.name}"?`)) remove(c.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  </div>
                </div>

                <StudentList
                  classroom={c}
                  onAdd={(name) => addStudent(c.id, name)}
                  onRemove={(sid) => removeStudent(c.id, sid)}
                  onRename={(sid, n) => renameStudent(c.id, sid, n)}
                />
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

function StudentList({
  classroom,
  onAdd,
  onRemove,
  onRename,
}: {
  classroom: { id: string; students: { id: string; name: string }[] };
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  onRename: (id: string, name: string) => void;
}) {
  const [name, setName] = useState("");
  const add = () => {
    const n = name.trim();
    if (!n) return;
    onAdd(n);
    setName("");
  };
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a student name"
          className="h-10 rounded-xl border-2"
        />
        <Button variant="mint" onClick={add}><UserPlus className="h-4 w-4" /> Add</Button>
      </div>
      {classroom.students.length === 0 ? (
        <p className="rounded-xl bg-muted/40 p-3 text-center text-sm text-foreground/90 font-medium">No students yet. Add a few above.</p>
      ) : (
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {classroom.students.map((s) => (
            <li key={s.id} className="flex items-center gap-1.5 rounded-lg border-2 border-foreground/10 bg-card px-2 py-1">
              <Input
                value={s.name}
                onChange={(e) => onRename(s.id, e.target.value)}
                className="h-8 flex-1 border-0 bg-transparent px-1 text-sm shadow-none focus-visible:ring-0"
              />
              <button
                onClick={() => onRemove(s.id)}
                className="rounded-md p-1 text-foreground/90 font-medium hover:bg-coral/10 hover:text-coral"
                aria-label={`Remove ${s.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}