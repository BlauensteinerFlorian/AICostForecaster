import { useState } from 'react';
import { evaluateBusinessCase } from '../lib/costEngine';
import { formatEur } from '../lib/format';
import { useResults } from '../hooks/useResults';
import { useScenarioStore } from '../store/scenarioStore';
import { useUiStore } from '../store/uiStore';
import { InfoTooltip } from './ui/InfoTooltip';
import { Section } from './ui/Section';

export function BusinessCasePanel() {
  const { results } = useResults();
  const benefit = useScenarioStore((s) => s.monthlyBenefitEur);
  const setBenefit = useScenarioStore((s) => s.setBenefit);
  const period = useUiStore((s) => s.period);
  const isMonth = period === 'month';
  const [open, setOpen] = useState(false);

  if (results.length === 0) return null;

  return (
    <Section
      step={4}
      title="Rechnet sich der Business Case?"
      info="Stelle den operativen Kosten einen erwarteten monatlichen Nutzen gegenüber (z. B. eingesparte Arbeitszeit in Euro oder Mehrumsatz). Das Tool zeigt das Netto-Ergebnis und den ROI je Modell. Initiale Entwicklungs- und Setup-Kosten sind hier bewusst nicht enthalten."
      actions={
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-sm font-medium text-primary hover:underline"
        >
          {open ? 'einklappen' : 'ausklappen'}
        </button>
      }
    >
      {!open ? (
        <p className="text-sm text-muted">
          Optionaler Schritt: erwarteten monatlichen Nutzen erfassen, um Wirtschaftlichkeit und
          Break-even zu prüfen.
        </p>
      ) : (
        <div className="grid gap-4">
          <label className="flex max-w-xs flex-col gap-1">
            <span className="flex items-center gap-1.5 text-sm font-medium text-muted">
              Erwarteter Nutzen / Monat
              <InfoTooltip text="Monetärer Nutzen pro Monat: eingesparte manuelle Arbeit, schnellere Bearbeitung, zusätzlicher Umsatz o. Ä. — in Euro." />
            </span>
            <span className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 focus-within:ring-1 focus-within:ring-primary">
              <span className="text-muted">€</span>
              <input
                type="number"
                min={0}
                value={Number.isFinite(benefit) ? benefit : 0}
                onChange={(e) => {
                  const v = Number.parseFloat(e.target.value);
                  setBenefit(Number.isFinite(v) ? Math.max(0, v) : 0);
                }}
                className="w-full bg-transparent py-2 text-text outline-none"
              />
            </span>
          </label>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="py-2 pr-3 font-semibold">Modell</th>
                  <th className="px-3 py-2 text-right font-semibold">
                    Kosten / {isMonth ? 'Monat' : 'Jahr'}
                  </th>
                  <th className="px-3 py-2 text-right font-semibold">
                    Netto / {isMonth ? 'Monat' : 'Jahr'}
                  </th>
                  <th className="px-3 py-2 text-right font-semibold">ROI</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => {
                  const bc = evaluateBusinessCase(r.cost.perMonthEur, benefit);
                  const net = isMonth ? bc.netMonthlyEur : bc.netYearlyEur;
                  const cost = isMonth ? r.cost.perMonthEur : r.cost.perYearEur;
                  return (
                    <tr
                      key={r.model.id}
                      className="border-b border-border/60 last:border-0 hover:bg-surface-2/50"
                    >
                      <td className="py-2.5 pr-3 font-medium text-text">{r.model.name}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-text">
                        {formatEur(cost)}
                      </td>
                      <td
                        className={`px-3 py-2.5 text-right font-semibold tabular-nums ${
                          bc.profitable ? 'text-success' : 'text-danger'
                        }`}
                      >
                        {net >= 0 ? '+' : ''}
                        {formatEur(net)}
                      </td>
                      <td
                        className={`px-3 py-2.5 text-right tabular-nums ${
                          bc.profitable ? 'text-success' : 'text-danger'
                        }`}
                      >
                        {bc.roiPct === null ? '—' : `${bc.roiPct >= 0 ? '+' : ''}${bc.roiPct.toFixed(0)} %`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {benefit > 0 && (
            <p className="text-xs text-muted">
              Grün = der Nutzen übersteigt die operativen Kosten (positiver Deckungsbeitrag).
              Rot = die Kosten sind höher als der angegebene Nutzen.
            </p>
          )}
        </div>
      )}
    </Section>
  );
}
