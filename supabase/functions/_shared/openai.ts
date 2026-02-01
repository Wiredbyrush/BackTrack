const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

if (!OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY');
}

const OPENAI_HEADERS = {
  Authorization: `Bearer ${OPENAI_API_KEY}`,
  'Content-Type': 'application/json',
};

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';

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

async function fetchResponses(body: Record<string, unknown>) {
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: OPENAI_HEADERS,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI responses failed: ${error}`);
  }

  return response.json();
}

export async function createEmbedding(input: string) {
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
  const payload = await fetchResponses({
    model: 'o1-pro',
    input: buildInput(messages),
    temperature,
  });

  const text = extractOutputText(payload);
  if (!text) {
    throw new Error('OpenAI responses returned empty response');
  }

  return text;
}

export async function labelImage(imageBase64: string) {
  const prompt =
    'Identify the object. Respond with JSON: {"keywords": ["..."], "query": "..."}. keywords should be 3-6 short tags. query should be a concise search phrase.';

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
  if (!content) {
    throw new Error('OpenAI image match returned empty response');
  }

  return JSON.parse(content);
}
