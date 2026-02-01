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
                'You are BackTrack, a concise assistant for a lost-and-found app website. Only answer questions about this website (features, pages, how to use it). If a question is unrelated, say you can only help with BackTrack and invite the user to ask about the site.',
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
                    'You are BackTrack, a concise assistant for a lost-and-found app website. Only answer questions about this website (features, pages, how to use it). If a question is unrelated, say you can only help with BackTrack and invite the user to ask about the site.',
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
