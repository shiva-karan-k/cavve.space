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
      version: 1, // Add versioning to invalidate old cached data
      migrate: (persistedState: any) => {
        // If cached data is invalid or from old version, reset to default
        try {
          if (!persistedState || !persistedState.currentVibe) {
            return { currentVibe: PRESETS.default, useWebGPU: true };
          }
          // Validate that currentVibe has all required properties
          const vibe = persistedState.currentVibe;
          if (!vibe.bloom || !vibe.fog || !vibe.key || !vibe.rim) {
            console.warn('⚠️ Invalid cached vibe data, resetting to default');
            return { currentVibe: PRESETS.default, useWebGPU: true };
          }
          return persistedState;
        } catch (e) {
          console.error('❌ Error migrating vibe storage:', e);
          return { currentVibe: PRESETS.default, useWebGPU: true };
        }
      },
    }
  )
);

