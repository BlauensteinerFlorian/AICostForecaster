const eur = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const eurPrecise = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});
const usd = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' });
const num = new Intl.NumberFormat('de-DE');

/** EUR with 2 decimals — for monthly/yearly totals. */
export function formatEur(value: number): string {
  return eur.format(value);
}

/** EUR with 4 decimals — for tiny per-request amounts. */
export function formatEurPrecise(value: number): string {
  return eurPrecise.format(value);
}

export function formatUsd(value: number): string {
  return usd.format(value);
}

export function formatNumber(value: number): string {
  return num.format(value);
}

/** Price per 1M tokens, e.g. "$3.00 / 1M". */
export function formatPerMTok(value: number): string {
  return `${usd.format(value)} / 1M`;
}

/** Compact integer like "1.234" or "1,2 Mio." for big token counts. */
export function formatTokenCount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} Mio.`;
  }
  return num.format(value);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });
}
