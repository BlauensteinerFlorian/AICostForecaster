const FX_URL = 'https://api.frankfurter.app/latest?from=USD&to=EUR';

export interface FxResult {
  /** How many EUR one USD buys. */
  rate: number;
  /** Reference date of the ECB rate (YYYY-MM-DD). */
  date: string;
  fetchedAt: string;
}

interface FrankfurterResponse {
  date?: string;
  rates?: { EUR?: number };
}

/**
 * Fetch the latest USD→EUR rate. Data is sourced from the European Central Bank
 * via the free, CORS-enabled frankfurter.app API (no key required).
 */
export async function fetchUsdToEur(signal?: AbortSignal): Promise<FxResult> {
  const res = await fetch(FX_URL, { headers: { Accept: 'application/json' }, signal });
  if (!res.ok) {
    throw new Error(`Wechselkurs-API antwortete mit HTTP ${res.status}`);
  }
  const json = (await res.json()) as FrankfurterResponse;
  const rate = json.rates?.EUR;
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
    throw new Error('Kein gültiger EUR-Kurs in der Antwort');
  }
  return {
    rate,
    date: json.date ?? new Date().toISOString().slice(0, 10),
    fetchedAt: new Date().toISOString(),
  };
}

/** Sensible default if the FX API is unreachable. Editable in the UI. */
export const FALLBACK_USD_TO_EUR = 0.92;
