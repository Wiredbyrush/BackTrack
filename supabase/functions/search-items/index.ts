import { corsHeaders } from '../_shared/cors.ts';
import { createEmbedding } from '../_shared/openai.ts';
import { supabase } from '../_shared/supabaseClient.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query, filters = {} } = await req.json();

    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing query' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const embedding = await createEmbedding(query);
    if (!embedding) {
      return new Response(JSON.stringify({ error: 'Embedding failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabase.rpc('search_items', {
      query_embedding: embedding,
      match_count: 40,
      filter_category:
        Array.isArray(filters.category) && filters.category.length > 0
          ? filters.category
          : null,
      filter_location:
        typeof filters.location === 'string' && filters.location.length > 0
          ? filters.location
          : null,
      filter_start_date: filters.startDate || null,
      filter_end_date: filters.endDate || null,
      filter_status:
        Array.isArray(filters.status) && filters.status.length > 0
          ? filters.status
          : null,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ items: data || [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
