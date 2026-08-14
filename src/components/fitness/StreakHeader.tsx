import { Check, Flame, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { activeDays, currentStreak, lastNDays, toKey, type FitnessData } from "@/lib/fitness-store";

export function StreakHeader({
  data,
  onOpenSettings,
}: {
  data: FitnessData;
  onOpenSettings: () => void;
}) {
  const streak = currentStreak(data);
  const active = activeDays(data);
  const days = lastNDays(7);


  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:flex sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
            style={{ backgroundImage: "var(--gradient-flame)" }}
          >
            <Flame className="h-6 w-6 text-background" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="text-[0.65rem] font-bold tracking-[0.18em] text-muted-foreground uppercase">
              Daily consistency streak
            </p>
            <p className="truncate text-lg font-extrabold text-foreground sm:text-xl">
              {streak} {streak === 1 ? "Day" : "Days"} Active
            </p>
          </div>
        </div>

        <div className="flex items-end gap-1.5">

          {days.map((d) => {
            const key = toKey(d);
            const done = active.has(key);
            return (
              <div key={key} className="flex flex-col items-center gap-1">
                <span className="text-[0.6rem] font-semibold text-muted-foreground">
                  {d.toLocaleDateString(undefined, { weekday: "narrow" })}
                </span>
                <div
                  className={
                    done
                      ? "grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground glow"
                      : "grid h-7 w-7 place-items-center rounded-lg border border-border bg-secondary/60"
                  }
                >
                  {done ? (
                    <Check className="h-4 w-4" strokeWidth={3} />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
}
