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
  "I can only answer questions about the BackTrack website and its features.";

function isInScope(message: string) {
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

Deno.serve(async (req) => {
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

    if (!isInScope(message)) {
      return new Response(JSON.stringify({ reply: refusalMessage }), {
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
      "You are the BackTrack assistant. Answer questions about the BackTrack website and its features " +
      "using the provided site context. If the user asks about anything else, respond with: " +
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
          { role: "system", content: `Website context:\n${siteContext}` },
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
