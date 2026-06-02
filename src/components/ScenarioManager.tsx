import { useState } from 'react';
import { formatDate } from '../lib/format';
import { useScenarioStore } from '../store/scenarioStore';
import { Section } from './ui/Section';

export function ScenarioManager() {
  const saved = useScenarioStore((s) => s.saved);
  const currentName = useScenarioStore((s) => s.useCase.name);
  const saveCurrent = useScenarioStore((s) => s.saveCurrent);
  const loadScenario = useScenarioStore((s) => s.loadScenario);
  const deleteScenario = useScenarioStore((s) => s.deleteScenario);
  const duplicateScenario = useScenarioStore((s) => s.duplicateScenario);
  const resetCurrent = useScenarioStore((s) => s.resetCurrent);
  const [name, setName] = useState('');

  return (
    <Section
      step={5}
      title="Szenarien"
      info="Speichere verschiedene Use-Case-Varianten (Token, Volumen, Modellauswahl) und vergleiche sie später wieder. Die Daten bleiben lokal in deinem Browser (localStorage) — kein Login, kein Server."
      actions={
        <button
          onClick={resetCurrent}
          className="text-sm font-medium text-muted hover:text-text"
          title="Auf Standardwerte zurücksetzen"
        >
          zurücksetzen
        </button>
      }
    >
      <div className="grid gap-4">
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            saveCurrent(name);
            setName('');
          }}
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`Name (Standard: „${currentName}")`}
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-fg transition-opacity hover:opacity-90"
          >
            Aktuelles Szenario speichern
          </button>
        </form>

        {saved.length === 0 ? (
          <p className="text-sm text-muted">Noch keine gespeicherten Szenarien.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {saved.map((sc) => (
              <li
                key={sc.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-text">{sc.name}</div>
                  <div className="text-xs text-muted">
                    {sc.selectedIds.length} Modelle ·{' '}
                    {sc.useCase.requestsPerMonth.toLocaleString('de-DE')} Req/Monat ·{' '}
                    {formatDate(sc.savedAt)}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 text-sm">
                  <button
                    onClick={() => loadScenario(sc.id)}
                    className="rounded-md border border-border px-2.5 py-1 font-medium text-text transition-colors hover:border-primary hover:text-primary"
                  >
                    Laden
                  </button>
                  <button
                    onClick={() => duplicateScenario(sc.id)}
                    className="rounded-md border border-border px-2.5 py-1 text-muted transition-colors hover:text-text"
                    title="Duplizieren"
                  >
                    Kopie
                  </button>
                  <button
                    onClick={() => deleteScenario(sc.id)}
                    className="rounded-md border border-border px-2.5 py-1 text-muted transition-colors hover:border-danger hover:text-danger"
                    title="Löschen"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
}
