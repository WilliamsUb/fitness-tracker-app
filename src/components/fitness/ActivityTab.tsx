import { Footprints, Minus, Plus, Route } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { formatDay, lastNDays, toKey, type ActivityDay } from "@/lib/fitness-store";

const STEP_GOAL = 10000;
const DIST_GOAL = 8;

function Ring({
  value,
  goal,
  label,
  unit,
  display,
  color,
  icon,
}: {
  value: number;
  goal: number;
  label: string;
  unit: string;
  display: string;
  color: string;
  icon: React.ReactNode;
}) {
  const pct = Math.min(1, goal > 0 ? value / goal : 0);
  const r = 74;
  const c = 2 * Math.PI * r;

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[184px] w-[184px]">
        <svg viewBox="0 0 184 184" className="h-full w-full -rotate-90">
          <circle
            cx="92"
            cy="92"
            r={r}
            fill="none"
            stroke="var(--color-secondary)"
            strokeWidth="14"
          />
          <circle
            cx="92"
            cy="92"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
            style={{ transition: "stroke-dashoffset 600ms ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-muted-foreground">{icon}</div>
          <p className="mt-1 font-display text-3xl font-extrabold">{display}</p>
          <p className="text-xs text-muted-foreground">
            of {goal.toLocaleString()} {unit}
          </p>
          <p className="mt-1 text-xs font-bold text-primary">{Math.round(pct * 100)}%</p>
        </div>
      </div>
      <p className="mt-3 text-sm font-bold tracking-[0.16em] text-muted-foreground uppercase">
        {label}
      </p>
    </div>
  );
}

export function ActivityTab({
  activity,
  onBump,
}: {
  activity: ActivityDay[];
  onBump: (steps: number, distance: number) => void;
}) {
  const key = toKey(new Date());
  const today = activity.find((a) => a.date === key) ?? { date: key, steps: 0, distance: 0 };
  const chart = lastNDays(7).map((d) => {
    const k = toKey(d);
    const row = activity.find((a) => a.date === k);
    return { day: formatDay(k), steps: row?.steps ?? 0, distance: row?.distance ?? 0 };
  });

  return (
    <div className="space-y-6">
      <div className="panel p-6">
        <h2 className="text-xl font-extrabold">Daily Activity</h2>
        <p className="mt-1 text-sm text-muted-foreground">Move goals reset every midnight.</p>

        <div className="mt-6 grid gap-8 sm:grid-cols-2">
          <Ring
            value={today.steps}
            goal={STEP_GOAL}
            label="Steps"
            unit="steps"
            display={today.steps.toLocaleString()}
            color="var(--color-primary)"
            icon={<Footprints className="h-5 w-5" />}
          />
          <Ring
            value={today.distance}
            goal={DIST_GOAL}
            label="Running distance"
            unit="km"
            display={`${today.distance.toFixed(1)} km`}
            color="var(--color-flame)"
            icon={<Route className="h-5 w-5" />}
          />
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <Button variant="hero" className="flex-1" onClick={() => onBump(1000, 0)}>
              <Plus className="h-4 w-4" /> 1,000 steps
            </Button>
            <Button variant="soft" size="icon" onClick={() => onBump(-1000, 0)}>
              <Minus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="flame" className="flex-1" onClick={() => onBump(0, 0.5)}>
              <Plus className="h-4 w-4" /> 0.5 km
            </Button>
            <Button variant="soft" size="icon" onClick={() => onBump(0, -0.5)}>
              <Minus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="panel p-6">
        <h3 className="text-sm font-bold tracking-[0.16em] text-muted-foreground uppercase">
          Weekly trends
        </h3>
        <div className="mt-5 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="day"
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="steps"
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis yAxisId="dist" orientation="right" hide />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "0.75rem",
                  color: "var(--color-popover-foreground)",
                  fontSize: 12,
                }}
              />
              <Line
                yAxisId="steps"
                type="monotone"
                dataKey="steps"
                stroke="var(--color-primary)"
                strokeWidth={3}
                dot={{ r: 3 }}
              />
              <Line
                yAxisId="dist"
                type="monotone"
                dataKey="distance"
                stroke="var(--color-flame)"
                strokeWidth={3}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex gap-5 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" /> Steps
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-flame" /> Distance (km)
          </span>
        </div>
      </div>
    </div>
  );
}
