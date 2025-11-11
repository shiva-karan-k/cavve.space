import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type LightingPreset = 'default' | 'dramatic' | 'bright' | 'moody';

interface LightingState {
  lightsEnabled: boolean;
  currentPreset: LightingPreset;
  ambientIntensity: number;
  sceneLightingIntensity: number; // Master brightness control for all lights
  toggleLights: () => void;
  setPreset: (preset: LightingPreset) => void;
  cyclePreset: () => void;
  setAmbientIntensity: (intensity: number) => void;
  setSceneLightingIntensity: (intensity: number) => void;
}

const presets: LightingPreset[] = ['default', 'dramatic', 'bright', 'moody'];

export const useLightingStore = create<LightingState>()(
  persist(
    (set, get) => ({
      lightsEnabled: true,
      currentPreset: 'default',
      ambientIntensity: 0.08,
      sceneLightingIntensity: 1.0, // Default: 100% brightness
      toggleLights: () => {
        const currentState = get();
        const newState = !currentState.lightsEnabled;
        console.log(`🔘 toggleLights called: ${currentState.lightsEnabled} → ${newState}`);
        set({ lightsEnabled: newState });
        console.log(`✅ Store updated: lightsEnabled = ${get().lightsEnabled}`);
      },
      setPreset: (preset: LightingPreset) => set({ currentPreset: preset }),
      cyclePreset: () => {
        const currentIndex = presets.indexOf(get().currentPreset);
        const nextIndex = (currentIndex + 1) % presets.length;
        set({ currentPreset: presets[nextIndex] });
      },
      setAmbientIntensity: (intensity: number) => set({ ambientIntensity: Math.max(0, Math.min(2, intensity)) }),
      setSceneLightingIntensity: (intensity: number) => set({ sceneLightingIntensity: Math.max(0, Math.min(2, intensity)) }),
    }),
    {
      name: 'lighting-storage',
      storage: typeof window !== 'undefined' ? createJSONStorage(() => localStorage) : undefined,
    }
  )
);

