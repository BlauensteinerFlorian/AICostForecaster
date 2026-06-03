import { useEffect, useRef, useState } from 'react';
import { extractTextFromFile, IMAGE_TOKENS_PER_PAGE, type ExtractKind } from '../lib/extractText';
import { formatTokenCount } from '../lib/format';
import {
  estimateTokens,
  loadTokenizer,
  type EstimateLang,
  type EstimateMethod,
} from '../lib/tokenize';
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
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  info?: string;
  suffix?: string;
  min?: number;
  step?: number;
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
          step={step}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => {
            const v = Number.parseFloat(e.target.value);
            onChange(Number.isFinite(v) ? Math.max(min, v) : min);
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
  words: 'Wörter-Heuristik',
  chars: 'Zeichen-Heuristik',
};

interface FileMeta {
  name: string;
  kind: ExtractKind;
  pages?: number;
}

function TokenEstimator({
  onApply,
}: {
  onApply: (target: 'input' | 'output', tokens: number) => void;
}) {
  const [text, setText] = useState('');
  const [method, setMethod] = useState<EstimateMethod>('tokenizer');
  const [lang, setLang] = useState<EstimateLang>('de');
  // Track tokenizer readiness so the count refreshes once the lazy chunk loads.
  const [tokenizerReady, setTokenizerReady] = useState(false);
  const [fileMeta, setFileMeta] = useState<FileMeta | null>(null);
  const [busy, setBusy] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (method === 'tokenizer' && !tokenizerReady) {
      void loadTokenizer().then(() => setTokenizerReady(true));
    }
  }, [method, tokenizerReady]);

  async function handleFile(file: File) {
    setBusy(true);
    setFileError(null);
    try {
      const { text: extracted, kind, pages } = await extractTextFromFile(file);
      setText(extracted);
      setFileMeta({ name: file.name, kind, pages });
      // Ensure the exact tokenizer is loaded so the count is precise.
      await loadTokenizer();
      setTokenizerReady(true);
    } catch {
      setFileMeta(null);
      setFileError('Datei konnte nicht gelesen werden. Unterstützt: PDF, Word (.docx), TXT/MD.');
    } finally {
      setBusy(false);
    }
  }

  // Setting tokenizerReady re-renders, so the estimate recomputes after lazy load.
  const tokens = estimateTokens(text, method, lang);
  const imageTokens =
    fileMeta?.kind === 'pdf' && fileMeta.pages ? fileMeta.pages * IMAGE_TOKENS_PER_PAGE : 0;

  return (
    <div className="rounded-lg border border-dashed border-border bg-surface-2/50 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-muted">
        Token aus Datei oder Beispieltext messen
        <InfoTooltip text="Lade eine Datei (PDF, Word, TXT) hoch oder füge Text ein. Der Inhalt wird nur lokal in deinem Browser verarbeitet – nichts wird hochgeladen. Der genaue Tokenizer ist auf OpenAI-Modelle geeicht und für Claude/Gemini eine gute Näherung." />
      </div>

      {/* File picker */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md,.csv,.json,text/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
        >
          📄 Datei auswählen (PDF / Word / TXT)
        </button>
        {busy && <span className="text-xs text-muted">Datei wird gelesen …</span>}
        {fileMeta && !busy && (
          <span className="text-xs text-muted">
            {fileMeta.name}
            {fileMeta.pages ? ` · ${fileMeta.pages} Seiten` : ''}
          </span>
        )}
      </div>
      {fileError && <p className="mb-2 text-xs text-danger">{fileError}</p>}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Datei auswählen oder Beispieltext einfügen …"
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
        {/* Language toggle only matters for the heuristics. */}
        <div className="inline-flex items-center gap-1">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as EstimateLang)}
            disabled={method === 'tokenizer'}
            title={
              method === 'tokenizer'
                ? 'Der genaue Tokenizer erkennt die Sprache automatisch.'
                : 'Sprache für die Heuristik'
            }
            className="rounded-lg border border-border bg-surface px-2 py-1.5 text-text outline-none focus:ring-1 focus:ring-primary disabled:opacity-40"
          >
            <option value="de">Deutsch</option>
            <option value="en">Englisch</option>
          </select>
          <InfoTooltip text="Deutsch erzeugt mehr Token als Englisch (lange Komposita). Die Heuristiken sind entsprechend kalibriert (Deutsch ≈ Wörter × 1,8 bzw. Zeichen ÷ 3). Der genaue Tokenizer berücksichtigt das automatisch." />
        </div>
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
      {imageTokens > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-surface px-3 py-2 text-xs text-muted">
          <span>
            PDF mit {fileMeta?.pages} Seiten: Falls als <strong className="text-text">Bild</strong>{' '}
            gesendet, kommen ca.{' '}
            <strong className="text-text">{formatTokenCount(imageTokens)} Bild-Token</strong> hinzu
            ({fileMeta?.pages} × ~{formatTokenCount(IMAGE_TOKENS_PER_PAGE)}).
          </span>
          <button
            type="button"
            onClick={() => onApply('input', tokens + imageTokens)}
            className="rounded-lg border border-border px-2.5 py-1 font-medium text-text transition-colors hover:border-primary hover:text-primary"
          >
            → Text + Bild als Input
          </button>
          <InfoTooltip text="Manche Anbieter (z. B. Anthropic) verarbeiten PDF-Seiten zusätzlich als Bilder und berechnen dafür Bild-Token. Der genaue Wert ist anbieter- und auflösungsabhängig (~1.000–2.000 Token/Seite) – hier eine Näherung." />
        </div>
      )}
      {method !== 'tokenizer' && (
        <p className="mt-2 text-xs text-warning">
          Hinweis: Heuristiken sind nur Näherungen. Für verlässliche Werte – besonders bei
          deutschen Texten – „Tokenizer (genau)" verwenden.
        </p>
      )}
    </div>
  );
}

const TOKEN_DRIVERS = [
  'Dokumente (Word/PDF): der extrahierte Text zählt. PDFs werden bei manchen Anbietern je Seite zusätzlich als Bild (~1.000–2.000 Token/Seite) berechnet.',
  'System-/Developer-Prompt: fällt bei jedem einzelnen Aufruf erneut an.',
  'Tool-/Function-Definitionen (JSON-Schemas): zählen bei jedem Aufruf als Input.',
  'Few-Shot-Beispiele im Prompt: jedes Mal mitgezählt.',
  'Konversations-Historie (Chatbots): jeder Turn schickt die bisherigen Nachrichten erneut mit – wächst stark.',
  'RAG-Kontext: aus einer Wissensbasis eingefügte Textstücke zählen als Input.',
  'Reasoning-/Thinking-Token: internes „Nachdenken" wird als Output abgerechnet (oft ein Mehrfaches der sichtbaren Antwort).',
  'Agenten/Multi-Step & Retries: ein „Request" sind oft mehrere Modellaufrufe.',
  'Deutsch braucht ~1,5–2× mehr Token pro Wort als Englisch.',
  'Spar-Hebel: Prompt-Caching (wiederkehrender Kontext günstiger) und Batch-API (~50 % Rabatt).',
];

export function UseCaseEditor() {
  const useCase = useScenarioStore((s) => s.useCase);
  const setUseCase = useScenarioStore((s) => s.setUseCase);
  const [showEstimator, setShowEstimator] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDrivers, setShowDrivers] = useState(false);

  return (
    <Section
      step={1}
      title="Use Case definieren"
      info="Ein Request ist eine Ausführung des Use Cases (kann intern mehrere Modellaufrufe enthalten). Gib die durchschnittlichen Token pro Request und das erwartete Monatsvolumen an."
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
            info="Token im Prompt (Nutzer-Eingabe + Kontext/Dokumente), die an das Modell geschickt werden. System-Prompt und Tools besser unten im Bereich Overhead erfassen. 1 Token entspricht etwa 4 Zeichen bzw. rund 3/4 Wort (Deutsch eher mehr)."
          />
          <NumberField
            label="Output-Token / Request"
            value={useCase.outputTokens}
            onChange={(v) => setUseCase({ outputTokens: v })}
            info="Token in der sichtbaren Antwort des Modells. Reasoning-/Thinking-Token separat über den Faktor unten abbilden. Output ist meist deutlich teurer als Input."
          />
          <NumberField
            label="Requests / Monat"
            value={useCase.requestsPerMonth}
            onChange={(v) => setUseCase({ requestsPerMonth: v })}
            info="Wie oft dieser Use Case pro Monat ausgeführt wird (z. B. Anzahl Chats, Dokumente, API-Aufrufe)."
            suffix="× / Monat"
          />
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <button
            type="button"
            onClick={() => setShowEstimator((v) => !v)}
            className="text-sm font-medium text-primary hover:underline"
          >
            {showEstimator ? '− Token-Messer ausblenden' : '+ Token messen (Datei hochladen oder Text)'}
          </button>
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-sm font-medium text-primary hover:underline"
          >
            {showAdvanced ? '− Overhead & Realität ausblenden' : '+ Overhead & Realität (System-Prompt, Calls, Reasoning …)'}
          </button>
          <button
            type="button"
            onClick={() => setShowDrivers((v) => !v)}
            className="text-sm font-medium text-primary hover:underline"
          >
            {showDrivers ? '− Hinweise ausblenden' : '? Was treibt meine Token?'}
          </button>
        </div>

        {showEstimator && (
          <TokenEstimator
            onApply={(target, tokens) =>
              setUseCase(target === 'input' ? { inputTokens: tokens } : { outputTokens: tokens })
            }
          />
        )}

        {showAdvanced && (
          <div className="rounded-lg border border-dashed border-border bg-surface-2/50 p-3">
            <p className="mb-3 text-xs text-muted">
              Diese Faktoren bilden den oft unterschätzten Zusatzaufwand ab. Sie fließen direkt in
              die Kostenrechnung ein – Standardwerte lassen das Ergebnis unverändert.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <NumberField
                label="System-/Tool-Overhead"
                value={useCase.systemOverheadTokens ?? 0}
                onChange={(v) => setUseCase({ systemOverheadTokens: v })}
                suffix="Token"
                info="Feste Input-Token, die bei JEDEM Aufruf zusätzlich anfallen: System-/Developer-Prompt, Tool-/Function-Definitionen, Few-Shot-Beispiele, eingefügter RAG-Kontext."
              />
              <NumberField
                label="Calls / Request"
                value={useCase.callsPerRequest ?? 1}
                onChange={(v) => setUseCase({ callsPerRequest: v })}
                min={1}
                info="Modellaufrufe pro Request. Bei Agenten/Multi-Step oder Retries sind es mehrere (z. B. 3). Multipliziert die Kosten je Request."
              />
              <NumberField
                label="Reasoning-Faktor"
                value={useCase.reasoningFactor ?? 1}
                onChange={(v) => setUseCase({ reasoningFactor: v })}
                min={1}
                step={0.5}
                info="Multiplikator auf die Output-Token für Reasoning-/Thinking-Modelle. 1 = kein Thinking; 3 = dreifache Output-Token (Denk-Token werden als Output abgerechnet)."
              />
              <NumberField
                label="Sicherheitsaufschlag"
                value={useCase.bufferPct ?? 0}
                onChange={(v) => setUseCase({ bufferPct: v })}
                suffix="%"
                info="Pauschaler Puffer auf die Gesamtkosten für Varianz, Sprache und Unsicherheit (z. B. 20 %)."
              />
            </div>
          </div>
        )}

        {showDrivers && (
          <div className="rounded-lg border border-border bg-surface-2/50 p-3">
            <h4 className="mb-2 text-sm font-semibold text-text">
              Was treibt meine Token? — Checkliste
            </h4>
            <ul className="grid list-disc gap-1.5 pl-5 text-xs leading-relaxed text-muted">
              {TOKEN_DRIVERS.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted">
              Tipp: Sobald ein Prototyp existiert, liefert die API pro Antwort ein{' '}
              <code className="rounded bg-surface px-1">usage</code>-Feld mit den echten Token –
              damit lässt sich der Schätzwert kalibrieren.
            </p>
          </div>
        )}
      </div>
    </Section>
  );
}
