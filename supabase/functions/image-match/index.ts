import { corsHeaders } from '../_shared/cors.ts';
import { chatJson } from '../_shared/openai.ts';

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

    const result = await chatJson([
      {
        role: 'system',
        content:
          'You label lost-and-found items. Return JSON only. No extra text.',
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text:
              'Identify the object. Respond with JSON: {"keywords": ["..."], "query": "..."}. keywords should be 3-6 short tags. query should be a concise search phrase.',
          },
          {
            type: 'image_url',
            image_url: { url: imageBase64 },
          },
        ],
      },
    ]);

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
