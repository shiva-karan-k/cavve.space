# 🔦 Batcave Lighting Modes

## OFFLINE MODE (Current Default)
**Vibe:** Dark, moody Batman cave - blue screens glow in darkness

### Specs:
- **Ambient Light**: `1.5` intensity
  - Diffuse: `(0.85, 0.82, 0.75)` - subtle warm tint
  - Ground: `(0.12, 0.12, 0.12)` - very dark
- **Exposure**: `0.85` (moody darkness)
- **Contrast**: `1.05` (depth)
- **Screen Emissive**: `10.0` (glow bright in darkness)
- **Yellow Lamp Emissive**: `10.0` (preserve original yellow color)
- **Vignette**: `0.25` weight
- **Result**: Blue Batman screens stand out, golden car visible, atmospheric cave

---

## ONLINE MODE (With Street Lights)
**Vibe:** Traditional Indian yellow street lights illuminate the cave

### Specs:
- **Ambient Light**: `2.0` intensity
  - Diffuse: `(0.88, 0.85, 0.80)` - neutral warm
  - Ground: `(0.15, 0.15, 0.15)` - dark
- **Yellow Street Lights**: 2x PointLights
  - Position: At yellow lamp mesh locations
  - Color: `(1.0, 0.75, 0.4)` - traditional Indian sodium vapor yellow-orange
  - Intensity: `120` per light
  - Range: `25` units
- **Exposure**: `0.90` (slightly brighter)
- **Contrast**: `1.0` (neutral)
- **Screen Emissive**: `10.0` (unchanged)
- **Yellow Lamp Emissive**: `10.0` (mesh glow + actual lights)
- **Result**: Warm yellow-orange street lights illuminate cave, Indian street vibe

---

## Notes:
- Both modes preserve GLB's original blue screen colors (never override `emissiveColor`)
- Only `emissiveIntensity` is boosted for visibility
- "Offline" = dark moody cave, "Online" = street lights on

