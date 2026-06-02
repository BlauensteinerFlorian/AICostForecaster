import { FALLBACK_PRICES_AS_OF } from '../data/curatedModels';
import { formatDate } from '../lib/format';
import { useFxStore } from '../store/fxStore';
import { usePriceStore } from '../store/priceStore';

export function SourcesFooter() {
  const priceFetchedAt = usePriceStore((s) => s.fetchedAt);
  const priceError = usePriceStore((s) => s.error);
  const fxDate = useFxStore((s) => s.date);

  return (
    <footer className="mt-10 border-t border-border bg-surface/50">
      <div className="mx-auto max-w-6xl px-4 py-6 text-xs leading-relaxed text-muted">
        <h2 className="mb-2 text-sm font-semibold text-text">Quellen &amp; Hinweise</h2>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          <li>
            <strong className="text-text">Modellpreise:</strong>{' '}
            <a
              href="https://openrouter.ai/models"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              OpenRouter
            </a>{' '}
            (Live-API){priceFetchedAt ? `, zuletzt geladen ${formatDate(priceFetchedAt)}` : ''}.
            {priceError && (
              <span className="text-warning">
                {' '}
                Live-Abruf fehlgeschlagen ({priceError}) — es werden hinterlegte Referenzpreise
                (Stand {FALLBACK_PRICES_AS_OF}) genutzt.
              </span>
            )}
          </li>
          <li>
            <strong className="text-text">Wechselkurs USD→EUR:</strong> Europäische Zentralbank via{' '}
            <a
              href="https://www.frankfurter.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              frankfurter.app
            </a>
            {fxDate ? `, Referenztag ${fxDate}` : ''}.
          </li>
          <li>
            <strong className="text-text">Token-Schätzung:</strong> BPE-Tokenizer (OpenAI
            cl100k_base) bzw. Heuristiken; je Anbieter eine Näherung.
          </li>
          <li>
            <strong className="text-text">Fallback-Referenzpreise:</strong> Anbieter-Preisseiten,
            Stand {FALLBACK_PRICES_AS_OF}.
          </li>
        </ul>
        <p className="mt-3">
          Alle Werte sind Richtwerte zur Kostenabschätzung der <em>operativen</em> Nutzung und keine
          Echtzeit-Garantie. Maßgeblich ist stets die offizielle Abrechnung des jeweiligen
          Anbieters. Initiale Entwicklungs- und Setup-Kosten werden bewusst nicht berücksichtigt.
        </p>
      </div>
    </footer>
  );
}
