export type EstimateMethod = 'tokenizer' | 'words' | 'chars';

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
 *   approximation for Claude/Gemini.
 * - `words`: words × 1.33 (rule of thumb).
 * - `chars`: characters ÷ 4 (rule of thumb).
 */
export function estimateTokens(text: string, method: EstimateMethod = 'tokenizer'): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  switch (method) {
    case 'tokenizer':
      if (encodeFn) {
        try {
          return encodeFn(text).length;
        } catch {
          return Math.ceil(text.length / 4);
        }
      }
      return Math.ceil(text.length / 4);
    case 'words':
      return Math.ceil(trimmed.split(/\s+/).length * 1.33);
    case 'chars':
      return Math.ceil(text.length / 4);
  }
}
