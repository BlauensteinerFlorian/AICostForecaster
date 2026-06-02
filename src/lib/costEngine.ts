import type { NormalizedModel } from './types';

export interface UseCase {
  name: string;
  /** Average input (prompt) tokens per request. */
  inputTokens: number;
  /** Average output (completion) tokens per request. */
  outputTokens: number;
  /** Expected number of requests per month. */
  requestsPerMonth: number;
}

export interface CostBreakdown {
  perRequestUsd: number;
  perMonthUsd: number;
  perYearUsd: number;
  perRequestEur: number;
  perMonthEur: number;
  perYearEur: number;
}

/** Cost of a single request in USD for a given model and token profile. */
export function costPerRequestUsd(
  model: Pick<NormalizedModel, 'inputPerMTok' | 'outputPerMTok'>,
  useCase: Pick<UseCase, 'inputTokens' | 'outputTokens'>,
): number {
  const input = (useCase.inputTokens / 1_000_000) * model.inputPerMTok;
  const output = (useCase.outputTokens / 1_000_000) * model.outputPerMTok;
  return input + output;
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
