import { CURATED_MODELS } from '../data/curatedModels';
import type { CuratedModel, NormalizedModel } from './types';

/** Turn a curated entry into a NormalizedModel using its built-in fallback prices. */
function fromFallback(c: CuratedModel): NormalizedModel {
  return {
    id: c.id,
    name: c.name,
    provider: c.provider,
    inputPerMTok: c.fallback.inputPerMTok,
    outputPerMTok: c.fallback.outputPerMTok,
    contextLength: c.fallback.contextLength,
    source: 'fallback',
  };
}

/**
 * Resolve all curated headline models against the live catalogue.
 * Live prices win; missing models fall back to the bundled reference prices.
 * Keeps the curated display name (cleaner than OpenRouter's raw names).
 */
export function resolveCurated(liveModels: NormalizedModel[]): NormalizedModel[] {
  const liveById = new Map(liveModels.map((m) => [m.id, m]));
  return CURATED_MODELS.map((c) => {
    const live = liveById.get(c.id);
    if (live) return { ...live, name: c.name, provider: c.provider };
    return fromFallback(c);
  });
}

/**
 * Build a lookup that resolves any selected id (curated or arbitrary live id)
 * to a concrete model. Used to turn the user's selection into priceable models.
 */
export function buildModelIndex(liveModels: NormalizedModel[]): Map<string, NormalizedModel> {
  const index = new Map<string, NormalizedModel>();
  for (const m of liveModels) index.set(m.id, m);
  // Curated fallbacks fill any gaps (e.g. when offline).
  for (const m of resolveCurated(liveModels)) index.set(m.id, m);
  return index;
}
