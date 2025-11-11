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
  // Default mode - Bright T-Rex showcase view
  default: {
    env: "",
    envIntensity: 0.45,
    exposure: 1.15,
    bloom: { enabled: true, threshold: 1.05, weight: 0.14 },
    fog: { enabled: true, density: 0.004 },
    key: { intensity: 1400, angle: 35, kelvin: 4200 },
    rim: { intensity: 950, angle: 28, kelvin: 7500 },
    emissiveIntensity: 5.5,
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
  
  // 🎮 Performance Presets (PUBG-style)
  smooth: {
    env: "",
    envIntensity: 0.10,
    exposure: 0.95,
    bloom: { enabled: false, threshold: 1.5, weight: 0.05 },
    fog: { enabled: false, density: 0.001 },
    key: { intensity: 500, angle: 40, kelvin: 3000 },
    rim: { intensity: 300, angle: 30, kelvin: 7000 },
    emissiveIntensity: 3.0,
  },
  
  balanced: {
    env: "",
    envIntensity: 0.15,
    exposure: 1.0,
    bloom: { enabled: true, threshold: 1.10, weight: 0.10 },
    fog: { enabled: true, density: 0.0035 },
    key: { intensity: 700, angle: 32, kelvin: 3000 },
    rim: { intensity: 500, angle: 25, kelvin: 8000 },
    emissiveIntensity: 4.5,
  },
  
  hd: {
    env: "",
    envIntensity: 0.20,
    exposure: 1.0,
    bloom: { enabled: true, threshold: 1.05, weight: 0.15 },
    fog: { enabled: true, density: 0.0050 },
    key: { intensity: 900, angle: 30, kelvin: 3200 },
    rim: { intensity: 650, angle: 22, kelvin: 8500 },
    emissiveIntensity: 5.5,
  },
  
  ultra_hd: {
    env: "",
    envIntensity: 0.25,
    exposure: 1.05,
    bloom: { enabled: true, threshold: 0.95, weight: 0.18 },
    fog: { enabled: true, density: 0.0060 },
    key: { intensity: 1100, angle: 28, kelvin: 3500 },
    rim: { intensity: 850, angle: 20, kelvin: 9000 },
    emissiveIntensity: 6.5,
  },
  
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

