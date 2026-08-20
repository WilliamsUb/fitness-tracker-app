import { useState } from "react";
import {
  Activity,
  Clock,
  Dumbbell,
  HeartPulse,
  Pencil,
  Plus,
  Share2,
  StretchVertical,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { ExerciseEntry, Workout, WorkoutType } from "@/lib/fitness-store";
import { summarizeItems, todayKey, workoutItems } from "@/lib/fitness-store";
import { undoToast } from "@/lib/undo-toast";

const typeIcon = {
  cardio: HeartPulse,
  strength: Dumbbell,
  flexibility: StretchVertical,
} as const;

function summarize(w: Workout) {
  const items = workoutItems(w);
  return [
    `🔥 ${w.name} — ${w.type.toUpperCase()}`,
    `⏱ ${w.duration} min`,
    ...items.map(
      (it) =>
        `💪 ${it.name}${it.sets ? ` · ${it.sets} sets` : ""}${
          it.reps ? ` × ${it.reps} reps` : ""
        }${it.weight ? ` @ ${it.weight}` : ""}`,
    ),
    "",
    "Tracked with PULSE",
  ]
    .filter(Boolean)
    .join("\n");
}

const newItem = (): ExerciseEntry => ({
  id: crypto.randomUUID(),
  name: "",
  sets: "",
  reps: "",
  weight: "",
});

type FormState = {
  name: string;
  type: WorkoutType;
  duration: string;
  items: ExerciseEntry[];
};

const emptyForm = (): FormState => ({
  name: "",
  type: "strength",
  duration: "45",
  items: [newItem()],
});

export function WorkoutTab({
  workouts,
  onAdd,
  onUpdate,
  onRemove,
  onUndo,
}: {
  workouts: Workout[];
  onAdd: (w: Omit<Workout, "id" | "createdAt" | "date">) => void;
  onUpdate: (id: string, patch: Partial<Workout>) => void;
  onRemove: (id: string) => void;
  onUndo: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [share, setShare] = useState<Workout | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const today = workouts
    .filter((w) => w.date === todayKey())
    .sort((a, b) => b.createdAt - a.createdAt);
  const totalMinutes = today.reduce((s, w) => s + w.duration, 0);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setOpen(true);
  }

  function startEdit(w: Workout) {
    const items = workoutItems(w);
    setEditingId(w.id);
    setForm({
      name: w.name,
      type: w.type,
      duration: String(w.duration),
      items: items.length ? items.map((i) => ({ ...i })) : [newItem()],
    });
    setOpen(true);
  }

  function patchItem(id: string, patch: Partial<ExerciseEntry>) {
    setForm((f) => ({
      ...f,
      items: f.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    }));
  }

  function submit() {
    if (!form.name.trim()) {
      toast.error("Give your session a name");
      return;
    }
    const items = form.items.filter((i) => i.name.trim() || i.sets || i.reps || i.weight);
    const flat = summarizeItems(items);
    const payload = {
      name: form.name.trim(),
      type: form.type,
      duration: Number(form.duration) || 0,
      items,
      ...flat,
    };
    if (editingId) {
      onUpdate(editingId, payload);
      undoToast("Session updated", onUndo);
    } else {
      onAdd(payload);
      toast.success("Session logged");
    }
    setOpen(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  return (
    <div className="space-y-6">
      <div className="panel grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 p-5 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold">Today's Training</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {today.length} {today.length === 1 ? "session" : "sessions"} · {totalMinutes} min total
          </p>
        </div>
        <Button variant="hero" onClick={startCreate}>
          <Plus className="h-4 w-4" /> Log Session
        </Button>
      </div>

      <div className="panel p-5">
        <h3 className="text-sm font-bold tracking-[0.16em] text-muted-foreground uppercase">
          Session timeline
        </h3>
        {today.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Nothing logged yet today. Start your streak with a session.
          </p>
        ) : (
          <ol className="mt-5 space-y-1">
            {today.map((w, i) => {
              const Icon = typeIcon[w.type];
              const items = workoutItems(w);
              return (
                <li key={w.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {i !== today.length - 1 && (
                    <span className="absolute top-11 bottom-0 left-[1.3rem] w-px bg-border" />
                  )}
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label={`Edit ${w.name}`}
                    onClick={() => startEdit(w)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        startEdit(w);
                      }
                    }}
                    className="min-w-0 flex-1 cursor-pointer rounded-xl border border-border/70 bg-secondary/40 p-4 transition-colors hover:border-primary/50 hover:bg-secondary/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 truncate font-bold">
                          {w.name}
                          <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        </p>
                        <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" /> {w.duration} min ·{" "}
                          <span className="capitalize">{w.type}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={`Share ${w.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setShare(w);
                          }}
                        >
                          <Share2 className="h-4 w-4" />
                          <span className="hidden sm:inline">Share</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={`Delete ${w.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemove(w.id);
                            undoToast("Session deleted", onUndo);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {items.length > 0 && (
                      <ul className="mt-3 space-y-2">
                        {items.map((it) => (
                          <li
                            key={it.id}
                            className="rounded-lg bg-background/50 px-3 py-2 text-sm"
                          >
                            <p className="font-semibold text-foreground/90">{it.name || "Exercise"}</p>
                            {(it.sets || it.reps || it.weight) && (
                              <div className="mt-1.5 flex flex-wrap gap-2 text-xs">
                                {it.sets && <Stat label="Sets" value={it.sets} />}
                                {it.reps && <Stat label="Reps" value={it.reps} />}
                                {it.weight && <Stat label="Load" value={it.weight} />}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setEditingId(null);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit session" : "Log a session"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Adjust anything you got wrong."
                : "Capture the details while they're fresh."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Workout name</Label>
              <Input
                id="name"
                value={form.name}
                placeholder="Push Day, Tempo Run…"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v as WorkoutType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cardio">Cardio</SelectItem>
                    <SelectItem value="strength">Strength</SelectItem>
                    <SelectItem value="flexibility">Flexibility</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={0}
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <Label>Exercises</Label>
                <span className="text-xs text-muted-foreground">
                  {form.items.length} {form.items.length === 1 ? "exercise" : "exercises"}
                </span>
              </div>
              {form.items.map((it, idx) => (
                <div key={it.id} className="rounded-xl border border-border/70 bg-secondary/30 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold tracking-[0.16em] text-muted-foreground uppercase">
                      Exercise {idx + 1}
                    </span>
                    {form.items.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        aria-label={`Remove exercise ${idx + 1}`}
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            items: f.items.filter((x) => x.id !== it.id),
                          }))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Input
                    placeholder="Exercise name (Squat)"
                    value={it.name}
                    onChange={(e) => patchItem(it.id, { name: e.target.value })}
                  />
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Sets"
                      inputMode="numeric"
                      value={it.sets}
                      aria-label={`Sets for exercise ${idx + 1}`}
                      onChange={(e) => patchItem(it.id, { sets: e.target.value })}
                    />
                    <Input
                      placeholder="Reps"
                      inputMode="numeric"
                      value={it.reps}
                      aria-label={`Reps for exercise ${idx + 1}`}
                      onChange={(e) => patchItem(it.id, { reps: e.target.value })}
                    />
                    <Input
                      placeholder="Weight"
                      value={it.weight}
                      aria-label={`Weight for exercise ${idx + 1}`}
                      onChange={(e) => patchItem(it.id, { weight: e.target.value })}
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="soft"
                onClick={() => setForm((f) => ({ ...f, items: [...f.items, newItem()] }))}
              >
                <Plus className="h-4 w-4" /> Add exercise
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="hero" onClick={submit}>
              {editingId ? "Save changes" : "Save session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!share} onOpenChange={(o) => !o && setShare(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share workout</DialogTitle>
            <DialogDescription>Preview of what your friends will see.</DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl border border-border bg-secondary/50 p-4">
            <div className="mb-3 flex items-center gap-2 text-primary">
              <Activity className="h-4 w-4" />
              <span className="text-xs font-bold tracking-[0.2em] uppercase">Pulse</span>
            </div>
            <pre className="font-sans text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
              {share ? summarize(share) : ""}
            </pre>
          </div>
          <DialogFooter>
            <Button
              variant="hero"
              onClick={async () => {
                const text = share ? summarize(share) : "";
                try {
                  if (navigator.share) await navigator.share({ text });
                  else {
                    await navigator.clipboard.writeText(text);
                    toast.success("Copied to clipboard");
                  }
                } catch {
                  toast.error("Sharing cancelled");
                }
              }}
            >
              <Share2 className="h-4 w-4" /> Share now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-lg bg-background/60 px-2.5 py-1 text-muted-foreground">
      <span className="font-semibold text-foreground/80">{label}:</span> {value}
    </span>
  );
}
