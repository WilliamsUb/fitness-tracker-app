import { useState } from "react";
import { Activity, Clock, Dumbbell, HeartPulse, Plus, Share2, StretchVertical } from "lucide-react";
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
import type { Workout, WorkoutType } from "@/lib/fitness-store";
import { todayKey } from "@/lib/fitness-store";

const typeIcon = {
  cardio: HeartPulse,
  strength: Dumbbell,
  flexibility: StretchVertical,
} as const;

function summarize(w: Workout) {
  return [
    `🔥 ${w.name} — ${w.type.toUpperCase()}`,
    `⏱ ${w.duration} min`,
    w.exercises ? `💪 ${w.exercises}` : null,
    w.sets ? `Sets: ${w.sets}` : null,
    w.reps ? `Reps: ${w.reps}` : null,
    w.weights ? `Load: ${w.weights}` : null,
    "",
    "Tracked with PULSE",
  ]
    .filter(Boolean)
    .join("\n");
}

export function WorkoutTab({
  workouts,
  onAdd,
}: {
  workouts: Workout[];
  onAdd: (w: Omit<Workout, "id" | "createdAt" | "date">) => void;
}) {
  const [open, setOpen] = useState(false);
  const [share, setShare] = useState<Workout | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "strength" as WorkoutType,
    duration: "45",
    exercises: "",
    sets: "",
    reps: "",
    weights: "",
  });

  const today = workouts
    .filter((w) => w.date === todayKey())
    .sort((a, b) => b.createdAt - a.createdAt);
  const totalMinutes = today.reduce((s, w) => s + w.duration, 0);

  function submit() {
    if (!form.name.trim()) {
      toast.error("Give your session a name");
      return;
    }
    onAdd({ ...form, duration: Number(form.duration) || 0 });
    setOpen(false);
    setForm({
      name: "",
      type: "strength",
      duration: "45",
      exercises: "",
      sets: "",
      reps: "",
      weights: "",
    });
    toast.success("Session logged");
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
        <Button variant="hero" onClick={() => setOpen(true)}>
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
              return (
                <li key={w.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {i !== today.length - 1 && (
                    <span className="absolute top-11 bottom-0 left-[1.3rem] w-px bg-border" />
                  )}
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 rounded-xl border border-border/70 bg-secondary/40 p-4">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-bold">{w.name}</p>
                        <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" /> {w.duration} min ·{" "}
                          <span className="capitalize">{w.type}</span>
                        </p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => setShare(w)}>
                        <Share2 className="h-4 w-4" /> Share
                      </Button>
                    </div>
                    {w.exercises && (
                      <p className="mt-3 text-sm text-foreground/90">{w.exercises}</p>
                    )}
                    {(w.sets || w.reps || w.weights) && (
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        {w.sets && <Stat label="Sets" value={w.sets} />}
                        {w.reps && <Stat label="Reps" value={w.reps} />}
                        {w.weights && <Stat label="Load" value={w.weights} />}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Log a session</DialogTitle>
            <DialogDescription>Capture the details while they're fresh.</DialogDescription>
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
            <div className="grid gap-2">
              <Label htmlFor="exercises">Exercises</Label>
              <Input
                id="exercises"
                placeholder="Squat, Deadlift, Row"
                value={form.exercises}
                onChange={(e) => setForm({ ...form, exercises: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="sets">Sets</Label>
                <Input
                  id="sets"
                  placeholder="4, 4, 3"
                  value={form.sets}
                  onChange={(e) => setForm({ ...form, sets: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reps">Reps</Label>
                <Input
                  id="reps"
                  placeholder="8, 10, 12"
                  value={form.reps}
                  onChange={(e) => setForm({ ...form, reps: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="weights">Weights</Label>
                <Input
                  id="weights"
                  placeholder="80kg, 45kg"
                  value={form.weights}
                  onChange={(e) => setForm({ ...form, weights: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="hero" onClick={submit}>
              Save session
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
