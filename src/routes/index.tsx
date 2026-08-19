import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bot, Camera, Dumbbell, Footprints } from "lucide-react";
import { DataSyncPanel } from "@/components/fitness/DataSyncPanel";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { StreakHeader } from "@/components/fitness/StreakHeader";
import { WorkoutTab } from "@/components/fitness/WorkoutTab";
import { ActivityTab } from "@/components/fitness/ActivityTab";
import { PhotosTab } from "@/components/fitness/PhotosTab";
import { CoachTab } from "@/components/fitness/CoachTab";
import { useFitnessData } from "@/lib/fitness-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PULSE — Daily Fitness & Streak Tracker" },
      {
        name: "description",
        content:
          "Track workouts, steps, running distance and progress photos in one dark, athletic dashboard with daily consistency streaks.",
      },
      { property: "og:title", content: "PULSE — Daily Fitness & Streak Tracker" },
      {
        property: "og:description",
        content:
          "Log sessions, hit your step and distance goals, and build your progress photo journal.",
      },
      { property: "og:url", content: "https://ignitetracker.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://ignitetracker.lovable.app/" }],
  }),
  component: Index,
});

function Index() {
  const {
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
  } = useFitnessData();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen pb-16">
      <StreakHeader
        data={data}
        onOpenSettings={() => setSettingsOpen(true)}
        onSetDay={mergeActivity}
      />
      <DataSyncPanel
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onImport={mergeActivity}
      />

      <main className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="sr-only">PULSE fitness tracker</h1>
        {!hydrated ? (
          <div className="panel h-64 animate-pulse" />
        ) : (
          <Tabs defaultValue="workouts">
            <TabsList className="grid w-full grid-cols-4 rounded-xl bg-secondary/60 p-1">
              <TabsTrigger value="workouts" className="gap-2 rounded-lg" aria-label="Workouts">
                <Dumbbell className="h-4 w-4" />
                <span className="hidden sm:inline">Workouts</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-2 rounded-lg" aria-label="Activity">
                <Footprints className="h-4 w-4" />
                <span className="hidden sm:inline">Activity</span>
              </TabsTrigger>
              <TabsTrigger value="photos" className="gap-2 rounded-lg" aria-label="Photos">
                <Camera className="h-4 w-4" />
                <span className="hidden sm:inline">Photos</span>
              </TabsTrigger>
              <TabsTrigger value="coach" className="gap-2 rounded-lg" aria-label="Coach">
                <Bot className="h-4 w-4" />
                <span className="hidden sm:inline">Coach</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="workouts" className="mt-6">
              <WorkoutTab
                workouts={data.workouts}
                onAdd={addWorkout}
                onUpdate={updateWorkout}
                onRemove={removeWorkout}
              />
            </TabsContent>
            <TabsContent value="activity" className="mt-6">
              <ActivityTab activity={data.activity} onBump={bumpActivity} />
            </TabsContent>
            <TabsContent value="photos" className="mt-6">
              <PhotosTab
                photos={data.photos}
                onAdd={addPhoto}
                onUpdate={updatePhoto}
                onRemove={removePhoto}
              />
            </TabsContent>
            <TabsContent value="coach" className="mt-6">
              <CoachTab data={data} />
            </TabsContent>
          </Tabs>
        )}
      </main>
      <Toaster />
    </div>
  );
}
