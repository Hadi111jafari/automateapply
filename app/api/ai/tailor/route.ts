import { z } from 'zod';
import { requireUser } from '@/lib/api-auth';

const schema = z.object({
  resume: z.string().trim().min(40).max(80_000),
  jobTitle: z.string().trim().min(1).max(180),
  company: z.string().trim().min(1).max(180),
  jobDescription: z.string().trim().max(25_000).default(''),
  instruction: z.string().trim().max(2_000).default(''),
});

type Provider = { name: string; baseUrl?: string; apiKey?: string; model: string };
const providers: Provider[] = [
  {
    name: 'OpenRouter',
    baseUrl: process.env.AI_BASE_URL ?? process.env.OPENROUTER_BASE_URL,
    apiKey: process.env.AI_API_KEY ?? process.env.OPENROUTER_API_KEY,
    model: process.env.AI_MODEL ?? process.env.OPENROUTER_MODEL ?? 'dots-studio/dots-3-note-preview:free',
  },
  {
    name: 'Together',
    baseUrl: process.env.TOGETHER_BASE_URL,
    apiKey: process.env.TOGETHER_API_KEY,
    model:
      process.env.TOGETHER_MODEL ??
      'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
  },
].filter((provider) => provider.baseUrl && provider.apiKey);

const outputSchema = z.object({
  resume: z.string().min(1),
  coverLetter: z.string().min(1),
  note: z.string().default('Tailored from your source resume.'),
});

function parseOutput(content: string) {
  const clean = content.replace(/^```json\s*|\s*```$/g, '');
  const json = clean.match(/\{[\s\S]*\}/)?.[0] ?? clean;
  return outputSchema.safeParse(JSON.parse(json));
}

// Direct connections from this runtime intermittently fail with ETIMEDOUT
// before reaching the provider, so every outbound call gets one retry.
async function postJsonWithRetry(url: string, init: RequestInit) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await fetch(url, { ...init, signal: AbortSignal.timeout(90_000) });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error('Provider could not be reached.');
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ('error' in auth) return Response.json(auth, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return Response.json(
      {
        error: parsed.error.issues[0]?.message ?? 'Invalid tailoring request.',
      },
      { status: 400 },
    );
  if (!providers.length)
    return Response.json(
      {
        error:
          'No OpenAI-compatible AI provider is configured. Add OPENROUTER_API_KEY (or AI_BASE_URL, AI_API_KEY, AI_MODEL).',
      },
      { status: 503 },
    );
  const input = parsed.data;
  const prompt = `Rewrite only using facts in this resume. Never invent employers, dates, metrics, skills, or education. Return JSON with exactly resume, coverLetter, and note strings.\n\nRole: ${input.jobTitle} at ${input.company}\nJob context: ${input.jobDescription}\nUser request: ${input.instruction}\n\nResume:\n${input.resume}`;
  let lastError = 'AI providers are temporarily unavailable.';
  const providerErrors: string[] = [];
  for (const provider of providers) {
    try {
      console.info('[ai-tailor] requesting OpenAI-compatible provider', { provider: provider.name, baseUrl: provider.baseUrl, model: provider.model, hasKey: Boolean(provider.apiKey) });
      const response = await postJsonWithRetry(
        `${provider.baseUrl!.replace(/\/$/, '')}/chat/completions`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: provider.model,
            temperature: 0.2,
            messages: [
              {
                role: 'system',
                content:
                  'You are a careful resume editor. Output valid JSON only.',
              },
              { role: 'user', content: prompt },
            ],
          }),
        },
      );
      if (!response.ok) {
        lastError = `${provider.name} returned ${response.status} for model ${provider.model}.`;
        providerErrors.push(lastError);
        console.warn('[ai-tailor] provider rejected request', { provider: provider.name, model: provider.model, status: response.status, statusText: response.statusText });
        continue;
      }
      const body = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = body.choices?.[0]?.message?.content;
      if (!content) throw new Error('No AI response.');
      const result = parseOutput(content);
      if (!result.success) throw new Error('AI returned an unexpected format.');
      return Response.json(result.data);
    } catch (error) {
      lastError = error instanceof Error ? error.message : lastError;
      providerErrors.push(`${provider.name}: ${lastError}`);
      console.warn('[ai-tailor] provider request failed', { provider: provider.name, model: provider.model, error: lastError });
    }
  }
  // Gemini uses a different API shape than OpenAI-compatible providers. It is
  // intentionally last so an OpenRouter/Together user keeps their preference.
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_BASE_URL) {
    try {
      const model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
      const response = await postJsonWithRetry(`${process.env.GEMINI_BASE_URL.replace(/\/$/, '')}/v1beta/models/${model}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: 'You are a careful resume editor. Output valid JSON only.' }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
        }),
      });
      if (!response.ok) {
        lastError = `Gemini returned ${response.status} for model ${model}.`;
        providerErrors.push(lastError);
        console.warn('[ai-tailor] Gemini rejected request', { model, status: response.status, statusText: response.statusText });
      } else {
      const body = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      const content = body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('');
      if (!content) throw new Error('Gemini returned no content.');
      const result = parseOutput(content);
      if (!result.success) throw new Error('Gemini returned an unexpected format.');
      return Response.json(result.data);
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : lastError;
      providerErrors.push(`Gemini: ${lastError}`);
      console.warn('[ai-tailor] Gemini request failed', { error: lastError });
    }
  }
  return Response.json({ error: providerErrors.join(' ') || lastError }, { status: 502 });
}
