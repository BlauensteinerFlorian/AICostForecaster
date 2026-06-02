import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_SELECTED_IDS } from '../data/curatedModels';
import type { UseCase } from '../lib/costEngine';

export interface ScenarioData {
  useCase: UseCase;
  /** Model ids selected for comparison. */
  selectedIds: string[];
  /** Expected monthly benefit/savings in EUR (for the business-case view). */
  monthlyBenefitEur: number;
}

export interface SavedScenario extends ScenarioData {
  id: string;
  name: string;
  savedAt: string;
}

interface ScenarioState extends ScenarioData {
  saved: SavedScenario[];
  setUseCase: (patch: Partial<UseCase>) => void;
  toggleModel: (id: string) => void;
  setBenefit: (value: number) => void;
  resetCurrent: () => void;
  saveCurrent: (name: string) => void;
  loadScenario: (id: string) => void;
  deleteScenario: (id: string) => void;
  duplicateScenario: (id: string) => void;
}

const DEFAULT_USE_CASE: UseCase = {
  name: 'Mein Use Case',
  inputTokens: 1000,
  outputTokens: 500,
  requestsPerMonth: 10000,
};

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const useScenarioStore = create<ScenarioState>()(
  persist(
    (set, get) => ({
      useCase: DEFAULT_USE_CASE,
      selectedIds: [...DEFAULT_SELECTED_IDS],
      monthlyBenefitEur: 0,
      saved: [],

      setUseCase: (patch) => set((s) => ({ useCase: { ...s.useCase, ...patch } })),
      toggleModel: (id) =>
        set((s) => ({
          selectedIds: s.selectedIds.includes(id)
            ? s.selectedIds.filter((x) => x !== id)
            : [...s.selectedIds, id],
        })),
      setBenefit: (value) => set({ monthlyBenefitEur: value }),
      resetCurrent: () =>
        set({
          useCase: { ...DEFAULT_USE_CASE },
          selectedIds: [...DEFAULT_SELECTED_IDS],
          monthlyBenefitEur: 0,
        }),

      saveCurrent: (name) => {
        const { useCase, selectedIds, monthlyBenefitEur } = get();
        const entry: SavedScenario = {
          id: newId(),
          name: name.trim() || useCase.name || 'Unbenannt',
          savedAt: new Date().toISOString(),
          useCase: { ...useCase },
          selectedIds: [...selectedIds],
          monthlyBenefitEur,
        };
        set((s) => ({ saved: [entry, ...s.saved] }));
      },
      loadScenario: (id) => {
        const sc = get().saved.find((x) => x.id === id);
        if (!sc) return;
        set({
          useCase: { ...sc.useCase },
          selectedIds: [...sc.selectedIds],
          monthlyBenefitEur: sc.monthlyBenefitEur,
        });
      },
      deleteScenario: (id) => set((s) => ({ saved: s.saved.filter((x) => x.id !== id) })),
      duplicateScenario: (id) =>
        set((s) => {
          const sc = s.saved.find((x) => x.id === id);
          if (!sc) return s;
          const copy: SavedScenario = {
            ...sc,
            id: newId(),
            name: `${sc.name} (Kopie)`,
            savedAt: new Date().toISOString(),
          };
          return { saved: [copy, ...s.saved] };
        }),
    }),
    { name: 'acf-scenarios' },
  ),
);
