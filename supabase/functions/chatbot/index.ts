import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const siteContext = `
BackTrack is a centralized lost-and-found website for students and staff.
Core pages: index (home), browse (search lost-and-found items), submit (report a found item),
features (product overview), and login (Google sign-in).
Key features: browse items with filters, submit found items with photos, image uploads, and account sign-in.
The map feature is not implemented yet.
`.trim();

const refusalMessage =
  "I can help with BackTrack and general guidance, but I can't go deep on unrelated topics.";

function isBackTrackRelated(message: string) {
  const normalized = message.toLowerCase();
  const keywords = [
    "backtrack",
    "lost and found",
    "lost",
    "found",
    "item",
    "items",
    "submit",
    "browse",
    "feature",
    "features",
    "login",
    "log in",
    "sign in",
    "account",
    "map",
  ];

  return keywords.some((keyword) => normalized.includes(keyword));
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Message is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt =
      "You are the BackTrack assistant. Always prioritize questions about BackTrack. " +
      "If the question is unrelated, give a brief, high-level answer (1-3 sentences), " +
      "then invite the user back to BackTrack topics. For deep unrelated requests, reply with: " +
      `"${refusalMessage}"`;

    const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 250,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "system", content: `BackTrack context:\n${siteContext}` },
          {
            role: "system",
            content: isBackTrackRelated(message)
              ? "The user's question is related to BackTrack."
              : "The user's question appears unrelated to BackTrack. Keep the answer brief and redirect."
          },
          { role: "user", content: message },
        ],
      }),
    });

    if (!openAiResponse.ok) {
      const errorText = await openAiResponse.text();
      return new Response(JSON.stringify({ error: errorText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await openAiResponse.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();

    return new Response(JSON.stringify({ reply: reply || "" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
