import { corsHeaders } from '../_shared/cors.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

const OPENAI_HEADERS = OPENAI_API_KEY
  ? {
    Authorization: `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  }
  : null;

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

function shouldFallbackToGemini(error: string) {
  const message = error.toLowerCase();
  return (
    message.includes('insufficient_quota') ||
    message.includes('quota') ||
    message.includes('rate limit') ||
    message.includes('billing') ||
    message.includes('(402)') ||
    message.includes('(429)')
  );
}

function isOnTopic(text: string) {
  const value = text.toLowerCase();
  const keywords = [
    'backtrack',
    'lost',
    'found',
    'item',
    'claim',
    'browse',
    'submit',
    'map',
    'login',
    'sign in',
    'sign up',
    'image match',
    'ai match',
    'chatbot',
    'listing',
    'post',
  ];

  return keywords.some((keyword) => value.includes(keyword));
}

const OFF_TOPIC_REPLY =
  "I can only help with the BackTrack website (features, pages, and how to use it). Ask me about the site and I’ll help.";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing message' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let reply = '';
    let openaiError = '';

    if (OPENAI_HEADERS) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: OPENAI_HEADERS,
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                `You are BackTrack Assistant, a concise, helpful, and highly accurate AI support bot for "BackTrack," the official student-led lost-and-found system for Forsyth County high schools.
Your primary goal is to guide students on how to use the website. Do not invent features that do not exist.

KEY FACTS ABOUT BACKTRACK:
1. Navigation: The site has several main pages: Home, Browse, Map, Submit, Rewards, Features, Sources. It also has Login, Signup, and Profile pages.
2. Core Purpose: Students use it to report lost items (Submit page) and browse items others have found (Browse page).
3. Image Matching: A standout feature is the "AI Smart Scan" (on the Browse and Scan pages) where students upload a photo of a lost item, and the AI extracts semantic features to match against the database.
4. Bounties/Rewards: Students can place a monetary "Bounty" on lost items they desperately need back (viewable on the Rewards page).
5. Map: The Campus Map page shows a 3D glow map of the school with live markers of where items have been reported lost or found.
6. Claims process: To claim an item, a student clicks "Claim" on the Browse page, provides proof of ownership, and an Admin reviews it via a Moderation Queue.

INSTRUCTIONS:
- ONLY answer questions related to the BackTrack website, its features, or lost-and-found queries.
- Do NOT make up URLs or emails.
- If asked an unrelated question, politely decline and steer the conversation back to BackTrack.
- Keep responses short, easy to read, and use bullet points when helpful.`
            },
            { role: 'user', content: message },
          ],
          temperature: 0.3,
        }),
      });

      if (response.ok) {
        const payload = await response.json();
        reply = payload.choices?.[0]?.message?.content?.trim() || '';
      } else {
        openaiError = await response.text();
      }
    } else {
      openaiError = 'Missing OPENAI_API_KEY';
    }

    if (!reply && GEMINI_API_KEY && openaiError && shouldFallbackToGemini(openaiError)) {
      const geminiResponse = await fetch(
        `${GEMINI_BASE}/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text:
                    `You are BackTrack Assistant, a concise, helpful, and highly accurate AI support bot for "BackTrack," the official student-led lost-and-found system for Forsyth County high schools.
Your primary goal is to guide students on how to use the website. Do not invent features that do not exist.

KEY FACTS ABOUT BACKTRACK:
1. Navigation: The site has several main pages: Home, Browse, Map, Submit, Rewards, Features, Sources. It also has Login, Signup, and Profile pages.
2. Core Purpose: Students use it to report lost items (Submit page) and browse items others have found (Browse page).
3. Image Matching: A standout feature is the "AI Smart Scan" (on the Browse and Scan pages) where students upload a photo of a lost item, and the AI extracts semantic features to match against the database.
4. Bounties/Rewards: Students can place a monetary "Bounty" on lost items they desperately need back (viewable on the Rewards page).
5. Map: The Campus Map page shows a 3D glow map of the school with live markers of where items have been reported lost or found.
6. Claims process: To claim an item, a student clicks "Claim" on the Browse page, provides proof of ownership, and an Admin reviews it via a Moderation Queue.

INSTRUCTIONS:
- ONLY answer questions related to the BackTrack website, its features, or lost-and-found queries.
- Do NOT make up URLs or emails.
- If asked an unrelated question, politely decline and steer the conversation back to BackTrack.
- Keep responses short, easy to read, and use bullet points when helpful.`
                },
              ],
            },
            contents: [
              {
                role: 'user',
                parts: [{ text: message }],
              },
            ],
            generationConfig: { temperature: 0.3 },
          }),
        },
      );

      if (geminiResponse.ok) {
        const payload = await geminiResponse.json();
        reply =
          payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      } else {
        const error = await geminiResponse.text();
        return new Response(JSON.stringify({ error }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (!reply) {
      return new Response(JSON.stringify({ error: openaiError || 'No reply' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isOnTopic(message) && !isOnTopic(reply)) {
      return new Response(JSON.stringify({ reply: OFF_TOPIC_REPLY }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
