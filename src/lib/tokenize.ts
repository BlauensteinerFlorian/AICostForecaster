export type EstimateMethod = 'tokenizer' | 'words' | 'chars';

/** Language affects the rule-of-thumb heuristics (German tokenizes into more tokens). */
export type EstimateLang = 'de' | 'en';

// Heuristic factors. German compound words split into more BPE tokens than English,
// so the per-word / per-char ratios differ noticeably. The exact `tokenizer` mode
// does not need these — it encodes the real text.
const WORDS_PER_TOKEN_FACTOR: Record<EstimateLang, number> = { en: 1.33, de: 1.8 };
const CHARS_PER_TOKEN: Record<EstimateLang, number> = { en: 4, de: 3 };

// The BPE tokenizer ships a large vocabulary, so it is loaded lazily (only when
// the user actually opens the token estimator) to keep the initial bundle small.
let encodeFn: ((text: string) => number[]) | null = null;
let loadingPromise: Promise<void> | null = null;

/** Kick off (and cache) the dynamic import of the tokenizer. */
export function loadTokenizer(): Promise<void> {
  if (encodeFn) return Promise.resolve();
  if (!loadingPromise) {
    loadingPromise = import('gpt-tokenizer')
      .then((mod) => {
        encodeFn = mod.encode;
      })
      .catch(() => {
        // Leave encodeFn null — estimateTokens falls back to the char heuristic.
      });
  }
  return loadingPromise;
}

export function isTokenizerReady(): boolean {
  return encodeFn !== null;
}

/**
 * Estimate the token count of a piece of text.
 *
 * - `tokenizer`: BPE tokenizer (OpenAI cl100k_base) once loaded; falls back to
 *   the char heuristic until then. Accurate for GPT-style models and a close
 *   approximation for Claude/Gemini. Reflects German's higher token count
 *   automatically because it encodes the real text.
 * - `words`: words × factor (English ~1.33, German ~1.8).
 * - `chars`: characters ÷ factor (English ~4, German ~3).
 */
export function estimateTokens(
  text: string,
  method: EstimateMethod = 'tokenizer',
  lang: EstimateLang = 'de',
): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  switch (method) {
    case 'tokenizer':
      if (encodeFn) {
        try {
          return encodeFn(text).length;
        } catch {
          return Math.ceil(text.length / CHARS_PER_TOKEN[lang]);
        }
      }
      return Math.ceil(text.length / CHARS_PER_TOKEN[lang]);
    case 'words':
      return Math.ceil(trimmed.split(/\s+/).length * WORDS_PER_TOKEN_FACTOR[lang]);
    case 'chars':
      return Math.ceil(text.length / CHARS_PER_TOKEN[lang]);
  }
}
