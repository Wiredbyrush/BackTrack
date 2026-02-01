const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

const OPENAI_HEADERS = OPENAI_API_KEY
  ? {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    }
  : null;

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

let geminiModelCache: string[] | null = null;

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

function buildInput(messages: ChatMessage[]) {
  return messages.map((msg) => ({
    role: msg.role,
    content: [{ type: 'input_text', text: msg.content }],
  }));
}

function ensureDataUrl(imageBase64: string) {
  if (imageBase64.startsWith('data:')) {
    return imageBase64;
  }
  return `data:image/png;base64,${imageBase64}`;
}

function extractOutputText(payload: any) {
  const output = Array.isArray(payload?.output) ? payload.output : [];
  const parts: string[] = [];

  for (const item of output) {
    if (!item || item.type !== 'message') {
      continue;
    }
    const content = Array.isArray(item.content) ? item.content : [];
    for (const part of content) {
      if (part?.type === 'output_text' && typeof part.text === 'string') {
        parts.push(part.text);
      }
    }
  }

  return parts.join('').trim();
}

function shouldFallbackToGemini(error: unknown) {
  if (!error) {
    return false;
  }

  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  return (
    message.includes('insufficient_quota') ||
    message.includes('quota') ||
    message.includes('rate limit') ||
    message.includes('billing') ||
    message.includes('(402)') ||
    message.includes('(429)')
  );
}

async function loadGeminiModels() {
  if (geminiModelCache) {
    return geminiModelCache;
  }

  const fallback = ['gemini-2.5-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'];

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
      .filter((model) =>
        model.supportedGenerationMethods?.includes('generateContent'),
      )
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
  if (!GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY');
  }

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

  return response.json();
}

async function fetchResponses(body: Record<string, unknown>) {
  if (!OPENAI_HEADERS) {
    throw new Error('Missing OPENAI_API_KEY');
  }

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: OPENAI_HEADERS,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI responses failed (${response.status}): ${error}`);
  }

  return response.json();
}

export async function createEmbedding(input: string) {
  if (!OPENAI_HEADERS && !GEMINI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY or GEMINI_API_KEY');
  }

  if (!OPENAI_HEADERS && GEMINI_API_KEY) {
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

export async function chatText(messages: ChatMessage[], temperature = 0.3) {
  if (!OPENAI_HEADERS && !GEMINI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY or GEMINI_API_KEY');
  }

  if (OPENAI_HEADERS) {
    try {
      const payload = await fetchResponses({
        model: 'o1-pro',
        input: buildInput(messages),
        temperature,
      });

      const text = extractOutputText(payload);
      if (text) {
        return text;
      }
      throw new Error('OpenAI responses returned empty response');
    } catch (error) {
      if (!GEMINI_API_KEY || !shouldFallbackToGemini(error)) {
        throw error;
      }
    }
  }

  const systemMessage = messages.find((msg) => msg.role === 'system')?.content;
  const contents = messages
    .filter((msg) => msg.role !== 'system')
    .map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

  const payload = await fetchGeminiContent(
    ['gemini-2.5-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    {
      systemInstruction: systemMessage
        ? { parts: [{ text: systemMessage }] }
        : undefined,
      contents,
      generationConfig: { temperature },
    },
  );

  return payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
}

export async function labelImage(imageBase64: string) {
  const prompt =
    'Identify the object. Respond with JSON: {"keywords": ["..."], "query": "..."}. keywords should be 3-6 short tags. query should be a concise search phrase.';
  if (!OPENAI_HEADERS && !GEMINI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY or GEMINI_API_KEY');
  }

  if (OPENAI_HEADERS) {
    try {
      const payload = await fetchResponses({
        model: 'o1-pro',
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text: 'You label lost-and-found items. Return JSON only. No extra text.',
              },
            ],
          },
          {
            role: 'user',
            content: [
              { type: 'input_text', text: prompt },
              { type: 'input_image', image_url: ensureDataUrl(imageBase64) },
            ],
          },
        ],
        text: { format: { type: 'json_object' } },
        temperature: 0.2,
      });

      const content = extractOutputText(payload);
      if (content) {
        return JSON.parse(content);
      }
      throw new Error('OpenAI image match returned empty response');
    } catch (error) {
      if (!GEMINI_API_KEY || !shouldFallbackToGemini(error)) {
        throw error;
      }
    }
  }

  const payload = await fetchGeminiContent(
    ['gemini-2.5-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    {
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inline_data: (() => {
                const dataUrl = ensureDataUrl(imageBase64);
                const [header, data] = dataUrl.split(',', 2);
                const match = header.match(/data:(.*);base64/);
                return {
                  mime_type: match?.[1] || 'image/png',
                  data,
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
    },
  );

  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini returned empty response');
  }
  return JSON.parse(text);
}
