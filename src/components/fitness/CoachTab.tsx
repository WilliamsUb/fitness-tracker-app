import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Activity, MessageCircle, Sparkle } from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { todayKey, type FitnessData } from "@/lib/fitness-store";

const QUICK_PROMPTS = [
  "How do I optimize protein intake?",
  "Proper deadlift form tips?",
  "Best way to warm up for a run?",
  "How many rest days do I need?",
];

function buildTrainingContext(data: FitnessData) {
  const key = todayKey();
  const workouts = data.workouts.filter((w) => w.date === key);
  const activity = data.activity.find((a) => a.date === key);

  const lines = [
    "Analyze my training for today and coach me.",
    "",
    "TODAY'S SESSIONS:",
    ...(workouts.length
      ? workouts.map(
          (w) =>
            `- ${w.name} (${w.type}, ${w.duration} min) — exercises: ${w.exercises || "n/a"}; sets: ${
              w.sets || "n/a"
            }; reps: ${w.reps || "n/a"}; weights: ${w.weights || "n/a"}`,
        )
      : ["- none logged"]),
    "",
    `STEPS: ${activity?.steps ?? 0}`,
    `RUNNING DISTANCE: ${activity?.distance ?? 0} km`,
  ];
  return lines.join("\n");
}

export function CoachTab({ data }: { data: FitnessData }) {
  const [mode, setMode] = useState<"feedback" | "ask">("feedback");
  const [text, setText] = useState("");

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (error) => toast.error(error.message || "Coach is unavailable right now"),
  });

  const busy = status === "submitted" || status === "streaming";

  function send(prompt: string) {
    if (!prompt.trim() || busy) return;
    sendMessage({ text: prompt });
  }

  return (
    <div className="panel flex h-[70dvh] min-h-[520px] flex-col overflow-hidden">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border p-4 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-extrabold">AI Coach</h2>
          <p className="text-xs text-muted-foreground">
            {mode === "feedback" ? "Session analysis from your logs" : "Open fitness Q&A"}
          </p>
        </div>
        <div className="flex rounded-xl bg-secondary/60 p-1">
          <button
            type="button"
            onClick={() => setMode("feedback")}
            className={
              mode === "feedback"
                ? "flex items-center gap-2 rounded-lg bg-[image:var(--gradient-teal)] px-3 py-1.5 text-xs font-bold text-primary-foreground"
                : "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground"
            }
          >
            <Activity className="h-3.5 w-3.5" /> Workout Feedback
          </button>
          <button
            type="button"
            onClick={() => setMode("ask")}
            className={
              mode === "ask"
                ? "flex items-center gap-2 rounded-lg bg-[image:var(--gradient-teal)] px-3 py-1.5 text-xs font-bold text-primary-foreground"
                : "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground"
            }
          >
            <MessageCircle className="h-3.5 w-3.5" /> Ask Coach
          </button>
        </div>
      </div>

      <Conversation className="flex-1">
        <ConversationContent className="gap-4">
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<Sparkle className="h-6 w-6 text-primary" />}
              title="Your coach is ready"
              description={
                mode === "feedback"
                  ? "Analyze today's training to get volume, intensity and recovery feedback."
                  : "Ask anything about training, nutrition or recovery."
              }
            />
          ) : (
            messages.map((m) => (
              <Message from={m.role} key={m.id}>
                <MessageContent>
                  {m.parts.map((part, i) =>
                    part.type === "text" ? (
                      <MessageResponse key={i}>{part.text}</MessageResponse>
                    ) : null,
                  )}
                </MessageContent>
              </Message>
            ))
          )}
          {status === "submitted" && <Shimmer>Coach is thinking...</Shimmer>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="space-y-3 border-t border-border p-4">
        {mode === "feedback" ? (
          <Button
            variant="hero"
            size="lg"
            className="w-full"
            disabled={busy}
            onClick={() => send(buildTrainingContext(data))}
          >
            <Activity className="h-4 w-4" /> Analyze Today's Training
          </Button>
        ) : (
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q}
                type="button"
                disabled={busy}
                onClick={() => send(q)}
                className="rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <PromptInput
          onSubmit={(message) => {
            send(message.text);
            setText("");
          }}
        >
          <PromptInputTextarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              mode === "feedback"
                ? "Add context, e.g. 'my left knee felt tight'…"
                : "Ask your coach anything…"
            }
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} disabled={busy || !text.trim()} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
