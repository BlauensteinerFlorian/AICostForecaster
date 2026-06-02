import { useEffect, useState } from 'react';
import { formatTokenCount } from '../lib/format';
import { estimateTokens, loadTokenizer, type EstimateMethod } from '../lib/tokenize';
import { useScenarioStore } from '../store/scenarioStore';
import { InfoTooltip } from './ui/InfoTooltip';
import { Section } from './ui/Section';

function NumberField({
  label,
  value,
  onChange,
  info,
  suffix,
  min = 0,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  info?: string;
  suffix?: string;
  min?: number;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="flex items-center gap-1.5 text-sm font-medium text-muted">
        {label}
        {info && <InfoTooltip text={info} />}
      </span>
      <span className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 focus-within:ring-1 focus-within:ring-primary">
        <input
          type="number"
          min={min}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => {
            const v = Number.parseFloat(e.target.value);
            onChange(Number.isFinite(v) ? Math.max(min, v) : 0);
          }}
          className="w-full bg-transparent py-2 text-text outline-none"
        />
        {suffix && <span className="shrink-0 text-xs text-muted">{suffix}</span>}
      </span>
    </label>
  );
}

const METHOD_LABELS: Record<EstimateMethod, string> = {
  tokenizer: 'Tokenizer (genau)',
  words: 'Wörter × 1,33',
  chars: 'Zeichen ÷ 4',
};

function TokenEstimator({ onApply }: { onApply: (target: 'input' | 'output', tokens: number) => void }) {
  const [text, setText] = useState('');
  const [method, setMethod] = useState<EstimateMethod>('tokenizer');
  // Track tokenizer readiness so the count refreshes once the lazy chunk loads.
  const [tokenizerReady, setTokenizerReady] = useState(false);

  useEffect(() => {
    if (method === 'tokenizer' && !tokenizerReady) {
      void loadTokenizer().then(() => setTokenizerReady(true));
    }
  }, [method, tokenizerReady]);

  // Setting tokenizerReady re-renders, so the estimate recomputes after lazy load.
  const tokens = estimateTokens(text, method);

  return (
    <div className="rounded-lg border border-dashed border-border bg-surface-2/50 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-muted">
        Token aus Beispieltext schätzen
        <InfoTooltip text="Füge einen typischen Prompt oder eine typische Antwort ein, um die Tokenanzahl zu schätzen. Der Tokenizer ist auf OpenAI-Modelle geeicht und für Claude/Gemini eine gute Näherung." />
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Beispiel-Prompt oder -Antwort einfügen …"
        className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:ring-1 focus:ring-primary"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as EstimateMethod)}
          className="rounded-lg border border-border bg-surface px-2 py-1.5 text-text outline-none focus:ring-1 focus:ring-primary"
        >
          {(Object.keys(METHOD_LABELS) as EstimateMethod[]).map((m) => (
            <option key={m} value={m}>
              {METHOD_LABELS[m]}
            </option>
          ))}
        </select>
        <span className="font-semibold text-text">≈ {formatTokenCount(tokens)} Token</span>
        <span className="flex-1" />
        <button
          type="button"
          disabled={!tokens}
          onClick={() => onApply('input', tokens)}
          className="rounded-lg border border-border px-2.5 py-1.5 font-medium text-text transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
        >
          → als Input
        </button>
        <button
          type="button"
          disabled={!tokens}
          onClick={() => onApply('output', tokens)}
          className="rounded-lg border border-border px-2.5 py-1.5 font-medium text-text transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
        >
          → als Output
        </button>
      </div>
    </div>
  );
}

export function UseCaseEditor() {
  const useCase = useScenarioStore((s) => s.useCase);
  const setUseCase = useScenarioStore((s) => s.setUseCase);
  const [showEstimator, setShowEstimator] = useState(false);

  return (
    <Section
      step={1}
      title="Use Case definieren"
      info="Ein Request ist ein einzelner Modellaufruf. Gib die durchschnittlichen Token pro Request und das erwartete Monatsvolumen an."
    >
      <div className="grid gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-muted">Bezeichnung</span>
          <input
            type="text"
            value={useCase.name}
            onChange={(e) => setUseCase({ name: e.target.value })}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-text outline-none focus:ring-1 focus:ring-primary"
            placeholder="z. B. Support-Chatbot"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField
            label="Input-Token / Request"
            value={useCase.inputTokens}
            onChange={(v) => setUseCase({ inputTokens: v })}
            info="Token im Prompt (System + Nutzer + Kontext), die an das Modell geschickt werden. 1 Token ≈ 4 Zeichen bzw. ≈ ¾ Wort."
          />
          <NumberField
            label="Output-Token / Request"
            value={useCase.outputTokens}
            onChange={(v) => setUseCase({ outputTokens: v })}
            info="Token in der Antwort des Modells. Output-Token sind bei den meisten Anbietern deutlich teurer als Input-Token."
          />
          <NumberField
            label="Requests / Monat"
            value={useCase.requestsPerMonth}
            onChange={(v) => setUseCase({ requestsPerMonth: v })}
            info="Wie oft dieser Use Case pro Monat ausgeführt wird (z. B. Anzahl Chats, Dokumente, API-Aufrufe)."
            suffix="× / Monat"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowEstimator((v) => !v)}
          className="self-start text-sm font-medium text-primary hover:underline"
        >
          {showEstimator ? '− Token-Schätzer ausblenden' : '+ Token aus Beispieltext schätzen'}
        </button>
        {showEstimator && (
          <TokenEstimator
            onApply={(target, tokens) =>
              setUseCase(target === 'input' ? { inputTokens: tokens } : { outputTokens: tokens })
            }
          />
        )}
      </div>
    </Section>
  );
}
