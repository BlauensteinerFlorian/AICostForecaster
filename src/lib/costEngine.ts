import type { NormalizedModel } from './types';

export interface UseCase {
  name: string;
  /** Average input (prompt) tokens per request. */
  inputTokens: number;
  /** Average output (completion) tokens per request. */
  outputTokens: number;
  /** Expected number of requests per month. */
  requestsPerMonth: number;

  // ── Optional "real world" overhead. All default to a no-op when absent so
  //    older saved scenarios keep working unchanged. ───────────────────────────
  /** Fixed tokens added to the input on every model call: system prompt, tool
   *  definitions, few-shot examples, retrieved RAG context, etc. */
  systemOverheadTokens?: number;
  /** Model calls per request — agent steps, tool round-trips, retries. Default 1. */
  callsPerRequest?: number;
  /** Multiplier on output tokens for reasoning/"thinking" models (billed as
   *  output). 1 = none, e.g. 3 = three times the visible answer. Default 1. */
  reasoningFactor?: number;
  /** Safety margin in percent applied to the total (language/variance buffer). */
  bufferPct?: number;
}

/** Resolve the optional overhead fields to concrete, safe values. */
export function resolveOverhead(useCase: UseCase) {
  return {
    systemOverheadTokens: Math.max(0, useCase.systemOverheadTokens ?? 0),
    callsPerRequest: Math.max(1, useCase.callsPerRequest ?? 1),
    reasoningFactor: Math.max(1, useCase.reasoningFactor ?? 1),
    bufferPct: Math.max(0, useCase.bufferPct ?? 0),
  };
}

export interface CostBreakdown {
  perRequestUsd: number;
  perMonthUsd: number;
  perYearUsd: number;
  perRequestEur: number;
  perMonthEur: number;
  perYearEur: number;
}

/**
 * Cost of one full request in USD, including all real-world overhead:
 * system/tool tokens, multiple calls (agents/retries), reasoning output
 * multiplier and a safety buffer. A "request" is one use-case execution as
 * counted in `requestsPerMonth`; it may contain several model calls.
 */
export function costPerRequestUsd(
  model: Pick<NormalizedModel, 'inputPerMTok' | 'outputPerMTok'>,
  useCase: UseCase,
): number {
  const { systemOverheadTokens, callsPerRequest, reasoningFactor, bufferPct } =
    resolveOverhead(useCase);
  const effectiveInput = useCase.inputTokens + systemOverheadTokens;
  const effectiveOutput = useCase.outputTokens * reasoningFactor;
  const perCall =
    (effectiveInput / 1_000_000) * model.inputPerMTok +
    (effectiveOutput / 1_000_000) * model.outputPerMTok;
  return perCall * callsPerRequest * (1 + bufferPct / 100);
}

/** Full USD + EUR breakdown per request / month / year. */
export function computeCost(
  model: Pick<NormalizedModel, 'inputPerMTok' | 'outputPerMTok'>,
  useCase: UseCase,
  usdToEur: number,
): CostBreakdown {
  const perRequestUsd = costPerRequestUsd(model, useCase);
  const requests = Math.max(0, useCase.requestsPerMonth);
  const perMonthUsd = perRequestUsd * requests;
  const perYearUsd = perMonthUsd * 12;
  return {
    perRequestUsd,
    perMonthUsd,
    perYearUsd,
    perRequestEur: perRequestUsd * usdToEur,
    perMonthEur: perMonthUsd * usdToEur,
    perYearEur: perYearUsd * usdToEur,
  };
}

export interface BusinessCase {
  monthlyCostEur: number;
  monthlyBenefitEur: number;
  netMonthlyEur: number;
  netYearlyEur: number;
  /** Return on investment in % (net / cost). null when cost is 0. */
  roiPct: number | null;
  /** Whether the use case is profitable at the given volume. */
  profitable: boolean;
}

/**
 * Compare operating cost against an expected monthly benefit (e.g. saved
 * manual effort or added revenue) to judge whether a use case pays off.
 */
export function evaluateBusinessCase(
  monthlyCostEur: number,
  monthlyBenefitEur: number,
): BusinessCase {
  const netMonthlyEur = monthlyBenefitEur - monthlyCostEur;
  return {
    monthlyCostEur,
    monthlyBenefitEur,
    netMonthlyEur,
    netYearlyEur: netMonthlyEur * 12,
    roiPct: monthlyCostEur > 0 ? (netMonthlyEur / monthlyCostEur) * 100 : null,
    profitable: netMonthlyEur > 0,
  };
}
