import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Vibe, PRESETS } from '@/types/vibes';

interface VibesState {
  currentVibe: Vibe;
  useWebGPU: boolean;
  setVibe: (vibe: Vibe) => void;
  setUseWebGPU: (use: boolean) => void;
  applyPreset: (name: string) => void;
}

export const useVibesStore = create<VibesState>()(
  persist(
    (set) => ({
      currentVibe: PRESETS.default, // Use default instead of noir
      useWebGPU: true,
      setVibe: (vibe) => set({ currentVibe: vibe }),
      setUseWebGPU: (use) => set({ useWebGPU: use }),
      applyPreset: (name) => {
        const preset = PRESETS[name];
        if (preset) {
          set({ currentVibe: { ...preset } });
        }
      },
    }),
    {
      name: 'vibes-storage',
      storage: typeof window !== 'undefined' ? createJSONStorage(() => localStorage) : undefined,
      version: 2, // FORCE RESET - discard old dark presets
      migrate: (persistedState: any, version: number) => {
        // ALWAYS reset to new bright default when version changes
        console.log(`🔄 Vibes storage version ${version} - resetting to bright default`);
        return { currentVibe: PRESETS.default, useWebGPU: true };
      },
    }
  )
);

