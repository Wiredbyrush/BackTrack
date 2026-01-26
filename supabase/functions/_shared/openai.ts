const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

const OPENAI_HEADERS = OPENAI_API_KEY
  ? {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    }
  : null;

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

let geminiModelCache: string[] | null = null;

async function loadGeminiModels() {
  if (geminiModelCache) {
    return geminiModelCache;
  }

  const fallback = ['gemini-1.5-flash', 'gemini-1.5-pro'];

  if (!GEMINI_API_KEY) {
    geminiModelCache = fallback;
    return geminiModelCache;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`,
    );

    if (!response.ok) {
      geminiModelCache = fallback;
      return geminiModelCache;
    }

    const payload = await response.json();
    const models = Array.isArray(payload.models) ? payload.models : [];
    geminiModelCache = models
      .filter((model) => model.supportedGenerationMethods?.includes('generateContent'))
      .map((model) => {
        const name = typeof model.name === 'string' ? model.name : '';
        return name.startsWith('models/') ? name.slice('models/'.length) : name;
      })
      .filter(Boolean);

    if (geminiModelCache.length === 0) {
      geminiModelCache = fallback;
    }
  } catch {
    geminiModelCache = fallback;
  }

  return geminiModelCache;
}

async function pickGeminiModel(preferred: string[]) {
  const available = await loadGeminiModels();
  const match = preferred.find((model) => available.includes(model));
  return match || available[0];
}

async function fetchGeminiContent(
  preferredModels: string[],
  body: Record<string, unknown>,
) {
  const model = await pickGeminiModel(preferredModels);
  const response = await fetch(
    `${GEMINI_BASE}/${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini chat failed: ${error}`);
  }

  return response;
}

function getImagePayload(imageBase64: string) {
  if (imageBase64.startsWith('data:')) {
    const [header, data] = imageBase64.split(',', 2);
    const match = header.match(/data:(.*);base64/);
    return {
      mimeType: match?.[1] || 'image/png',
      data,
    };
  }
  return {
    mimeType: 'image/png',
    data: imageBase64,
  };
}

export async function createEmbedding(input: string) {
  if (GEMINI_API_KEY) {
    const response = await fetch(
      `${GEMINI_BASE}/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: {
            parts: [{ text: input }],
          },
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini embeddings failed: ${error}`);
    }

    const payload = await response.json();
    return payload.embedding?.values;
  }

  if (!OPENAI_HEADERS) {
    throw new Error('Missing GEMINI_API_KEY or OPENAI_API_KEY');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: OPENAI_HEADERS,
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI embeddings failed: ${error}`);
  }

  const payload = await response.json();
  return payload.data?.[0]?.embedding;
}

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export async function chatText(messages: ChatMessage[], temperature = 0.3) {
  if (GEMINI_API_KEY) {
    const systemMessage = messages.find((msg) => msg.role === 'system')?.content;
    const contents = messages
      .filter((msg) => msg.role !== 'system')
      .map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

    const response = await fetchGeminiContent(
      ['gemini-1.5-flash', 'gemini-1.5-pro'],
      {
        systemInstruction: systemMessage
          ? { parts: [{ text: systemMessage }] }
          : undefined,
        contents,
        generationConfig: { temperature },
      },
    );

    const payload = await response.json();
    return payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  }

  if (!OPENAI_HEADERS) {
    throw new Error('Missing GEMINI_API_KEY or OPENAI_API_KEY');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: OPENAI_HEADERS,
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI chat failed: ${error}`);
  }

  const payload = await response.json();
  return payload.choices?.[0]?.message?.content?.trim() || '';
}

export async function labelImage(imageBase64: string) {
  const prompt =
    'Identify the object. Respond with JSON: {"keywords": ["..."], "query": "..."}. keywords should be 3-6 short tags. query should be a concise search phrase.';

  if (GEMINI_API_KEY) {
    const image = getImagePayload(imageBase64);
    const response = await fetchGeminiContent(
      ['gemini-1.5-flash', 'gemini-1.5-pro'],
      {
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: image.mimeType,
                  data: image.data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.2,
        },
      },
    );

    const payload = await response.json();
    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Gemini returned empty response');
    }
    return JSON.parse(text);
  }

  if (!OPENAI_HEADERS) {
    throw new Error('Missing GEMINI_API_KEY or OPENAI_API_KEY');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: OPENAI_HEADERS,
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You label lost-and-found items. Return JSON only. No extra text.',
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

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI image match failed: ${error}`);
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI image match returned empty response');
  }

  return JSON.parse(content);
}
