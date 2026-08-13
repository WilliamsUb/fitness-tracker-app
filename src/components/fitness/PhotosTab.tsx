import { useRef, useState } from "react";
import { Camera, Share2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatDay, type ProgressPhoto } from "@/lib/fitness-store";

export function PhotosTab({
  photos,
  onAdd,
  onUpdate,
  onRemove,
}: {
  photos: ProgressPhoto[];
  onAdd: (dataUrl: string) => void;
  onUpdate: (id: string, patch: Partial<ProgressPhoto>) => void;
  onRemove: (id: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [compare, setCompare] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [shareOpen, setShareOpen] = useState(false);

  const ordered = [...photos].sort((a, b) => a.createdAt - b.createdAt);
  const before = ordered.find((p) => p.id === selected[0]);
  const after = ordered.find((p) => p.id === selected[1]);

  function toggleSelect(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id].slice(-2),
    );
  }

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      onAdd(String(reader.result));
      toast.success("Photo added to your journal");
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-6">
      <div className="panel grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 p-5 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold">Progress Photo Journal</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {ordered.length} {ordered.length === 1 ? "entry" : "entries"} · newest last
          </p>
        </div>
        <Button variant="hero" onClick={() => fileRef.current?.click()}>
          <Camera className="h-4 w-4" /> Take / Upload Today's Photo
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </div>

      <div className="panel flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="font-bold">Side-by-Side Comparison</p>
          <p className="text-xs text-muted-foreground">
            {compare ? "Select any two photos below" : "Toggle on to compare two dates"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            checked={compare}
            onCheckedChange={(v) => {
              setCompare(v);
              setSelected([]);
            }}
          />
          <Label className="text-sm text-muted-foreground">Compare</Label>
        </div>
      </div>

      {compare && before && after && (
        <div className="panel p-5">
          <div className="grid grid-cols-2 gap-4">
            {[
              { p: before, tag: "Before" },
              { p: after, tag: "After" },
            ].map(({ p, tag }) => (
              <figure key={tag} className="relative overflow-hidden rounded-xl border border-border">
                <img src={p.dataUrl} alt={`${tag} progress`} className="aspect-3/4 w-full object-cover" />
                <figcaption className="absolute top-2 left-2 rounded-md bg-background/80 px-2 py-1 text-xs font-bold tracking-widest text-primary uppercase">
                  {tag}
                </figcaption>
                <span className="absolute bottom-2 left-2 rounded-md bg-background/80 px-2 py-1 text-[0.65rem] text-muted-foreground">
                  {formatDay(p.date)}
                  {p.weight ? ` · ${p.weight}` : ""}
                </span>
              </figure>
            ))}
          </div>
          <Button variant="hero" className="mt-5 w-full" onClick={() => setShareOpen(true)}>
            <Share2 className="h-4 w-4" /> Share Transformation
          </Button>
        </div>
      )}

      {ordered.length === 0 ? (
        <div className="panel p-10 text-center">
          <Camera className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            No photos yet. Snap your first progress shot to start the journal.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((p) => {
            const idx = selected.indexOf(p.id);
            return (
              <div
                key={p.id}
                className={
                  idx >= 0
                    ? "panel overflow-hidden glow"
                    : "panel overflow-hidden transition-shadow hover:glow"
                }
              >
                <button
                  type="button"
                  className="relative block w-full cursor-pointer"
                  onClick={() => compare && toggleSelect(p.id)}
                >
                  <img
                    src={p.dataUrl}
                    alt={p.caption || `Progress photo ${formatDay(p.date)}`}
                    className="aspect-3/4 w-full object-cover"
                  />
                  <span className="absolute top-2 left-2 rounded-md bg-background/80 px-2 py-1 text-[0.65rem] font-semibold">
                    {formatDay(p.date)}
                  </span>
                  {compare && idx >= 0 && (
                    <span className="absolute top-2 right-2 rounded-md bg-primary px-2 py-1 text-[0.65rem] font-bold text-primary-foreground">
                      {idx === 0 ? "Before" : "After"}
                    </span>
                  )}
                </button>
                <div className="space-y-2 p-3">
                  <Input
                    placeholder="Caption…"
                    value={p.caption}
                    onChange={(e) => onUpdate(p.id, { caption: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Weight (e.g. 78kg)"
                      value={p.weight}
                      onChange={(e) => onUpdate(p.id, { weight: e.target.value })}
                    />
                    <Button variant="soft" size="icon" onClick={() => onRemove(p.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Share transformation</DialogTitle>
            <DialogDescription>Your social card preview.</DialogDescription>
          </DialogHeader>
          {before && after && (
            <div className="overflow-hidden rounded-2xl border border-border bg-background">
              <div className="grid grid-rows-2">
                {[
                  { p: before, tag: "Before" },
                  { p: after, tag: "After" },
                ].map(({ p, tag }) => (
                  <div key={tag} className="relative">
                    <img src={p.dataUrl} alt={tag} className="aspect-video w-full object-cover" />
                    <span className="absolute inset-0 grid place-items-center font-display text-4xl font-extrabold tracking-tight text-foreground/70 mix-blend-overlay">
                      {tag}
                    </span>
                    <span className="absolute bottom-2 left-3 text-xs text-foreground/80">
                      {formatDay(p.date)}
                      {p.weight ? ` · ${p.weight}` : ""}
                    </span>
                  </div>
                ))}
              </div>
              <p className="p-3 text-center text-xs font-bold tracking-[0.3em] text-primary uppercase">
                Pulse
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="hero"
              onClick={async () => {
                const text = `My transformation: ${before ? formatDay(before.date) : ""} → ${
                  after ? formatDay(after.date) : ""
                } 💪 Tracked with PULSE`;
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
