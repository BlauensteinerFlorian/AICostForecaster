import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatEur, formatEurPrecise, formatPerMTok } from '../lib/format';
import { useResults } from '../hooks/useResults';
import { useUiStore, type Period } from '../store/uiStore';
import { Section } from './ui/Section';

const PERIOD_LABEL: Record<Period, string> = { month: 'Monat', year: 'Jahr' };

function PeriodToggle() {
  const period = useUiStore((s) => s.period);
  const setPeriod = useUiStore((s) => s.setPeriod);
  return (
    <div className="inline-flex rounded-lg border border-border bg-surface-2 p-0.5 text-sm">
      {(['month', 'year'] as Period[]).map((p) => (
        <button
          key={p}
          onClick={() => setPeriod(p)}
          className={`rounded-md px-3 py-1 font-medium transition-colors ${
            period === p ? 'bg-primary text-primary-fg' : 'text-muted hover:text-text'
          }`}
        >
          {PERIOD_LABEL[p]}
        </button>
      ))}
    </div>
  );
}

export function ResultsPanel() {
  const { results } = useResults();
  const period = useUiStore((s) => s.period);
  const isMonth = period === 'month';

  if (results.length === 0) {
    return (
      <Section step={3} title="Ergebnisse">
        <p className="py-8 text-center text-sm text-muted">
          Wähle oben mindestens ein Modell, um die Kosten zu berechnen.
        </p>
      </Section>
    );
  }

  const chartData = results.map((r) => ({
    name: r.model.name,
    value: isMonth ? r.cost.perMonthEur : r.cost.perYearEur,
  }));
  const cheapestId = results[0]?.model.id;

  return (
    <Section
      step={3}
      title="Ergebnisse"
      info="Kosten je Request = (Input + System-/Tool-Overhead) × Input-Preis + (Output × Reasoning-Faktor) × Output-Preis, mal Calls/Request und Sicherheitsaufschlag. Das × Requests/Monat ergibt die Monatskosten; Jahr = Monat × 12. Umrechnung in EUR über den oben gesetzten Kurs."
      actions={<PeriodToggle />}
    >
      <div className="mb-5 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border))" />
            <XAxis
              dataKey="name"
              tick={{ fill: 'rgb(var(--color-muted))', fontSize: 11 }}
              interval={0}
              angle={-12}
              textAnchor="end"
              height={50}
            />
            <YAxis
              tick={{ fill: 'rgb(var(--color-muted))', fontSize: 11 }}
              tickFormatter={(v: number) => formatEur(v)}
              width={80}
            />
            <Tooltip
              cursor={{ fill: 'rgb(var(--color-primary) / 0.08)' }}
              contentStyle={{
                background: 'rgb(var(--color-surface))',
                border: '1px solid rgb(var(--color-border))',
                borderRadius: 8,
                color: 'rgb(var(--color-text))',
              }}
              formatter={(v: number) => [formatEur(v), `Kosten / ${PERIOD_LABEL[period]}`]}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((d) => (
                <Cell
                  key={d.name}
                  fill={
                    results.find((r) => r.model.name === d.name)?.model.id === cheapestId
                      ? 'rgb(var(--color-success))'
                      : 'rgb(var(--color-primary))'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="py-2 pr-3 font-semibold">Modell</th>
              <th className="px-3 py-2 text-right font-semibold">Preis In / Out</th>
              <th className="px-3 py-2 text-right font-semibold">€ / Request</th>
              <th className="px-3 py-2 text-right font-semibold">€ / {PERIOD_LABEL[period]}</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr
                key={r.model.id}
                className="border-b border-border/60 last:border-0 hover:bg-surface-2/50"
              >
                <td className="py-2.5 pr-3">
                  <div className="flex items-center gap-2 font-medium text-text">
                    {r.model.name}
                    {r.model.id === cheapestId && (
                      <span className="rounded bg-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-success">
                        günstigste
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted">{r.model.provider}</div>
                </td>
                <td className="px-3 py-2.5 text-right text-xs text-muted">
                  {formatPerMTok(r.model.inputPerMTok)}
                  <br />
                  {formatPerMTok(r.model.outputPerMTok)}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-text">
                  {formatEurPrecise(r.cost.perRequestEur)}
                </td>
                <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-text">
                  {formatEur(isMonth ? r.cost.perMonthEur : r.cost.perYearEur)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
