/**
 * PULSE health-sync bridge.
 *
 * Standard native-plugin shape: a provider descriptor exposes
 * `isAvailable()`, `requestPermissions()` and `readActivitySamples()` so the
 * UI never talks to a vendor SDK directly. The implementations below are
 * mocked placeholders — swap the bodies for the real Capacitor / native
 * plugin calls (e.g. `CapacitorHealthkit.isAvailable()`) without touching
 * any component code.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { lastNDays, toKey } from "@/lib/fitness-store";

export type HealthProviderId = "apple-health" | "google-health-connect";

export type HealthPermission = "steps" | "distance" | "activeEnergy";

export const HEALTH_PERMISSIONS: { id: HealthPermission; label: string; detail: string }[] = [
  { id: "steps", label: "Steps", detail: "Read & write step counts" },
  { id: "distance", label: "Distance", detail: "Read & write walking + running distance" },
  { id: "activeEnergy", label: "Active Energy", detail: "Read & write active energy burnt" },
];

export type ActivitySample = {
  date: string;
  steps: number;
  distance: number;
  activeEnergy: number;
};

export type HealthProvider = {
  id: HealthProviderId;
  name: string;
  platform: string;
  /** Placeholder hook: replace with the native availability check. */
  isAvailable: () => Promise<boolean>;
  /** Placeholder hook: replace with the native permission request. */
  requestPermissions: (scopes: HealthPermission[]) => Promise<boolean>;
  /** Placeholder hook: replace with the native aggregate query. */
  readActivitySamples: (days: number) => Promise<ActivitySample[]>;
};

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function mockSamples(days: number, seedFactor: number): ActivitySample[] {
  return lastNDays(days).map((d, i) => {
    const wobble = ((i + 1) * seedFactor * 37) % 5;
    const steps = 6500 + wobble * 1150;
    const distance = Math.round((3.4 + wobble * 0.75) * 10) / 10;
    return {
      date: toKey(d),
      steps,
      distance,
      activeEnergy: Math.round(steps * 0.042),
    };
  });
}

function createMockProvider(
  id: HealthProviderId,
  name: string,
  platform: string,
  seedFactor: number,
): HealthProvider {
  return {
    id,
    name,
    platform,
    // TODO(native): return Capacitor.isNativePlatform() && (await Plugin.isAvailable()).
    isAvailable: async () => {
      await wait(220);
      return true;
    },
    // TODO(native): forward `scopes` to the platform permission request.
    requestPermissions: async (scopes) => {
      await wait(320);
      return scopes.length > 0;
    },
    // TODO(native): query aggregated daily buckets from the platform store.
    readActivitySamples: async (days) => {
      await wait(650);
      return mockSamples(days, seedFactor);
    },
  };
}

export const HEALTH_PROVIDERS: Record<HealthProviderId, HealthProvider> = {
  "apple-health": createMockProvider("apple-health", "Apple Health", "iOS · HealthKit", 3),
  "google-health-connect": createMockProvider(
    "google-health-connect",
    "Google Health Connect",
    "Android · Health Connect",
    5,
  ),
};

export type SyncState = {
  enabled: boolean;
  lastSyncedAt: number | null;
  grantedScopes: HealthPermission[];
};

export type SyncSettings = Record<HealthProviderId, SyncState>;

const SETTINGS_KEY = "pulse-health-sync";

const defaultState: SyncState = { enabled: false, lastSyncedAt: null, grantedScopes: [] };

const defaultSettings: SyncSettings = {
  "apple-health": { ...defaultState },
  "google-health-connect": { ...defaultState },
};

function loadSettings(): SyncSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as Partial<SyncSettings>;
    return {
      "apple-health": { ...defaultState, ...parsed["apple-health"] },
      "google-health-connect": { ...defaultState, ...parsed["google-health-connect"] },
    };
  } catch {
    return defaultSettings;
  }
}

export function relativeSyncLabel(ts: number | null) {
  if (!ts) return "Never synced";
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "Last Synced: Just Now";
  if (mins < 60) return `Last Synced: ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Last Synced: ${hours}h ago`;
  return `Last Synced: ${Math.floor(hours / 24)}d ago`;
}

export function useHealthSync(onImport: (samples: ActivitySample[]) => void) {
  const [settings, setSettings] = useState<SyncSettings>(defaultSettings);
  const [hydrated, setHydrated] = useState(false);
  const [syncing, setSyncing] = useState<HealthProviderId | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setSettings(loadSettings());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings, hydrated]);

  // keeps the "Last Synced" badge label fresh
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const checkAvailability = useCallback(async (id: HealthProviderId) => {
    return HEALTH_PROVIDERS[id].isAvailable();
  }, []);

  const connect = useCallback(
    async (id: HealthProviderId, scopes: HealthPermission[]) => {
      const provider = HEALTH_PROVIDERS[id];
      const available = await provider.isAvailable();
      if (!available) return { ok: false as const, reason: `${provider.name} is not available on this device.` };

      const granted = await provider.requestPermissions(scopes);
      if (!granted) return { ok: false as const, reason: "Permission was declined." };

      setSyncing(id);
      try {
        const samples = await provider.readActivitySamples(7);
        onImport(samples);
        setSettings((prev) => ({
          ...prev,
          [id]: { enabled: true, lastSyncedAt: Date.now(), grantedScopes: scopes },
        }));
        return { ok: true as const, imported: samples.length };
      } finally {
        setSyncing(null);
      }
    },
    [onImport],
  );

  const resync = useCallback(
    async (id: HealthProviderId) => {
      const provider = HEALTH_PROVIDERS[id];
      setSyncing(id);
      try {
        const samples = await provider.readActivitySamples(7);
        onImport(samples);
        setSettings((prev) => ({
          ...prev,
          [id]: { ...prev[id], lastSyncedAt: Date.now() },
        }));
        return samples.length;
      } finally {
        setSyncing(null);
      }
    },
    [onImport],
  );

  const disconnect = useCallback((id: HealthProviderId) => {
    setSettings((prev) => ({ ...prev, [id]: { ...defaultState } }));
  }, []);

  const labels = useMemo(() => {
    void tick;
    return {
      "apple-health": relativeSyncLabel(settings["apple-health"].lastSyncedAt),
      "google-health-connect": relativeSyncLabel(settings["google-health-connect"].lastSyncedAt),
    } as Record<HealthProviderId, string>;
  }, [settings, tick]);

  return { settings, labels, syncing, connect, resync, disconnect, checkAvailability };
}
