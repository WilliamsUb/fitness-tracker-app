import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { COACH_SYSTEM_PROMPT, createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return new Response(JSON.stringify({ error: "AI is not configured" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        const body = (await request.json()) as { messages?: UIMessage[] };
        const messages = body.messages ?? [];

        const gateway = createLovableAiGatewayProvider(apiKey);

        try {
          const result = streamText({
            model: gateway("google/gemini-3.6-flash"),
            system: COACH_SYSTEM_PROMPT,
            messages: await convertToModelMessages(messages),
            abortSignal: request.signal,
          });

          return result.toUIMessageStreamResponse();
        } catch (error) {
          const message = error instanceof Error ? error.message : "Coach is unavailable";
          const status = /rate/i.test(message) ? 429 : /credit|payment/i.test(message) ? 402 : 500;
          return new Response(JSON.stringify({ error: message }), {
            status,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
