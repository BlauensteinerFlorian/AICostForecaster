import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchOpenRouterModels } from '../lib/openrouter';
import type { NormalizedModel } from '../lib/types';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface PriceState {
  liveModels: NormalizedModel[];
  fetchedAt: string | null;
  status: Status;
  error: string | null;
  /** True when we are showing nothing live yet (so curated fallbacks are in use). */
  load: () => Promise<void>;
}

export const usePriceStore = create<PriceState>()(
  persist(
    (set, get) => ({
      liveModels: [],
      fetchedAt: null,
      status: 'idle',
      error: null,
      load: async () => {
        if (get().status === 'loading') return;
        set({ status: 'loading', error: null });
        try {
          const { models, fetchedAt } = await fetchOpenRouterModels();
          set({ liveModels: models, fetchedAt, status: 'success', error: null });
        } catch (err) {
          set({
            status: 'error',
            error: err instanceof Error ? err.message : 'Unbekannter Fehler beim Laden der Preise',
          });
        }
      },
    }),
    {
      name: 'acf-prices',
      // Persist the last successful fetch so reloads (and offline use) still work.
      partialize: (s) => ({ liveModels: s.liveModels, fetchedAt: s.fetchedAt }),
    },
  ),
);
