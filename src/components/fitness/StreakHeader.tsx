import { useState } from "react";
import { Check, Flame, Settings } from "lucide-react";
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
  activeDays,
  currentStreak,
  formatDay,
  lastNDays,
  toDisplayDistance,
  toKey,
  toStoredDistance,
  unitLabel,
  type FitnessData,
} from "@/lib/fitness-store";
import { undoToast } from "@/lib/undo-toast";

export function StreakHeader({
  data,
  onOpenSettings,
  onSetDay,
  onUndo,
}: {
  data: FitnessData;
  onOpenSettings: () => void;
  onSetDay: (samples: { date: string; steps: number; distance: number }[]) => void;
  onUndo: () => void;
}) {
  const unit = data.unit;
  const streak = currentStreak(data);
  const active = activeDays(data);
  const days = lastNDays(7);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [draft, setDraft] = useState({ steps: "", distance: "" });

  function openDay(key: string) {
    const day = data.activity.find((a) => a.date === key);
    setDraft({
      steps: day ? String(day.steps) : "",
      distance: day ? String(toDisplayDistance(day.distance, unit)) : "",
    });
    setEditKey(key);
  }

  function saveDay(steps: number, distance: number) {
    if (!editKey) return;
    onSetDay([{ date: editKey, steps, distance }]);
    setEditKey(null);
    undoToast(steps || distance ? "Day updated" : "Day cleared", onUndo);
  }

  const editingWorkouts = editKey ? data.workouts.filter((w) => w.date === editKey) : [];


  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-5xl px-4 py-3 sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <div
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl sm:h-11 sm:w-11"
            style={{ backgroundImage: "var(--gradient-flame)" }}
          >
            <Flame className="h-5 w-5 text-background sm:h-6 sm:w-6" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[0.6rem] font-bold tracking-[0.16em] text-muted-foreground uppercase sm:text-[0.65rem]">
              Consistency streak
            </p>
            <p className="truncate text-base font-extrabold text-foreground sm:text-xl">
              {streak} {streak === 1 ? "Day" : "Days"} Active
            </p>
          </div>
          <Button
            variant="soft"
            size="icon-sm"
            className="shrink-0 sm:hidden"
            onClick={onOpenSettings}
            aria-label="Data integrations settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-3 flex items-center gap-2 sm:mt-0">
          <div className="grid flex-1 grid-cols-7 gap-1 sm:flex sm:flex-none sm:gap-1.5">
            {days.map((d) => {
              const key = toKey(d);
              const done = active.has(key);
              return (
                <div key={key} className="flex flex-col items-center gap-1">
                  <span className="text-[0.6rem] font-semibold text-muted-foreground">
                    {d.toLocaleDateString(undefined, { weekday: "narrow" })}
                  </span>
                  <button
                    type="button"
                    aria-label={`Edit activity for ${formatDay(key)}`}
                    onClick={() => openDay(key)}
                    className={
                      done
                        ? "grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground transition-transform glow hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        : "grid h-7 w-7 place-items-center rounded-lg border border-border bg-secondary/60 transition-colors hover:border-primary/60 hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    }
                  >
                    {done ? (
                      <Check className="h-4 w-4" strokeWidth={3} />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
          <Button
            variant="soft"
            size="icon-sm"
            className="ml-1 hidden self-center sm:inline-flex"
            onClick={onOpenSettings}
            aria-label="Data integrations settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={!!editKey} onOpenChange={(o) => !o && setEditKey(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editKey ? formatDay(editKey) : ""}</DialogTitle>
            <DialogDescription>
              Edit this day's activity. Any steps or distance keeps the streak alive.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="day-steps">Steps</Label>
              <Input
                id="day-steps"
                type="number"
                min={0}
                inputMode="numeric"
                value={draft.steps}
                placeholder="0"
                onChange={(e) => setDraft({ ...draft, steps: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="day-distance">Distance ({unitLabel(unit)})</Label>
              <Input
                id="day-distance"
                type="number"
                min={0}
                step="0.1"
                inputMode="decimal"
                value={draft.distance}
                placeholder="0"
                onChange={(e) => setDraft({ ...draft, distance: e.target.value })}
              />
            </div>
            {editingWorkouts.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {editingWorkouts.length}{" "}
                {editingWorkouts.length === 1 ? "session" : "sessions"} logged this day — edit
                those in the Workouts tab.
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="ghost" onClick={() => saveDay(0, 0)}>
              Clear day
            </Button>
            <Button
              variant="hero"
              onClick={() =>
                saveDay(
                  Math.max(0, Math.round(Number(draft.steps) || 0)),
                  toStoredDistance(Number(draft.distance) || 0, unit),
                )
              }
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
