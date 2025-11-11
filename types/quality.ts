// Graphics Quality Presets (PUBG-style)
// Separate from vibe/mood presets - controls performance vs visual quality

export type QualityLevel = {
  name: string;
  samples: number; // MSAA samples
  bloomScale: number; // Bloom texture resolution scale
  shadowMapSize: number; // Shadow map resolution
  fxaaEnabled: boolean;
  chromaticAberration: boolean;
  grain: boolean;
  vignette: number; // 0-1
};

export const QUALITY_PRESETS: Record<string, QualityLevel> = {
  smooth: {
    name: 'Smooth',
    samples: 1, // No MSAA
    bloomScale: 0.5,
    shadowMapSize: 1024,
    fxaaEnabled: true,
    chromaticAberration: false,
    grain: false,
    vignette: 0.15,
  },
  
  balanced: {
    name: 'Balanced',
    samples: 2,
    bloomScale: 0.75,
    shadowMapSize: 2048,
    fxaaEnabled: true,
    chromaticAberration: false,
    grain: false,
    vignette: 0.20,
  },
  
  hd: {
    name: 'HD',
    samples: 4,
    bloomScale: 1.0,
    shadowMapSize: 4096,
    fxaaEnabled: true,
    chromaticAberration: true,
    grain: false,
    vignette: 0.22,
  },
  
  ultra_hd: {
    name: 'Ultra HD',
    samples: 8,
    bloomScale: 1.0,
    shadowMapSize: 8192,
    fxaaEnabled: true,
    chromaticAberration: true,
    grain: true,
    vignette: 0.25,
  },
};

