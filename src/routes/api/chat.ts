import { createFileRoute } from "@tanstack/react-router";

type Msg = { role: "user" | "assistant" | "system"; content: string };

const SYSTEM_PROMPT = `You are MIGHTY MINDZ AI, the friendly assistant for Mighty Mindz International Pre-school.
Tone: warm, playful, encouraging — you are talking to parents of children aged 2 to 6.
Scope: help parents learn about our programs (Playgroup, Nursery, LKG, UKG), admissions for 2026, school hours, facilities, fees enquiries, safety, and daily routines.
For fees, exact schedules, or availability, invite parents to book a tour or use the WhatsApp button.
Keep replies short (2–4 sentences), use emojis sparingly (🎨🧒📚), and never invent policies you don't know — offer to connect them with the admissions team instead.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const { messages } = (await request.json()) as { messages: Msg[] };
        if (!Array.isArray(messages)) {
          return new Response("messages required", { status: 400 });
        }

        const upstream = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              stream: true,
              messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
            }),
          },
        );

        if (!upstream.ok || !upstream.body) {
          return new Response(await upstream.text().catch(() => "Upstream error"), {
            status: upstream.status,
          });
        }

        return new Response(upstream.body, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
          },
        });
      },
    },
  },
});
