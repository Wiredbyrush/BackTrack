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
    message.includes('missing openai_api_key') ||
    message.includes('invalid api key') ||
    message.includes('unauthorized') ||
    message.includes('insufficient_quota') ||
    message.includes('quota') ||
    message.includes('rate limit') ||
    message.includes('billing') ||
    message.includes('(402)') ||
    message.includes('(429)')
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing imageBase64' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt =
      'Identify the object. Respond with JSON: {"keywords": ["..."], "query": "..."}. keywords should be 3-6 short tags. query should be a concise search phrase.';

    let result: { keywords?: unknown; query?: unknown } = {};
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
                'You label lost-and-found items. Return JSON only. No extra text.',
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: imageBase64 } },
              ],
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }),
      });

      if (response.ok) {
        const payload = await response.json();
        const content = payload.choices?.[0]?.message?.content;
        if (content) {
          result = JSON.parse(content);
        }
      } else {
        openaiError = await response.text();
      }
    } else {
      openaiError = 'Missing OPENAI_API_KEY';
    }

    if (
      (!result || (!result.keywords && !result.query)) &&
      GEMINI_API_KEY &&
      openaiError &&
      shouldFallbackToGemini(openaiError)
    ) {
      const geminiResponse = await fetch(
        `${GEMINI_BASE}/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: prompt },
                  {
                    inline_data: (() => {
                      if (imageBase64.startsWith('data:')) {
                        const [header, data] = imageBase64.split(',', 2);
                        const match = header.match(/data:(.*);base64/);
                        return {
                          mime_type: match?.[1] || 'image/png',
                          data,
                        };
                      }
                      return {
                        mime_type: 'image/png',
                        data: imageBase64,
                      };
                    })(),
                  },
                ],
              },
            ],
            generationConfig: {
              response_mime_type: 'application/json',
              temperature: 0.2,
            },
          }),
        },
      );

      if (geminiResponse.ok) {
        const payload = await geminiResponse.json();
        const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          result = JSON.parse(text);
        }
      } else {
        const error = await geminiResponse.text();
        return new Response(JSON.stringify({ error }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (!result || (!result.keywords && !result.query)) {
      return new Response(JSON.stringify({ error: openaiError || 'No result' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const keywords = Array.isArray(result.keywords) ? result.keywords : [];
    const query = typeof result.query === 'string' ? result.query : '';

    return new Response(JSON.stringify({ keywords, query }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
