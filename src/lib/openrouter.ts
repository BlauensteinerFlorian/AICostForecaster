import type { NormalizedModel } from './types';

const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models';

interface OpenRouterPricing {
  prompt?: string;
  completion?: string;
}

interface OpenRouterModel {
  id: string;
  name?: string;
  context_length?: number | null;
  pricing?: OpenRouterPricing;
}

/** Pretty provider label from an OpenRouter id like "openai/gpt-5.5" → "OpenAI". */
const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  'meta-llama': 'Meta',
  mistralai: 'Mistral',
  deepseek: 'DeepSeek',
  'x-ai': 'xAI',
  cohere: 'Cohere',
  qwen: 'Qwen',
};

export function providerFromId(id: string): string {
  const slug = id.split('/')[0] ?? '';
  return PROVIDER_LABELS[slug] ?? (slug ? slug[0].toUpperCase() + slug.slice(1) : 'Sonstige');
}

/** OpenRouter prices are USD per token (as strings). Convert to USD per 1M tokens. */
function perMillion(value: string | undefined): number | null {
  if (value === undefined) return null;
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return null;
  return n * 1_000_000;
}

export interface OpenRouterFetchResult {
  models: NormalizedModel[];
  fetchedAt: string;
}

/**
 * Fetch the public OpenRouter model catalogue and normalise it.
 * No API key required; the endpoint is CORS-enabled for browser use.
 * Models without usable prompt/completion pricing are skipped.
 */
export async function fetchOpenRouterModels(
  signal?: AbortSignal,
): Promise<OpenRouterFetchResult> {
  const res = await fetch(OPENROUTER_MODELS_URL, {
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!res.ok) {
    throw new Error(`OpenRouter antwortete mit HTTP ${res.status}`);
  }
  const json: unknown = await res.json();
  const data = (json as { data?: OpenRouterModel[] }).data;
  if (!Array.isArray(data)) {
    throw new Error('Unerwartetes Antwortformat von OpenRouter');
  }

  const models: NormalizedModel[] = [];
  for (const m of data) {
    if (!m?.id) continue;
    const inputPerMTok = perMillion(m.pricing?.prompt);
    const outputPerMTok = perMillion(m.pricing?.completion);
    // Skip models we cannot price (e.g. pricing missing or both zero/non-numeric).
    if (inputPerMTok === null || outputPerMTok === null) continue;
    models.push({
      id: m.id,
      name: m.name ?? m.id,
      provider: providerFromId(m.id),
      inputPerMTok,
      outputPerMTok,
      contextLength: m.context_length ?? null,
      source: 'openrouter',
    });
  }
  return { models, fetchedAt: new Date().toISOString() };
}
