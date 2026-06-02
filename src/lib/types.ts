/** Where a model's price figures came from — surfaced in the UI for transparency. */
export type PriceSource = 'openrouter' | 'fallback';

export type ModelTier = 'big' | 'mid' | 'budget';

/** A model with prices normalised to USD per 1,000,000 tokens. */
export interface NormalizedModel {
  /** OpenRouter model id, e.g. "openai/gpt-5.5". */
  id: string;
  name: string;
  provider: string;
  /** USD per 1M input (prompt) tokens. */
  inputPerMTok: number;
  /** USD per 1M output (completion) tokens. */
  outputPerMTok: number;
  /** Maximum context window in tokens, if known. */
  contextLength: number | null;
  source: PriceSource;
}

/** A hand-picked headline model with a built-in price fallback. */
export interface CuratedModel {
  id: string;
  name: string;
  provider: string;
  tier: ModelTier;
  /** Short note shown to the user (positioning of this tier). */
  blurb: string;
  fallback: {
    inputPerMTok: number;
    outputPerMTok: number;
    contextLength: number | null;
  };
}
