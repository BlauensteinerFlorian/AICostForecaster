import { useEffect } from 'react';
import { BusinessCasePanel } from './components/BusinessCasePanel';
import { Header } from './components/Header';
import { ModelPicker } from './components/ModelPicker';
import { ResultsPanel } from './components/ResultsPanel';
import { ScenarioManager } from './components/ScenarioManager';
import { SourcesFooter } from './components/SourcesFooter';
import { UseCaseEditor } from './components/UseCaseEditor';
import { useFxStore } from './store/fxStore';
import { usePriceStore } from './store/priceStore';
import { useUiStore } from './store/uiStore';

export default function App() {
  const theme = useUiStore((s) => s.theme);
  const loadPrices = usePriceStore((s) => s.load);
  const loadFx = useFxStore((s) => s.load);

  // Apply the theme to <html> so the CSS variables switch.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Fetch live prices and the FX rate once on startup.
  useEffect(() => {
    void loadPrices();
    void loadFx();
  }, [loadPrices, loadFx]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6">
        <UseCaseEditor />
        <ModelPicker />
        <ResultsPanel />
        <BusinessCasePanel />
        <ScenarioManager />
      </main>
      <SourcesFooter />
    </div>
  );
}
