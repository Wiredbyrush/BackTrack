import { corsHeaders } from '../_shared/cors.ts';
import { chatJson, createEmbedding } from '../_shared/openai.ts';
import { supabase } from '../_shared/supabaseClient.ts';

function buildEmbeddingText(item: Record<string, unknown>, tags: string[], caption: string) {
  const parts = [
    item.name,
    item.description,
    item.category,
    item.location,
    caption,
    tags.join(' '),
  ]
    .filter((value) => typeof value === 'string' && value.trim().length > 0)
    .map((value) => value.trim());

  return parts.join(' | ');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { item } = await req.json();

    if (!item || typeof item !== 'object') {
      return new Response(JSON.stringify({ error: 'Missing item' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const imageUrl = typeof item.image_url === 'string' ? item.image_url : '';
    let tags: string[] = [];
    let caption = '';

    if (imageUrl) {
      const analysis = await chatJson([
        {
          role: 'system',
          content: 'You label lost-and-found items. Return JSON only. No extra text.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                'Describe the item and give tags. Respond with JSON: {"caption": "...", "tags": ["..."]}. tags should be 4-8 short nouns.',
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
          ],
        },
      ]);

      if (analysis) {
        tags = Array.isArray(analysis.tags) ? analysis.tags : [];
        caption = typeof analysis.caption === 'string' ? analysis.caption : '';
      }
    }

    const embeddingText = buildEmbeddingText(item, tags, caption);
    const embedding = embeddingText ? await createEmbedding(embeddingText) : null;

    const insertPayload = {
      ...item,
      ai_tags: tags,
      ai_caption: caption,
      embedding,
    };

    const { data, error } = await supabase
      .from('items')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ item: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
