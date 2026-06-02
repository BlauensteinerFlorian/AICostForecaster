import { FALLBACK_USD_TO_EUR } from '../lib/fx';
import { formatDate } from '../lib/format';
import { effectiveRate, useFxStore } from '../store/fxStore';
import { usePriceStore } from '../store/priceStore';
import { useUiStore } from '../store/uiStore';
import { InfoTooltip } from './ui/InfoTooltip';

export function Header() {
  const { theme, toggleTheme } = useUiStore();
  const priceStatus = usePriceStore((s) => s.status);
  const priceFetchedAt = usePriceStore((s) => s.fetchedAt);
  const reloadPrices = usePriceStore((s) => s.load);

  const fx = useFxStore();
  const rate = useFxStore(effectiveRate);

  const priceLabel =
    priceStatus === 'loading'
      ? 'lädt …'
      : priceFetchedAt
        ? formatDate(priceFetchedAt)
        : 'Fallback-Preise';

  return (
    <header className="border-b border-border bg-surface/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text">
            AI&nbsp;Cost&nbsp;<span className="text-primary">Forecaster</span>
          </h1>
          <p className="text-sm text-muted">
            Operative AI-Kosten je Use Case kalkulieren &amp; Business Cases bewerten.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Price source badge */}
          <button
            onClick={() => reloadPrices()}
            title="Preise neu von OpenRouter laden"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1.5 font-medium text-muted transition-colors hover:border-primary hover:text-text"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                priceStatus === 'success'
                  ? 'bg-success'
                  : priceStatus === 'error'
                    ? 'bg-danger'
                    : 'bg-warning'
              }`}
            />
            Preise: OpenRouter · {priceLabel} ↻
          </button>

          {/* FX rate + override */}
          <label className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1.5 font-medium text-muted">
            <span>USD→EUR</span>
            <input
              type="number"
              step="0.001"
              min="0"
              value={Number(rate.toFixed(4))}
              onChange={(e) => {
                const v = Number.parseFloat(e.target.value);
                fx.setOverride(Number.isFinite(v) ? v : null);
              }}
              className="w-16 rounded bg-surface px-1.5 py-0.5 text-right text-text outline-none focus:ring-1 focus:ring-primary"
              aria-label="Wechselkurs USD zu EUR"
            />
            {fx.override !== null ? (
              <button
                onClick={() => fx.setOverride(null)}
                className="text-primary hover:underline"
                title="Eigenen Kurs zurücksetzen und Live-Kurs verwenden"
              >
                Auto
              </button>
            ) : (
              <span className="text-muted">
                {fx.date ? `ECB ${fx.date}` : `Fallback ${FALLBACK_USD_TO_EUR}`}
              </span>
            )}
            <InfoTooltip text="Preise von OpenRouter sind in US-Dollar. Dieser Kurs (Quelle: Europäische Zentralbank via frankfurter.app) rechnet sie in Euro um. Du kannst ihn überschreiben." />
          </label>

          <button
            onClick={toggleTheme}
            className="rounded-full border border-border bg-surface-2 px-3 py-1.5 font-medium text-muted transition-colors hover:text-text"
            title="Hell/Dunkel umschalten"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  );
}
