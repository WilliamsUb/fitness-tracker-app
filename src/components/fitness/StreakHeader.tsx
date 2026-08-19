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
    </header>
  );
}
