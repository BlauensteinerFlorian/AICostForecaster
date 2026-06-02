import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FALLBACK_USD_TO_EUR, fetchUsdToEur } from '../lib/fx';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface FxState {
  rate: number | null;
  date: string | null;
  fetchedAt: string | null;
  status: Status;
  error: string | null;
  /** User override of the USD→EUR rate; null means "use the live/fallback rate". */
  override: number | null;
  load: () => Promise<void>;
  setOverride: (value: number | null) => void;
}

export const useFxStore = create<FxState>()(
  persist(
    (set, get) => ({
      rate: null,
      date: null,
      fetchedAt: null,
      status: 'idle',
      error: null,
      override: null,
      load: async () => {
        if (get().status === 'loading') return;
        set({ status: 'loading', error: null });
        try {
          const { rate, date, fetchedAt } = await fetchUsdToEur();
          set({ rate, date, fetchedAt, status: 'success', error: null });
        } catch (err) {
          set({
            status: 'error',
            error: err instanceof Error ? err.message : 'Wechselkurs konnte nicht geladen werden',
          });
        }
      },
      setOverride: (value) => set({ override: value }),
    }),
    {
      name: 'acf-fx',
      partialize: (s) => ({
        rate: s.rate,
        date: s.date,
        fetchedAt: s.fetchedAt,
        override: s.override,
      }),
    },
  ),
);

/** The effective USD→EUR rate to use in calculations. */
export function effectiveRate(state: Pick<FxState, 'override' | 'rate'>): number {
  return state.override ?? state.rate ?? FALLBACK_USD_TO_EUR;
}
