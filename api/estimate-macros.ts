const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';

type AnthropicResponse = {
  content?: Array<{ type: string; text?: string }>;
};

async function callAnthropic(body: Record<string, unknown>): Promise<string> {
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}`);
  const data = (await res.json()) as AnthropicResponse;
  const text = data.content?.find(c => c.type === 'text')?.text ?? '';
  return text.trim();
}

function stripFences(text: string): string {
  return text
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    const { ingredients } = (req.body ?? {}) as { ingredients?: string };
    if (!ingredients || typeof ingredients !== 'string' || ingredients.trim().length === 0) {
      res.status(400).json({ error: 'Please enter food ingredients only.' });
      return;
    }

    const validation = await callAnthropic({
      model: MODEL,
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `Does this input describe food ingredients or a meal? Reply only YES or NO: ${ingredients}`,
        },
      ],
    });

    if (!/^\s*YES\b/i.test(validation)) {
      res.status(400).json({ error: 'Please enter food ingredients only.' });
      return;
    }

    const raw = await callAnthropic({
      model: MODEL,
      max_tokens: 256,
      system:
        'You are a nutritionist. The user will describe meal ingredients in any format — vague (half a cup of rice, 2 cups of steak) or specific (250g white rice, 355g tri tip). Estimate the total nutritional values for the full meal combined. Return ONLY a raw JSON object with no markdown, no backticks, no explanation. The object must have exactly these integer keys: calories, protein, carbs, fats.',
      messages: [{ role: 'user', content: ingredients }],
    });

    const parsed = JSON.parse(stripFences(raw));
    res.status(200).json(parsed);
  } catch {
    res.status(500).json({ error: 'Estimation failed.' });
  }
}
