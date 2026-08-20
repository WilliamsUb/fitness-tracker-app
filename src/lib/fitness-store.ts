import { useCallback, useEffect, useRef, useState } from "react";

export type DistanceUnit = "km" | "mi";

const KM_PER_MI = 1.609344;

/** Convert stored kilometres into the user's display unit. */
export function toDisplayDistance(km: number, unit: DistanceUnit) {
  const v = unit === "mi" ? km / KM_PER_MI : km;
  return Math.round(v * 10) / 10;
}

/** Convert a value typed in the user's unit back into stored kilometres. */
export function toStoredDistance(value: number, unit: DistanceUnit) {
  const km = unit === "mi" ? value * KM_PER_MI : value;
  return Math.max(0, Math.round(km * 100) / 100);
}

export function unitLabel(unit: DistanceUnit) {
  return unit === "mi" ? "mi" : "km";
}

export function distanceGoal(unit: DistanceUnit) {
  return unit === "mi" ? 5 : 8;
}

export type WorkoutType = "cardio" | "strength" | "flexibility";

export type ExerciseEntry = {
  id: string;
  name: string;
  sets: string;
  reps: string;
  weight: string;
};

export type Workout = {
  id: string;
  date: string; // yyyy-mm-dd
  name: string;
  type: WorkoutType;
  duration: number;
  exercises: string;
  sets: string;
  reps: string;
  weights: string;
  items?: ExerciseEntry[];
  createdAt: number;
};

export type ActivityDay = {
  date: string;
  steps: number;
  distance: number; // km
};

export type ProgressPhoto = {
  id: string;
  date: string;
  dataUrl: string;
  caption: string;
  weight: string;
  createdAt: number;
};

export type FitnessData = {
  workouts: Workout[];
  activity: ActivityDay[];
  photos: ProgressPhoto[];
  unit: DistanceUnit;
};

const STORAGE_KEY = "pulse-fitness-data";

export const todayKey = () => toKey(new Date());

export function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function lastNDays(n: number) {
  const out: Date[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d);
  }
  return out;
}

export function formatDay(key: string) {
  const [y, m, d] = key.split("-").map(Number) as [number, number, number];
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function seed(): FitnessData {
  const days = lastNDays(7).map(toKey);
  const stepBase = [8400, 11200, 6100, 12500, 9800, 10400, 4200];
  const distBase = [4.2, 6.8, 2.1, 8.4, 5.5, 6.1, 2.4];
  return {
    workouts: [
      {
        id: "w1",
        date: days[6]!,
        name: "Push Day",
        type: "strength",
        duration: 52,
        exercises: "Bench Press, Overhead Press, Dips",
        sets: "4, 4, 3",
        reps: "8, 10, 12",
        weights: "80kg, 45kg, bodyweight",
        createdAt: Date.now() - 1000 * 60 * 200,
      },
      {
        id: "w2",
        date: days[6]!,
        name: "Zone 2 Run",
        type: "cardio",
        duration: 34,
        exercises: "Treadmill run",
        sets: "1",
        reps: "—",
        weights: "—",
        createdAt: Date.now() - 1000 * 60 * 60,
      },
    ],
    activity: days.map((date, i) => ({
      date,
      steps: stepBase[i]!,
      distance: distBase[i]!,
    })),
    photos: [],
    unit: "km",
  };
}

function splitList(v: string) {
  return (v ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export function workoutItems(w: Workout): ExerciseEntry[] {
  if (w.items && w.items.length) return w.items;
  const names = splitList(w.exercises);
  const sets = splitList(w.sets);
  const reps = splitList(w.reps);
  const weights = splitList(w.weights);
  if (!names.length) return [];
  return names.map((name, i) => ({
    id: `${w.id}-${i}`,
    name,
    sets: sets[i] ?? "",
    reps: reps[i] ?? "",
    weight: weights[i] ?? "",
  }));
}

export function summarizeItems(items: ExerciseEntry[]) {
  return {
    exercises: items.map((i) => i.name).filter(Boolean).join(", "),
    sets: items.map((i) => i.sets || "—").join(", "),
    reps: items.map((i) => i.reps || "—").join(", "),
    weights: items.map((i) => i.weight || "—").join(", "),
  };
}

function load(): FitnessData {
  if (typeof window === "undefined")
    return { workouts: [], activity: [], photos: [], unit: "km" };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed();
    const parsed = JSON.parse(raw) as FitnessData;
    return {
      workouts: parsed.workouts ?? [],
      activity: parsed.activity ?? [],
      photos: parsed.photos ?? [],
      unit: parsed.unit === "mi" ? "mi" : "km",
    };
  } catch {
    return seed();
  }
}

export function useFitnessData() {
  const [data, setData] = useState<FitnessData>({
    workouts: [],
    activity: [],
    photos: [],
    unit: "km",
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, hydrated]);

  const addWorkout = useCallback((w: Omit<Workout, "id" | "createdAt" | "date">) => {
    setData((prev) => ({
      ...prev,
      workouts: [
        ...prev.workouts,
        { ...w, id: crypto.randomUUID(), date: todayKey(), createdAt: Date.now() },
      ],
    }));
  }, []);

  const updateWorkout = useCallback((id: string, patch: Partial<Workout>) => {
    setData((prev) => ({
      ...prev,
      workouts: prev.workouts.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    }));
  }, []);

  const removeWorkout = useCallback((id: string) => {
    setData((prev) => ({ ...prev, workouts: prev.workouts.filter((w) => w.id !== id) }));
  }, []);

  const bumpActivity = useCallback((steps: number, distance: number) => {
    setData((prev) => {
      const key = todayKey();
      const exists = prev.activity.some((a) => a.date === key);
      const activity = exists
        ? prev.activity.map((a) =>
            a.date === key
              ? {
                  ...a,
                  steps: Math.max(0, a.steps + steps),
                  distance: Math.max(0, Math.round((a.distance + distance) * 10) / 10),
                }
              : a,
          )
        : [
            ...prev.activity,
            { date: key, steps: Math.max(0, steps), distance: Math.max(0, distance) },
          ];
      return { ...prev, activity };
    });
  }, []);

  const mergeActivity = useCallback(
    (samples: { date: string; steps: number; distance: number }[]) => {
      setData((prev) => {
        const map = new Map(prev.activity.map((a) => [a.date, a]));
        samples.forEach((s) => {
          map.set(s.date, {
            date: s.date,
            steps: Math.max(0, Math.round(s.steps)),
            distance: Math.max(0, Math.round(s.distance * 10) / 10),
          });
        });
        return {
          ...prev,
          activity: [...map.values()].sort((a, b) => a.date.localeCompare(b.date)),
        };
      });
    },
    [],
  );

  const addPhoto = useCallback((dataUrl: string) => {

    setData((prev) => ({
      ...prev,
      photos: [
        ...prev.photos,
        {
          id: crypto.randomUUID(),
          date: todayKey(),
          dataUrl,
          caption: "",
          weight: "",
          createdAt: Date.now(),
        },
      ],
    }));
  }, []);

  const updatePhoto = useCallback((id: string, patch: Partial<ProgressPhoto>) => {
    setData((prev) => ({
      ...prev,
      photos: prev.photos.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  }, []);

  const removePhoto = useCallback((id: string) => {
    setData((prev) => ({ ...prev, photos: prev.photos.filter((p) => p.id !== id) }));
  }, []);

  return {
    data,
    hydrated,
    addWorkout,
    updateWorkout,
    removeWorkout,
    bumpActivity,
    mergeActivity,
    addPhoto,
    updatePhoto,
    removePhoto,
  };

}

export function activeDays(data: FitnessData) {
  const set = new Set<string>();
  data.workouts.forEach((w) => set.add(w.date));
  data.activity.forEach((a) => {
    if (a.steps > 0 || a.distance > 0) set.add(a.date);
  });
  data.photos.forEach((p) => set.add(p.date));
  return set;
}

export function currentStreak(data: FitnessData) {
  const set = activeDays(data);
  let streak = 0;
  const d = new Date();
  // allow today to be empty without breaking yesterday's streak
  if (!set.has(toKey(d))) d.setDate(d.getDate() - 1);
  while (set.has(toKey(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
