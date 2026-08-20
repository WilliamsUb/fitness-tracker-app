import { useState } from "react";
import { Activity, Check, Footprints, Loader2, RefreshCw, Ruler, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  HEALTH_PERMISSIONS,
  HEALTH_PROVIDERS,
  useHealthSync,
  type ActivitySample,
  type HealthProviderId,
} from "@/lib/health-sync";
import { unitLabel, type DistanceUnit } from "@/lib/fitness-store";

const ICONS = {
  steps: Footprints,
  distance: Ruler,
  activeEnergy: Activity,
} as const;

export function DataSyncPanel({
  open,
  onOpenChange,
  onImport,
  unit,
  onUnitChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImport: (samples: ActivitySample[]) => void;
  unit: DistanceUnit;
  onUnitChange: (u: DistanceUnit) => void;
}) {
  const { settings, labels, syncing, connect, resync, disconnect } = useHealthSync(onImport);
  const [pending, setPending] = useState<HealthProviderId | null>(null);
  const [authorizing, setAuthorizing] = useState(false);

  const ids = Object.keys(HEALTH_PROVIDERS) as HealthProviderId[];

  const handleToggle = (id: HealthProviderId, next: boolean) => {
    if (!next) {
      disconnect(id);
      toast(`${HEALTH_PROVIDERS[id].name} disconnected`);
      return;
    }
    setPending(id);
  };

  const allow = async () => {
    if (!pending) return;
    const id = pending;
    setAuthorizing(true);
    try {
      const res = await connect(
        id,
        HEALTH_PERMISSIONS.map((p) => p.id),
      );
      if (!res.ok) {
        toast.error(res.reason);
        return;
      }
      toast.success(`${HEALTH_PROVIDERS[id].name} synced — ${res.imported} days imported`);
      setPending(null);
    } finally {
      setAuthorizing(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Data Integrations</DialogTitle>
            <DialogDescription>
              Connect a health platform to import steps, distance and active energy automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="panel flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="font-bold text-foreground">Distance units</p>
              <p className="text-xs text-muted-foreground">
                Showing distances in {unit === "mi" ? "miles" : "kilometres"}.
              </p>
            </div>
            <div className="flex rounded-full bg-secondary/70 p-1">
              {(["km", "mi"] as DistanceUnit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  aria-pressed={unit === u}
                  onClick={() => {
                    onUnitChange(u);
                    toast(`Distances now in ${u === "mi" ? "miles" : "kilometres"}`);
                  }}
                  className={
                    unit === u
                      ? "rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground"
                      : "rounded-full px-3 py-1 text-xs font-bold text-muted-foreground"
                  }
                >
                  {unitLabel(u)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {ids.map((id) => {
              const provider = HEALTH_PROVIDERS[id];
              const state = settings[id];
              return (
                <div key={id} className="panel space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-foreground">Sync with {provider.name}</p>
                      <p className="text-xs text-muted-foreground">{provider.platform}</p>
                    </div>
                    <Switch
                      checked={state.enabled}
                      onCheckedChange={(v) => handleToggle(id, v)}
                      aria-label={`Sync with ${provider.name}`}
                    />
                  </div>

                  {state.enabled && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-[0.7rem] font-bold text-primary">
                        <Check className="h-3 w-3" strokeWidth={3} />
                        {labels[id]}
                      </span>
                      <Button
                        size="sm"
                        variant="soft"
                        onClick={async () => {
                          const n = await resync(id);
                          toast.success(`Re-synced ${n} days from ${provider.name}`);
                        }}
                        disabled={syncing === id}
                      >
                        {syncing === id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        Sync now
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Mock native authorization sheet */}
      <Dialog open={pending !== null} onOpenChange={(v) => !v && setPending(null)}>
        <DialogContent className="max-w-sm gap-4 rounded-3xl text-center">
          <DialogHeader className="items-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-base">
              {pending ? HEALTH_PROVIDERS[pending].name : ""} would like to access your health data
            </DialogTitle>
            <DialogDescription className="text-xs">
              PULSE is requesting Read &amp; Write access. You can change this at any time.
            </DialogDescription>
          </DialogHeader>

          <ul className="space-y-2 text-left">
            {HEALTH_PERMISSIONS.map((p) => {
              const Icon = ICONS[p.id];
              return (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-secondary/50 px-3 py-2"
                >
                  <Icon className="h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{p.label}</p>
                    <p className="text-[0.7rem] text-muted-foreground">{p.detail}</p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="grid gap-2">
            <Button onClick={allow} disabled={authorizing}>
              {authorizing && <Loader2 className="h-4 w-4 animate-spin" />}
              Allow all
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setPending(null);
                toast("Permission declined");
              }}
              disabled={authorizing}
            >
              Don't allow
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
