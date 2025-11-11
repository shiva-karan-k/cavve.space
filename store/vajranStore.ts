import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface VajranItem {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

interface VajranStore {
  karmas: VajranItem[];
  karyas: VajranItem[];
  kriyas: VajranItem[];
  sankalpas: VajranItem[];
  yudh: VajranItem[];
  initializeVajran: () => void;
}

export const useVajranStore = create<VajranStore>()(
  persist(
    (set) => ({
      karmas: [],
      karyas: [],
      kriyas: [],
      sankalpas: [],
      yudh: [],
      initializeVajran: () => {
        // Initialize with empty arrays - can be populated later
        set({
          karmas: [],
          karyas: [],
          kriyas: [],
          sankalpas: [],
          yudh: [],
        });
      },
    }),
    {
      name: 'vajran-storage',
      storage: typeof window !== 'undefined' ? createJSONStorage(() => localStorage) : undefined,
    }
  )
);


