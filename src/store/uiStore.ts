import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'dark' | 'light';
export type Period = 'month' | 'year';

interface UiState {
  theme: Theme;
  period: Period;
  toggleTheme: () => void;
  setPeriod: (p: Period) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'dark',
      period: 'month',
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setPeriod: (period) => set({ period }),
    }),
    { name: 'acf-ui' },
  ),
);
