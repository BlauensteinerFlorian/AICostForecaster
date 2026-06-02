import { useMemo, useState } from 'react';
import { CURATED_MODELS as CURATED } from '../data/curatedModels';
import { formatPerMTok, formatTokenCount } from '../lib/format';
import { resolveCurated } from '../lib/resolve';
import type { ModelTier, NormalizedModel } from '../lib/types';
import { usePriceStore } from '../store/priceStore';
import { useScenarioStore } from '../store/scenarioStore';
import { Section } from './ui/Section';

const TIER_LABEL: Record<ModelTier, string> = { big: 'Top', mid: 'Mittel', budget: 'Budget' };
const PROVIDER_ORDER = ['OpenAI', 'Anthropic', 'Google', 'DeepSeek', 'Mistral'];

function SourceBadge({ source }: { source: NormalizedModel['source'] }) {
  return source === 'openrouter' ? (
    <span className="rounded bg-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-success">
      live
    </span>
  ) : (
    <span
      className="rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold text-warning"
      title="Live-Preis nicht verfügbar — hinterlegter Referenzwert wird genutzt."
    >
      Fallback
    </span>
  );
}

function ModelCard({
  model,
  tier,
  blurb,
  selected,
  onToggle,
}: {
  model: NormalizedModel;
  tier?: ModelTier;
  blurb?: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={`flex flex-col gap-1.5 rounded-lg border p-3 text-left transition-colors ${
        selected
          ? 'border-primary bg-primary/10 ring-1 ring-primary'
          : 'border-border bg-surface-2 hover:border-primary/60'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-text">{model.name}</span>
        {tier && (
          <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-muted">
            {TIER_LABEL[tier]}
          </span>
        )}
      </div>
      {blurb && <p className="text-xs leading-snug text-muted">{blurb}</p>}
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-muted">
        <span title="Input-Preis je 1 Mio. Token">In {formatPerMTok(model.inputPerMTok)}</span>
        <span title="Output-Preis je 1 Mio. Token">Out {formatPerMTok(model.outputPerMTok)}</span>
        {model.contextLength && <span>· {formatTokenCount(model.contextLength)} ctx</span>}
        <SourceBadge source={model.source} />
      </div>
    </button>
  );
}

export function ModelPicker() {
  const liveModels = usePriceStore((s) => s.liveModels);
  const selectedIds = useScenarioStore((s) => s.selectedIds);
  const toggleModel = useScenarioStore((s) => s.toggleModel);
  const [query, setQuery] = useState('');

  const curated = useMemo(() => resolveCurated(liveModels), [liveModels]);
  const grouped = useMemo(() => {
    const byProvider = new Map<string, typeof curated>();
    for (const m of curated) {
      const list = byProvider.get(m.provider) ?? [];
      list.push(m);
      byProvider.set(m.provider, list);
    }
    return [...byProvider.entries()].sort(
      (a, b) => providerRank(a[0]) - providerRank(b[0]),
    );
  }, [curated]);

  const curatedTierById = useMemo(() => {
    const map = new Map<string, { tier: ModelTier; blurb: string }>();
    for (const c of CURATED) map.set(c.id, { tier: c.tier, blurb: c.blurb });
    return map;
  }, []);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return liveModels
      .filter((m) => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q))
      .slice(0, 24);
  }, [query, liveModels]);

  // Selected models that aren't part of the curated set — shown so they can be removed.
  const extraSelected = useMemo(() => {
    const curatedIds = new Set(curated.map((m) => m.id));
    const index = new Map(liveModels.map((m) => [m.id, m]));
    return selectedIds
      .filter((id) => !curatedIds.has(id))
      .map((id) => index.get(id))
      .filter((m): m is NormalizedModel => Boolean(m));
  }, [selectedIds, curated, liveModels]);

  return (
    <Section
      step={2}
      title="Modelle vergleichen"
      info="Wähle die Modelle, die du gegenüberstellen möchtest. Die bekanntesten Modelle je Anbieter sind nach Leistungsstufe (Top/Mittel/Budget) vorsortiert. Über die Suche erreichst du den gesamten OpenRouter-Katalog."
    >
      <div className="grid gap-5">
        {grouped.map(([provider, models]) => (
          <div key={provider}>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
              {provider}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {models
                .slice()
                .sort((a, b) => tierRank(curatedTierById.get(a.id)?.tier) - tierRank(curatedTierById.get(b.id)?.tier))
                .map((m) => (
                  <ModelCard
                    key={m.id}
                    model={m}
                    tier={curatedTierById.get(m.id)?.tier}
                    blurb={curatedTierById.get(m.id)?.blurb}
                    selected={selectedIds.includes(m.id)}
                    onToggle={() => toggleModel(m.id)}
                  />
                ))}
            </div>
          </div>
        ))}

        {/* Full catalogue search */}
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
            Gesamten Katalog durchsuchen
          </h3>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              liveModels.length
                ? `${liveModels.length} Modelle durchsuchen (Name oder ID) …`
                : 'Katalog wird geladen … (Fallback-Modelle sind oben verfügbar)'
            }
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-text outline-none focus:ring-1 focus:ring-primary"
          />

          {extraSelected.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {extraSelected.map((m) => (
                <button
                  key={m.id}
                  onClick={() => toggleModel(m.id)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary/10 px-2.5 py-1 text-xs text-text"
                  title="Aus dem Vergleich entfernen"
                >
                  {m.name} <span className="text-muted">✕</span>
                </button>
              ))}
            </div>
          )}

          {searchResults.length > 0 && (
            <ul className="mt-3 max-h-72 overflow-auto rounded-lg border border-border">
              {searchResults.map((m) => {
                const selected = selectedIds.includes(m.id);
                return (
                  <li key={m.id}>
                    <button
                      onClick={() => toggleModel(m.id)}
                      className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-surface-2 ${
                        selected ? 'bg-primary/10' : ''
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-text">{m.name}</span>
                        <span className="block truncate text-xs text-muted">{m.id}</span>
                      </span>
                      <span className="shrink-0 text-xs text-muted">
                        In {formatPerMTok(m.inputPerMTok)} · Out {formatPerMTok(m.outputPerMTok)}
                      </span>
                      <span className="shrink-0 text-primary">{selected ? '✓' : '+'}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Section>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────
function providerRank(p: string): number {
  const i = PROVIDER_ORDER.indexOf(p);
  return i === -1 ? PROVIDER_ORDER.length : i;
}
function tierRank(t?: ModelTier): number {
  return t === 'big' ? 0 : t === 'mid' ? 1 : t === 'budget' ? 2 : 3;
}
