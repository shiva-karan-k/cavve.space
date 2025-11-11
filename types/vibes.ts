// vibes.ts

export type Vibe = {
  env: string;
  envIntensity: number;
  exposure: number;
  bloom: { enabled: boolean; threshold: number; weight: number };
  fog: { enabled: boolean; density: number };
  key: { intensity: number; angle: number; kelvin: number };
  rim: { intensity: number; angle: number; kelvin: number };
  emissiveIntensity: number;
};

export const PRESETS: Record<string, Vibe> = {
  // Default mode - BRIGHT evenly lit cave (matches reference image brightness)
  default: {
    env: "",
    envIntensity: 0.45,  // HIGH ambient - everything should be visible
    exposure: 1.35,  // MUCH brighter - details must be clearly visible
    bloom: { enabled: true, threshold: 1.1, weight: 0.12 },  // Subtle bloom
    fog: { enabled: true, density: 0.003 },  // Minimal fog
    key: { intensity: 1600, angle: 60, kelvin: 2800 },  // Very wide, bright fill
    rim: { intensity: 1400, angle: 60, kelvin: 2800 },  // Very wide, bright fill
    emissiveIntensity: 5.5,  // Bright glowing screens
  },
  
  // Reference look
  noir: {
    env: "", // Fallback to default (env file missing)
    envIntensity: 0.18,
    exposure: 1.0,
    bloom: { enabled: true, threshold: 1.10, weight: 0.12 },
    fog: { enabled: true, density: 0.0048 },
    key: { intensity: 720, angle: 32, kelvin: 3000 },
    rim: { intensity: 520, angle: 25, kelvin: 8000 },
    emissiveIntensity: 5.0,
  },

  // Cooler blue detective mood
  detective: {
    env: "", // Fallback to default (env file missing)
    envIntensity: 0.20,
    exposure: 0.95,
    bloom: { enabled: true, threshold: 1.05, weight: 0.14 },
    fog: { enabled: true, density: 0.0052 },
    key: { intensity: 540, angle: 30, kelvin: 4200 },
    rim: { intensity: 650, angle: 24, kelvin: 9000 },
    emissiveIntensity: 6.0,
  },

  // Warm lamps, clearer rocks
  workshop: {
    env: "", // Fallback to default (env file missing)
    envIntensity: 0.24,
    exposure: 0.98,
    bloom: { enabled: true, threshold: 1.15, weight: 0.10 },
    fog: { enabled: true, density: 0.0040 },
    key: { intensity: 900, angle: 36, kelvin: 3200 },
    rim: { intensity: 420, angle: 22, kelvin: 6500 },
    emissiveIntensity: 4.2,
  },

  // Hero car presentation
  reveal: {
    env: "", // Fallback to default (env file missing)
    envIntensity: 0.30,
    exposure: 0.92,
    bloom: { enabled: true, threshold: 0.95, weight: 0.13 },
    fog: { enabled: true, density: 0.0032 },
    key: { intensity: 1100, angle: 28, kelvin: 5600 },
    rim: { intensity: 800, angle: 20, kelvin: 8500 },
    emissiveIntensity: 3.5,
  },

  // Alarm
  alert: {
    env: "", // Fallback to default (env file missing)
    envIntensity: 0.14,
    exposure: 0.98,
    bloom: { enabled: true, threshold: 1.05, weight: 0.18 },
    fog: { enabled: true, density: 0.0060 },
    key: { intensity: 600, angle: 30, kelvin: 2800 },
    rim: { intensity: 480, angle: 24, kelvin: 10000 },
    emissiveIntensity: 7.0,
  },

  // Screen-only vibe
  blackout: {
    env: "", // Fallback to default (env file missing)
    envIntensity: 0.10,
    exposure: 1.05,
    bloom: { enabled: true, threshold: 1.08, weight: 0.16 },
    fog: { enabled: true, density: 0.0055 },
    key: { intensity: 180, angle: 32, kelvin: 3000 },
    rim: { intensity: 220, angle: 25, kelvin: 9000 },
    emissiveIntensity: 8.0,
  },

  // ✨ Cinematic: Low-Key (deep blacks, narrow key)
  cinematic_lowkey: {
    env: "", // Fallback to default (env file missing)
    envIntensity: 0.16,
    exposure: 0.98,
    bloom: { enabled: true, threshold: 1.12, weight: 0.11 },
    fog: { enabled: true, density: 0.0045 },
    key: { intensity: 680, angle: 26, kelvin: 3200 },
    rim: { intensity: 560, angle: 18, kelvin: 9000 },
    emissiveIntensity: 5.5,
  },

  // ✨ Cinematic: High-Key (trailer reveal, brighter mids)
  cinematic_highkey: {
    env: "", // Fallback to default (env file missing)
    envIntensity: 0.34,
    exposure: 0.90,
    bloom: { enabled: true, threshold: 0.92, weight: 0.14 },
    fog: { enabled: true, density: 0.0030 },
    key: { intensity: 1200, angle: 32, kelvin: 5600 },
    rim: { intensity: 900, angle: 22, kelvin: 8200 },
    emissiveIntensity: 3.2,
  },
  
  // Note: Quality presets (smooth/balanced/HD/Ultra HD) moved to separate quality system
  // See types/quality.ts and store/qualityStore.ts for graphics quality settings
  
  // 🦖 T-Rex Cinematic - Frontal elevated view (spawn point angle) - Bright showcase lighting
  "T-Rex_cinematic": {
    env: "",
    envIntensity: 0.45,           // Doubled for showcase lighting
    exposure: 1.15,               // Increased camera exposure
    bloom: { enabled: true, threshold: 1.05, weight: 0.14 },
    fog: { enabled: true, density: 0.004 },  // Reduced fog for clarity
    key: { intensity: 1400, angle: 35, kelvin: 4200 },  // +64% key light, warmer neutral
    rim: { intensity: 950, angle: 28, kelvin: 7500 },   // +58% rim light, less cool
    emissiveIntensity: 5.5,  // Strong screen glow
  },
};

