import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { QualityLevel, QUALITY_PRESETS } from '@/types/quality';

interface QualityState {
  currentQuality: QualityLevel;
  setQuality: (quality: QualityLevel) => void;
  applyPreset: (name: string) => void;
}

export const useQualityStore = create<QualityState>()(
  persist(
    (set) => ({
      currentQuality: QUALITY_PRESETS.balanced, // Default to balanced
      setQuality: (quality) => set({ currentQuality: quality }),
      applyPreset: (name) => {
        const preset = QUALITY_PRESETS[name];
        if (preset) {
          set({ currentQuality: { ...preset } });
        }
      },
    }),
    {
      name: 'quality-storage',
      storage: typeof window !== 'undefined' ? createJSONStorage(() => localStorage) : undefined,
    }
  )
);

