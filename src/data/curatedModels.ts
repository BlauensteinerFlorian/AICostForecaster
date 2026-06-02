import type { CuratedModel } from '../lib/types';

/**
 * Hand-picked headline models per provider (Big / Mid / Budget).
 *
 * At runtime these are resolved against the live OpenRouter catalogue by `id`;
 * the live price always wins. The `fallback` figures below are only used when
 * OpenRouter is unreachable, so the tool keeps working offline.
 *
 * IMPORTANT: fallback prices are reference values, not a live feed.
 * Source: OpenRouter model pages (https://openrouter.ai/models) and the
 * providers' own pricing pages. Keep `FALLBACK_PRICES_AS_OF` in sync when you
 * refresh these numbers.
 */
export const FALLBACK_PRICES_AS_OF = '2026-06-01';

export const CURATED_MODELS: CuratedModel[] = [
  // ── OpenAI ────────────────────────────────────────────────────────────────
  {
    id: 'openai/gpt-5.5',
    name: 'GPT-5.5',
    provider: 'OpenAI',
    tier: 'big',
    blurb: 'Flaggschiff für anspruchsvolle Reasoning- und Agent-Aufgaben.',
    fallback: { inputPerMTok: 1.25, outputPerMTok: 10, contextLength: 400_000 },
  },
  {
    id: 'openai/gpt-5.5-mini',
    name: 'GPT-5.5 Mini',
    provider: 'OpenAI',
    tier: 'mid',
    blurb: 'Ausgewogenes Preis-Leistungs-Verhältnis für die meisten Workloads.',
    fallback: { inputPerMTok: 0.25, outputPerMTok: 2, contextLength: 400_000 },
  },
  {
    id: 'openai/gpt-5.5-nano',
    name: 'GPT-5.5 Nano',
    provider: 'OpenAI',
    tier: 'budget',
    blurb: 'Günstigste Stufe für einfache, hochvolumige Aufgaben.',
    fallback: { inputPerMTok: 0.05, outputPerMTok: 0.4, contextLength: 400_000 },
  },

  // ── Anthropic ─────────────────────────────────────────────────────────────
  {
    id: 'anthropic/claude-opus-4.8',
    name: 'Claude Opus 4.8',
    provider: 'Anthropic',
    tier: 'big',
    blurb: 'Stärkstes Claude-Modell für komplexe, mehrstufige Aufgaben.',
    fallback: { inputPerMTok: 15, outputPerMTok: 75, contextLength: 200_000 },
  },
  {
    id: 'anthropic/claude-sonnet-4.6',
    name: 'Claude Sonnet 4.6',
    provider: 'Anthropic',
    tier: 'mid',
    blurb: 'Der Allrounder — stark bei Code und Alltagsaufgaben, fair bepreist.',
    fallback: { inputPerMTok: 3, outputPerMTok: 15, contextLength: 200_000 },
  },
  {
    id: 'anthropic/claude-haiku-4.5',
    name: 'Claude Haiku 4.5',
    provider: 'Anthropic',
    tier: 'budget',
    blurb: 'Schnell und günstig für hohe Volumina und kurze Antworten.',
    fallback: { inputPerMTok: 0.8, outputPerMTok: 4, contextLength: 200_000 },
  },

  // ── Google ────────────────────────────────────────────────────────────────
  {
    id: 'google/gemini-3.1-pro',
    name: 'Gemini 3.1 Pro',
    provider: 'Google',
    tier: 'big',
    blurb: 'Top-Modell mit sehr großem Kontextfenster (Multimodal).',
    fallback: { inputPerMTok: 1.25, outputPerMTok: 10, contextLength: 2_000_000 },
  },
  {
    id: 'google/gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    provider: 'Google',
    tier: 'mid',
    blurb: 'Schnell und kosteneffizient bei großem Kontext.',
    fallback: { inputPerMTok: 0.3, outputPerMTok: 2.5, contextLength: 1_000_000 },
  },
  {
    id: 'google/gemini-3.5-flash-lite',
    name: 'Gemini 3.5 Flash-Lite',
    provider: 'Google',
    tier: 'budget',
    blurb: 'Günstigste Gemini-Stufe für einfache, massenhafte Tasks.',
    fallback: { inputPerMTok: 0.1, outputPerMTok: 0.4, contextLength: 1_000_000 },
  },

  // ── Weitere Budget-Optionen ───────────────────────────────────────────────
  {
    id: 'deepseek/deepseek-chat-v3',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    tier: 'budget',
    blurb: 'Sehr günstiges Open-Weight-Modell mit starker Code-Leistung.',
    fallback: { inputPerMTok: 0.27, outputPerMTok: 1.1, contextLength: 128_000 },
  },
  {
    id: 'mistralai/mistral-large',
    name: 'Mistral Large',
    provider: 'Mistral',
    tier: 'mid',
    blurb: 'Europäisches Modell, solide Allround-Leistung.',
    fallback: { inputPerMTok: 2, outputPerMTok: 6, contextLength: 128_000 },
  },
];

/** Default selection shown on first load — one representative tier per big provider. */
export const DEFAULT_SELECTED_IDS = [
  'openai/gpt-5.5',
  'anthropic/claude-sonnet-4.6',
  'google/gemini-3.5-flash',
];
