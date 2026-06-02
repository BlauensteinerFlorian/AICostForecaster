import { useMemo } from 'react';
import { computeCost, type CostBreakdown } from '../lib/costEngine';
import { buildModelIndex } from '../lib/resolve';
import type { NormalizedModel } from '../lib/types';
import { effectiveRate, useFxStore } from '../store/fxStore';
import { usePriceStore } from '../store/priceStore';
import { useScenarioStore } from '../store/scenarioStore';

export interface ModelResult {
  model: NormalizedModel;
  cost: CostBreakdown;
}

/** Resolve the current selection into priced, sorted results (cheapest first). */
export function useResults(): {
  results: ModelResult[];
  rate: number;
  usesFallback: boolean;
} {
  const liveModels = usePriceStore((s) => s.liveModels);
  const useCase = useScenarioStore((s) => s.useCase);
  const selectedIds = useScenarioStore((s) => s.selectedIds);
  const rate = useFxStore(effectiveRate);

  return useMemo(() => {
    const index = buildModelIndex(liveModels);
    const results: ModelResult[] = [];
    for (const id of selectedIds) {
      const model = index.get(id);
      if (!model) continue;
      results.push({ model, cost: computeCost(model, useCase, rate) });
    }
    results.sort((a, b) => a.cost.perMonthUsd - b.cost.perMonthUsd);
    return {
      results,
      rate,
      usesFallback: results.some((r) => r.model.source === 'fallback'),
    };
  }, [liveModels, selectedIds, useCase, rate]);
}
