'use client';

import { useEffect, useRef } from 'react';
import { Engine, Scene, HemisphericLight, DirectionalLight, PointLight, SpotLight, Vector3, FreeCamera, ArcRotateCamera, ShadowGenerator, PBRMaterial, StandardMaterial, Color3, Color4, MeshBuilder, Tools, AbstractMesh, Light, DefaultRenderingPipeline, CubeTexture, KeyboardEventTypes, WebGPUEngine } from '@babylonjs/core';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { DracoCompression } from '@babylonjs/core/Meshes/Compression/dracoCompression';
import { AdvancedDynamicTexture, Rectangle } from '@babylonjs/gui';
import '@babylonjs/loaders/glTF';
import '@babylonjs/loaders/OBJ';
import { useProjectStore } from '@/store/projectStore';
import { useLightingStore } from '@/store/lightingStore';
import { useCameraStore } from '@/store/cameraStore';
import { useVibesStore } from '@/store/vibesStore';
import { Vibe } from '@/types/vibes';

export default function BabylonSceneContent() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const freeCameraModeRef = useRef(false);
  const lightsRef = useRef<{
    ambient?: HemisphericLight;
    fill?: HemisphericLight;
    keySpot?: SpotLight;
    rimSpot?: SpotLight;
    mainDir?: DirectionalLight;
    point1?: PointLight;
    point2?: PointLight;
  }>({});
  const baseIntensitiesRef = useRef<{
    ambient?: number;
    fill?: number;
    keySpot?: number;
    rimSpot?: number;
    mainDir?: number;
    point1?: number;
    point2?: number;
  }>({});
  const screenMaterialsRef = useRef<Array<{ material: any; baseEmissive: Color3 }>>([]);
  const sceneRef = useRef<Scene | null>(null);
  const avatarRef = useRef<AbstractMesh | null>(null);
  const pipelineRef = useRef<DefaultRenderingPipeline | null>(null);
  
  const { lightsEnabled, currentPreset, ambientIntensity, sceneLightingIntensity } = useLightingStore();
  const { cameraMode } = useCameraStore();
  const { currentVibe, useWebGPU } = useVibesStore();

  // Helper function: Kelvin to RGB conversion
  const kelvinToRGB = (k: number): Color3 => {
    const t = k / 100;
    const r = t <= 66 ? 255 : Math.max(0, Math.min(255, 329.698727446 * Math.pow(t - 60, -0.1332047592)));
    const g = t <= 66
      ? Math.max(0, Math.min(255, 99.4708025861 * Math.log(t) - 161.1195681661))
      : Math.max(0, Math.min(255, 288.1221695283 * Math.pow(t - 60, -0.0755148492)));
    const b = t >= 66 ? 255 : t <= 19 ? 0 : Math.max(0, Math.min(255, 138.5177312231 * Math.log(t - 10) - 305.0447927307));
    return new Color3(r / 255, g / 255, b / 255);
  };

  // Helper function: Normalize emissive materials
  const normalizeEmissives = (scene: Scene, intensity: number) => {
    for (const mat of scene.materials) {
      const p = mat as PBRMaterial;
      if (!p) continue;
      const hasEm = !!p.emissiveTexture || (p.emissiveColor && (p.emissiveColor.r > 0.01 || p.emissiveColor.g > 0.01 || p.emissiveColor.b > 0.01));
      if (hasEm) {
        if (!p.emissiveColor || (p.emissiveColor.r < 0.01 && p.emissiveColor.g < 0.01 && p.emissiveColor.b < 0.01)) {
          p.emissiveColor = Color3.White();
        }
        (p as any).emissiveIntensity = intensity;
      }
      if (p.albedoTexture) p.albedoTexture.gammaSpace = true;
      if ((p as any).metallicTexture) (p as any).metallicTexture.gammaSpace = false;
      p.useRoughnessFromMetallicTextureGreen = true;
      p.useMetallnessFromMetallicTextureBlue = true;
      p.useAmbientOcclusionFromMetallicTextureRed = true;
    }
  };

  // Helper function: Apply vibe to scene
  const applyVibe = (scene: Scene, vibe: Vibe) => {
    if (!scene || !pipelineRef.current) return;
    
    console.log('🎨 Applying vibe:', vibe);
    
      // Environment texture - only load if env path is provided
      if (vibe.env && vibe.env.trim() !== '') {
        try {
          scene.environmentTexture = CubeTexture.CreateFromPrefilteredData(vibe.env, scene);
          scene.environmentIntensity = vibe.envIntensity;
          console.log(`✅ Environment texture: ${vibe.env} (intensity: ${vibe.envIntensity})`);
        } catch (e) {
          console.warn('⚠️ Could not load environment texture:', vibe.env, e);
          // Fallback to default environment intensity
          scene.environmentIntensity = vibe.envIntensity;
        }
      } else {
        // Use default environment intensity without loading external file
        scene.environmentIntensity = vibe.envIntensity;
        console.log(`✅ Using default environment (intensity: ${vibe.envIntensity})`);
      }
    
    // Remove any hemisphere fill - caves should be naturally dark
    const hemisphereLight = scene.getLightByName('vibes_hemisphere_fill');
    if (hemisphereLight) {
      hemisphereLight.dispose();
      console.log(`🗑️ Hemisphere fill removed - using GLB native lighting only`);
    }
    
    // Tone mapping and exposure
    scene.imageProcessingConfiguration.toneMappingEnabled = true;
    scene.imageProcessingConfiguration.toneMappingType = 3; // FILMIC tone mapping
    scene.imageProcessingConfiguration.exposure = vibe.exposure;
    
    // Bloom
    if (pipelineRef.current) {
      pipelineRef.current.bloomEnabled = vibe.bloom.enabled;
      pipelineRef.current.bloomThreshold = vibe.bloom.threshold;
      pipelineRef.current.bloomWeight = vibe.bloom.weight;
    }
    
    // Fog (black, not blue)
    if (vibe.fog.enabled) {
      scene.fogMode = Scene.FOGMODE_EXP2;
      scene.fogDensity = vibe.fog.density;
      scene.fogColor = new Color3(0, 0, 0);  // Pure black fog
    } else {
      scene.fogMode = Scene.FOGMODE_NONE;
    }
    
    // Key light
    if (lightsRef.current.keySpot) {
      const k = lightsRef.current.keySpot;
      k.intensity = vibe.key.intensity;
      k.angle = Tools.ToRadians(vibe.key.angle);
      k.diffuse = kelvinToRGB(vibe.key.kelvin);
    }
    
    // Rim light
    if (lightsRef.current.rimSpot) {
      const r = lightsRef.current.rimSpot;
      r.intensity = vibe.rim.intensity;
      r.angle = Tools.ToRadians(vibe.rim.angle);
      r.diffuse = kelvinToRGB(vibe.rim.kelvin);
    }
    
    // Emissive normalization
    normalizeEmissives(scene, vibe.emissiveIntensity);
    
    // Console verification logging
    console.log('✅ Vibe applied successfully - Final values:');
    console.log(`   Env intensity: ${scene.environmentIntensity.toFixed(2)}`);
    console.log(`   Exposure: ${scene.imageProcessingConfiguration.exposure.toFixed(2)}`);
    console.log(`   Key light: ${lightsRef.current.keySpot?.intensity.toFixed(0) || 'N/A'}`);
    console.log(`   Rim light: ${lightsRef.current.rimSpot?.intensity.toFixed(0) || 'N/A'}`);
    console.log(`   Bloom: ${vibe.bloom.enabled ? 'ON' : 'OFF'} (threshold: ${vibe.bloom.threshold.toFixed(2)}, weight: ${vibe.bloom.weight.toFixed(2)})`);
    console.log(`   Fog: ${vibe.fog.enabled ? 'ON' : 'OFF'} (density: ${vibe.fog.density.toFixed(4)})`);
    console.log(`   Emissive intensity: ${vibe.emissiveIntensity.toFixed(1)}`);
  };

  useEffect(() => {
    if (!canvasRef.current) {
      console.error('❌ Canvas ref is null - retrying...');
      // Retry after a short delay
      const timeout = setTimeout(() => {
        if (canvasRef.current) {
          console.log('✅ Canvas ref available on retry');
        } else {
          console.error('❌ Canvas ref still null after retry');
        }
      }, 100);
      return () => clearTimeout(timeout);
    }

    console.log('🎮 Starting Babylon.js initialization...');

    let engine: Engine | null = null;
    let camera: FreeCamera | ArcRotateCamera | null = null;
    const keys: { [key: string]: boolean } = {};

    // Expose keys object globally for debugging
    (window as any).__babylonKeys = keys;

    (async () => {
    try {
        if (!canvasRef.current) {
          console.error('❌ Canvas ref is null');
          return;
        }
        
      // Get canvas dimensions
      const rect = canvasRef.current.getBoundingClientRect();
      const width = rect.width || window.innerWidth;
      const height = rect.height || window.innerHeight;
      
      console.log(`📐 Canvas size: ${width}x${height}`);

      // Initialize engine with WebGPU support (aggressive GPU acceleration)
      const createEngine = async (canvas: HTMLCanvasElement, preferWgpu: boolean): Promise<Engine> => {
        // Always try WebGPU first if enabled (best performance)
        if (preferWgpu) {
          try {
            console.log('🔍 Checking WebGPU support...');
            const isSupported = await WebGPUEngine.IsSupportedAsync;
            if (isSupported) {
              console.log('✅ WebGPU supported! Using GPU-accelerated WebGPU engine');
              const e = new WebGPUEngine(canvas, {
                powerPreference: "high-performance", // Prefer dedicated GPU
                deviceDescriptor: {
                  requiredFeatures: [
                    "texture-compression-bc",
                    "texture-compression-etc2",
                    "texture-compression-astc",
                  ],
                },
              });
              await e.initAsync();
              console.log('🚀 WebGPU engine initialized with GPU acceleration');
              return e;
            } else {
              console.log('⚠️ WebGPU not supported, falling back to WebGL2');
            }
          } catch (e) {
            console.log('⚠️ WebGPU initialization failed, falling back to WebGL2:', e);
          }
        }
        
        // WebGL2 with maximum GPU acceleration
        console.log('✅ Using WebGL2 engine with GPU acceleration');
        return new Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
          antialias: true, // GPU-accelerated anti-aliasing
        alpha: true,
        premultipliedAlpha: false,
          powerPreference: "high-performance", // Force dedicated GPU
          doNotHandleContextLost: false,
          // GPU acceleration hints
          adaptToDeviceRatio: true, // Optimize for device pixel ratio
          xrCompatible: false, // Disable XR for better performance
        });
      };

      if (!canvasRef.current) {
        console.error('❌ Canvas ref is null');
        return;
      }

      engine = await createEngine(canvasRef.current, useWebGPU);
      
      // Log GPU information for debugging
      if (engine instanceof WebGPUEngine) {
        console.log('🚀 WebGPU Engine Active - Using dedicated GPU');
        console.log(`   GPU Adapter: ${(engine as any).adapter?.info?.description || 'Unknown'}`);
      } else {
        console.log('⚡ WebGL2 Engine Active - GPU acceleration enabled');
        const gl = (engine as any).gl;
        if (gl) {
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            console.log(`   GPU: ${renderer || 'Unknown'}`);
          }
        }
      }

      // Create scene with GPU acceleration optimizations
      const scene = new Scene(engine);
      sceneRef.current = scene;
      
      // GPU acceleration settings
      scene.useRightHandedSystem = false; // Standard left-handed (better GPU compatibility)
      
      // Start with black background - will use GLB's background if available
      scene.clearColor = new Color4(0, 0, 0, 1); // Black background
      
      // Enable GPU-accelerated shadows and shader features
      scene.shadowsEnabled = true;
      
      // GPU-accelerated image processing
      scene.imageProcessingConfiguration.toneMappingEnabled = true;
      scene.imageProcessingConfiguration.exposure = 1.0;
      scene.imageProcessingConfiguration.contrast = 1.0;
      
      // GPU-accelerated rendering hints
      scene.autoClear = true; // Let GPU handle clearing
      scene.autoClearDepthAndStencil = true;
      
      console.log('✅ Scene created with GPU acceleration enabled');
      
      // Create a simple test sphere so scene is visible even if GLB fails
      const testSphere = MeshBuilder.CreateSphere('testSphere', { diameter: 2 }, scene);
      testSphere.position = new Vector3(0, 2, 0);
      const testMaterial = new StandardMaterial('testMat', scene);
      testMaterial.emissiveColor = new Color3(0.8, 0.6, 0.2); // Warm golden glow
      testSphere.material = testMaterial;
      console.log('✅ Test sphere created - scene should be visible');
      
      // Disable Babylon.js default loading screen
      engine.loadingScreen.displayLoadingUI = () => {};
      engine.loadingScreen.hideLoadingUI = () => {};
      console.log('✅ Babylon loading screen disabled');

      // ===== SPAWN POINT - Looking directly at the screens/center from elevated front =====
      const CAVE_CENTER = new Vector3(0, 2, 0);    // Center elevated to screen height

      // Camera positioned in FRONT and ABOVE, looking down at the main screens/car
      camera = new ArcRotateCamera(
        'camera',
        Tools.ToRadians(0),    // Alpha: 0° = directly in front (facing -Z)
        Tools.ToRadians(65),   // Beta: 65° = looking down from above
        20,                    // Radius: 20 units back
        CAVE_CENTER,
        scene
      );
      
      // CRITICAL: Force camera to compute and render at spawn point immediately
      camera.rebuildAnglesAndRadius();
      scene.render();
      
      console.log('📍 Spawn: Front elevated view looking at cave center');
      console.log(`  Target: (${CAVE_CENTER.x}, ${CAVE_CENTER.y}, ${CAVE_CENTER.z})`);
      console.log(`  Alpha: 0° | Beta: 65° | Radius: 20`);
      console.log(`  Position: (${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)})`);
      
      // Configure camera controls with proper touch gesture support
      camera.attachControl(canvasRef.current, true);
      camera.lowerRadiusLimit = 2;
      camera.upperRadiusLimit = 100; // Much further zoom out
      camera.wheelDeltaPercentage = 0.01; // Faster zoom
      
      // Enhanced mouse sensitivity for better camera control
      camera.angularSensibilityX = 500; // Horizontal rotation sensitivity (lower = more sensitive)
      camera.angularSensibilityY = 500; // Vertical rotation sensitivity
      camera.panningSensibility = 50; // Panning sensitivity
      camera.inertia = 0.9; // Smooth camera movement (0 = no inertia, 1 = max inertia)
      
      // Enable pinch-to-zoom for touch devices
      camera.pinchToPanMaxDistance = 100;
      camera.pinchDeltaPercentage = 0.01;
      
      // Configure touch inputs to prevent browser zoom
      const pointerInputs = camera.inputs.attached.pointers;
      if (pointerInputs) {
        // Type assertion for properties that may not be in type definitions
        (pointerInputs as any).preventDefaultOnPointerDown = true;
        (pointerInputs as any).useNaturalPinchZoom = true; // Use natural pinch zoom
      }
      
      console.log('✅ Camera controls linked to mouse/cursor');
      
      scene.activeCamera = camera;
      console.log('✅ Camera created');

      // Create GPU-accelerated post-processing pipeline
      const pipeline = new DefaultRenderingPipeline('drp', true, scene, [camera]);
      pipelineRef.current = pipeline;
      
      // GPU-accelerated bloom settings (ENHANCED for visible light glow)
      pipeline.bloomEnabled = true;
      pipeline.bloomThreshold = 0.9; // Lower threshold for more bloom
      pipeline.bloomWeight = 0.22; // Increased for light beam glow
      pipeline.bloomKernel = 128; // Larger kernel for softer bloom
      pipeline.bloomScale = 0.75; // Better quality bloom
      
      // GPU-accelerated vignette
      scene.imageProcessingConfiguration.vignetteEnabled = true;
      scene.imageProcessingConfiguration.vignetteWeight = 0.25; // More dramatic
      scene.imageProcessingConfiguration.vignetteCameraFov = 1.5; // Wider falloff
      
      // Tone mapping - balanced for street lights
      scene.imageProcessingConfiguration.toneMappingEnabled = true;
      scene.imageProcessingConfiguration.toneMappingType = 3; // FILMIC
      scene.imageProcessingConfiguration.exposure = 0.85; // Brighter - let lights be visible
      scene.imageProcessingConfiguration.contrast = 1.0; // Neutral contrast
      
      // FXAA for smooth edges
      pipeline.fxaaEnabled = true;
      
      // GPU performance optimizations
      pipeline.samples = 4; // Enable MSAA for better quality
      
      console.log('✅ GPU-accelerated post-processing pipeline created with enhanced quality');

      // Expose scene for debugging
      (window as any).__babylonScene = scene;
      console.log('✅ Scene exposed globally: window.__babylonScene');

      // Apply scene lighting multiplier to all lights
      const applySceneLighting = (multiplier: number) => {
        console.log(`🔧 applySceneLighting called with multiplier: ${multiplier.toFixed(2)}`);
        let updatedCount = 0;
        
        if (lightsRef.current.ambient && baseIntensitiesRef.current.ambient !== undefined) {
          const newIntensity = baseIntensitiesRef.current.ambient * multiplier;
          lightsRef.current.ambient.intensity = newIntensity;
          console.log(`  ✅ Ambient: ${baseIntensitiesRef.current.ambient.toFixed(3)} × ${multiplier.toFixed(2)} = ${newIntensity.toFixed(3)}`);
          updatedCount++;
        }
        if (lightsRef.current.fill && baseIntensitiesRef.current.fill !== undefined) {
          const newIntensity = baseIntensitiesRef.current.fill * multiplier;
          lightsRef.current.fill.intensity = newIntensity;
          console.log(`  ✅ Fill: ${baseIntensitiesRef.current.fill.toFixed(3)} × ${multiplier.toFixed(2)} = ${newIntensity.toFixed(3)}`);
          updatedCount++;
        }
        if (lightsRef.current.keySpot && baseIntensitiesRef.current.keySpot !== undefined) {
          const newIntensity = baseIntensitiesRef.current.keySpot * multiplier;
          lightsRef.current.keySpot.intensity = newIntensity;
          console.log(`  ✅ KeySpot: ${baseIntensitiesRef.current.keySpot.toFixed(1)} × ${multiplier.toFixed(2)} = ${newIntensity.toFixed(1)}`);
          updatedCount++;
        }
        if (lightsRef.current.rimSpot && baseIntensitiesRef.current.rimSpot !== undefined) {
          const newIntensity = baseIntensitiesRef.current.rimSpot * multiplier;
          lightsRef.current.rimSpot.intensity = newIntensity;
          console.log(`  ✅ RimSpot: ${baseIntensitiesRef.current.rimSpot.toFixed(1)} × ${multiplier.toFixed(2)} = ${newIntensity.toFixed(1)}`);
          updatedCount++;
        }
        if (lightsRef.current.mainDir && baseIntensitiesRef.current.mainDir !== undefined) {
          const newIntensity = baseIntensitiesRef.current.mainDir * multiplier;
          lightsRef.current.mainDir.intensity = newIntensity;
          console.log(`  ✅ MainDir: ${baseIntensitiesRef.current.mainDir.toFixed(2)} × ${multiplier.toFixed(2)} = ${newIntensity.toFixed(2)}`);
          updatedCount++;
        }
        if (lightsRef.current.point1 && baseIntensitiesRef.current.point1 !== undefined) {
          const newIntensity = baseIntensitiesRef.current.point1 * multiplier;
          lightsRef.current.point1.intensity = newIntensity;
          console.log(`  ✅ Point1: ${baseIntensitiesRef.current.point1.toFixed(2)} × ${multiplier.toFixed(2)} = ${newIntensity.toFixed(2)}`);
          updatedCount++;
        }
        if (lightsRef.current.point2 && baseIntensitiesRef.current.point2 !== undefined) {
          const newIntensity = baseIntensitiesRef.current.point2 * multiplier;
          lightsRef.current.point2.intensity = newIntensity;
          console.log(`  ✅ Point2: ${baseIntensitiesRef.current.point2.toFixed(2)} × ${multiplier.toFixed(2)} = ${newIntensity.toFixed(2)}`);
          updatedCount++;
        }
        
        console.log(`✅ Updated ${updatedCount} lights with scene lighting multiplier`);
        
        if (updatedCount === 0) {
          console.warn('⚠️ No lights found to update! Lights may not be initialized yet.');
        }
      };
      
      // Setup lighting based on preset
      const setupLighting = (preset: string, enabled: boolean, ambientValue?: number) => {
        console.log(`🎬 setupLighting called:`, { preset, enabled, ambientValue });
        console.log(`   Scene ref exists: ${!!sceneRef.current}`);
        console.log(`   Scene lights count: ${sceneRef.current?.lights.length || 0}`);
        console.log(`   LightsRef keys: ${Object.keys(lightsRef.current).join(', ') || 'none'}`);
        
        // Get current values from store if not provided
        const currentAmbient = ambientValue !== undefined ? ambientValue : useLightingStore.getState().ambientIntensity;
        const currentSceneLighting = useLightingStore.getState().sceneLightingIntensity;
        
        // Check if we're using GLB lights (they're already in the scene)
        const glbLightsCount = scene.lights.length;
        const usingGlbLights = glbLightsCount > 0 && Object.keys(lightsRef.current).length > 0;
        
        console.log(`   GLB lights check: ${glbLightsCount} lights in scene, ${Object.keys(lightsRef.current).length} in refs, usingGlbLights: ${usingGlbLights}`);
        
        if (usingGlbLights) {
          console.log(`💡 Using ${glbLightsCount} GLB lights (enabled: ${enabled})`);
          
          if (!enabled) {
            // Dark mode: disable all GLB lights
            console.log('🌑 Dark mode: Disabling all GLB lights');
            scene.lights.forEach((light: any) => {
              light.setEnabled(false);
              console.log(`  ❌ Disabled light: ${light.name || 'unnamed'}`);
            });
            scene.ambientColor = new Color3(0, 0, 0);
            
            // Disable ambient reflection on all materials
            scene.meshes.forEach((mesh: any) => {
              if (mesh.material) {
                const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                materials.forEach((mat: any) => {
                  const hasEmissive = mat.emissiveColor && 
                    (mat.emissiveColor.r > 0.1 || mat.emissiveColor.g > 0.1 || mat.emissiveColor.b > 0.1);
                  if (!hasEmissive) {
                    if (mat.ambientColor) mat.ambientColor = new Color3(0, 0, 0);
                    if (mat.ambientTexture) mat.ambientTexture = null;
                    if (mat.disableLighting !== undefined) mat.disableLighting = true;
                    mat.markAsDirty();
                  }
                });
              }
            });
            
            // Keep screens bright
            screenMaterialsRef.current.forEach(({ material, baseEmissive }) => {
              if (material && baseEmissive) {
                material.emissiveColor = baseEmissive;
                material.emissiveIntensity = 5.0;
                if (material.disableLighting !== undefined) {
                  material.disableLighting = true;
                }
                material.markAsDirty();
              }
            });
            
            console.log('🌑 Dark mode activated - all GLB lights off, pure black, screens stay bright');
            return;
          } else {
            // Light mode: enable all GLB lights and restore base intensities
            console.log('💡 Light mode: Enabling all GLB lights and restoring base intensities');
            
            // CRITICAL: Save base intensities if not already saved
            scene.lights.forEach((light: any) => {
              const lightKey = Object.keys(lightsRef.current).find(key => 
                lightsRef.current[key as keyof typeof lightsRef.current] === light
              );
              
              // If no base intensity saved and light has intensity, save it now
              if (lightKey && 
                  baseIntensitiesRef.current[lightKey as keyof typeof baseIntensitiesRef.current] === undefined &&
                  light.intensity > 0) {
                (baseIntensitiesRef.current as any)[lightKey] = light.intensity;
                console.log(`  💾 Saved base intensity for ${light.name}: ${light.intensity.toFixed(2)}`);
              }
            });
            
            // Now restore lights
            scene.lights.forEach((light: any) => {
              light.setEnabled(true);
              console.log(`  🔦 Restoring light: ${light.name || 'unnamed'}`);
              
              // Find this light in our refs
              const lightKey = Object.keys(lightsRef.current).find(key => 
                lightsRef.current[key as keyof typeof lightsRef.current] === light
              );
              
              if (lightKey && baseIntensitiesRef.current[lightKey as keyof typeof baseIntensitiesRef.current] !== undefined) {
                // Restore from saved base intensity (ALWAYS use this if available)
                const baseIntensity = baseIntensitiesRef.current[lightKey as keyof typeof baseIntensitiesRef.current] as number;
                light.intensity = baseIntensity * currentSceneLighting;
                console.log(`    ✅ Restored from base: ${baseIntensity.toFixed(2)} × ${currentSceneLighting.toFixed(2)} = ${light.intensity.toFixed(2)}`);
              } else {
                // NO base intensity saved - use strong defaults based on light type
                console.warn(`    ⚠️ No base intensity for ${light.name}, using defaults`);
                let defaultIntensity = 1.0; // Default fallback
                
                if (light.constructor.name === 'SpotLight') {
                  defaultIntensity = 500; // Strong spotlight
                } else if (light.constructor.name === 'DirectionalLight') {
                  defaultIntensity = 1.0; // Directional
                } else if (light.constructor.name === 'HemisphericLight') {
                  defaultIntensity = 0.5; // Ambient fill
                } else if (light.constructor.name === 'PointLight') {
                  defaultIntensity = 100; // Point light
                }
                
                light.intensity = defaultIntensity * currentSceneLighting;
                // Save this as base for next time
                if (lightKey) {
                  (baseIntensitiesRef.current as any)[lightKey] = defaultIntensity;
                }
                console.log(`    🔧 Applied default: ${defaultIntensity} × ${currentSceneLighting.toFixed(2)} = ${light.intensity.toFixed(2)}`);
              }
            });
            
            // Restore materials
            scene.meshes.forEach((mesh: any) => {
              if (mesh.material) {
                const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                materials.forEach((mat: any) => {
                  if (mat.disableLighting !== undefined) mat.disableLighting = false;
                  mat.markAsDirty();
                });
              }
            });
            
            console.log(`✅ GLB lights enabled with scene lighting multiplier: ${currentSceneLighting.toFixed(2)}`);
            return;
          }
        }
        
        // Fallback to custom lighting if GLB has no lights
        console.log('⚠️ No GLB lights found, using cinematic lighting setup');
        
        // Clear existing lights (but don't dispose GLB lights if they exist)
        Object.values(lightsRef.current).forEach(light => {
          // Only dispose lights we created, not GLB lights
          if (light && light.name && !light.name.startsWith('glb')) {
            light.dispose();
          }
        });
        lightsRef.current = {};
        baseIntensitiesRef.current = {};
        
        if (!enabled) {
          // Dark mode: All lights off - pure black ambient, only emissive screens visible
          scene.ambientColor = new Color3(0, 0, 0); // Pure black
          
          // Disable all scene lights
          scene.lights.forEach((light: any) => {
            if (light.name && !light.name.startsWith('glb')) {
              light.setEnabled(false);
            }
          });
          
          // Disable ambient reflection on all materials
          scene.meshes.forEach((mesh: any) => {
            if (mesh.material) {
              const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
              materials.forEach((mat: any) => {
                const hasEmissive = mat.emissiveColor && 
                  (mat.emissiveColor.r > 0.1 || mat.emissiveColor.g > 0.1 || mat.emissiveColor.b > 0.1);
                if (!hasEmissive) {
                  if (mat.ambientColor) mat.ambientColor = new Color3(0, 0, 0);
                  if (mat.ambientTexture) mat.ambientTexture = null;
                  if (mat.disableLighting !== undefined) mat.disableLighting = true;
                  mat.markAsDirty();
                }
              });
            }
          });
          
          // Ensure screens stay bright with high emissive intensity
          screenMaterialsRef.current.forEach(({ material, baseEmissive }) => {
            if (material && baseEmissive) {
              material.emissiveColor = baseEmissive;
              material.emissiveIntensity = 5.0; // High intensity for dark mode
              if (material.disableLighting !== undefined) {
                material.disableLighting = true; // Screens emit their own light
              }
              material.markAsDirty();
            }
          });
          
          console.log('🌑 Dark mode activated - all lights off, pure black, screens stay bright');
          return;
        }
        
        // ===== CHECK GLB LIGHTS FIRST, FALLBACK IF NONE =====
        const glbLightCount = scene.lights.length;
        console.log(`🔍 Checking GLB lights: ${glbLightCount} found`);
        
        if (glbLightCount === 0) {
          console.log('⚠️ GLB has 0 lights - adding fallback HemisphericLight');
          
          // Fallback ambient light (ONLINE mode - with street lights)
          const baseAmbient = 2.8; // Higher baseline so street lights enhance, not create all light
          const ambientLight = new HemisphericLight('fallbackAmbient', new Vector3(0, 1, 0), scene);
          ambientLight.intensity = baseAmbient * currentSceneLighting;
          ambientLight.diffuse = new Color3(0.88, 0.85, 0.80); // Neutral warm
          ambientLight.groundColor = new Color3(0.15, 0.15, 0.15); // Dark ground
          lightsRef.current.ambient = ambientLight;
          baseIntensitiesRef.current.ambient = baseAmbient;
          
          console.log(`✅ Fallback ambient light created (intensity: ${baseAmbient})`);
        } else {
          console.log(`✅ Using ${glbLightCount} lights from GLB file`);
        }
      };
      
      // Expose lights refs globally so LightsPanel can access them (do this early)
      (window as any).__babylonLightsRef = lightsRef;
      (window as any).__babylonBaseIntensitiesRef = baseIntensitiesRef;
      (window as any).__babylonSceneRef = sceneRef;
      console.log('✅ Lights refs exposed to window (initial)');
      
      // DON'T call setupLighting here - wait for GLB to load first!
      // The GLB file contains its own lights that we should use
      console.log('⏳ Skipping initial lighting setup - waiting for GLB lights to load...');
      
      // Subscribe to lighting changes - use direct subscription without selector
      let previousState = { 
        preset: currentPreset, 
        enabled: lightsEnabled, 
        ambient: ambientIntensity,
        sceneLighting: sceneLightingIntensity 
      };
      
      console.log('📡 Setting up lighting store subscription...');
      console.log('  Initial state:', previousState);
      
      const unsubscribe = useLightingStore.subscribe((state) => {
        const newState = {
          preset: state.currentPreset,
          enabled: state.lightsEnabled,
          ambient: state.ambientIntensity,
          sceneLighting: state.sceneLightingIntensity
        };
        
        console.log('📨 Subscription callback fired');
        console.log('  Previous:', previousState);
        console.log('  New:', newState);
        
        // Check if anything actually changed
        if (newState.preset === previousState.preset &&
            newState.enabled === previousState.enabled &&
            newState.ambient === previousState.ambient &&
            newState.sceneLighting === previousState.sceneLighting) {
          console.log('⏭️ No actual changes detected, skipping update');
          return; // No changes, skip
        }
        
        console.log('🔔 Lighting store subscription triggered:', {
          enabled: `${previousState.enabled} → ${newState.enabled}`,
          preset: `${previousState.preset} → ${newState.preset}`,
          ambient: `${previousState.ambient.toFixed(3)} → ${newState.ambient.toFixed(3)}`,
          sceneLighting: `${previousState.sceneLighting.toFixed(2)} → ${newState.sceneLighting.toFixed(2)}`,
          sceneRefExists: !!sceneRef.current,
          lightsRefCount: Object.keys(lightsRef.current).length
        });
        
        if (!sceneRef.current) {
          console.error('❌ Scene ref is null! Cannot update lighting.');
          return;
        }
        
        // If only enabled state changed, just toggle lights
        if (newState.preset === previousState.preset && 
            newState.enabled !== previousState.enabled &&
            newState.ambient === previousState.ambient &&
            newState.sceneLighting === previousState.sceneLighting) {
          console.log(`🔌 Toggling lights: ${previousState.enabled ? 'ON' : 'OFF'} → ${newState.enabled ? 'ON' : 'OFF'}`);
          console.log('  Calling setupLighting with:', { preset: newState.preset, enabled: newState.enabled, ambient: newState.ambient });
          setupLighting(newState.preset, newState.enabled, newState.ambient);
          previousState = newState;
          console.log('✅ Toggle complete, previousState updated');
          return;
        }
        
        console.log(`🔔 Lighting state changed:`, {
          preset: `${previousState.preset} → ${newState.preset}`,
          enabled: `${previousState.enabled} → ${newState.enabled}`,
          ambient: `${previousState.ambient.toFixed(3)} → ${newState.ambient.toFixed(3)}`,
          sceneLighting: `${previousState.sceneLighting.toFixed(2)} → ${newState.sceneLighting.toFixed(2)}`
        });
        
        // If only scene lighting changed, apply multiplier to all existing lights
        if (newState.preset === previousState.preset && 
            newState.enabled === previousState.enabled && 
            newState.ambient === previousState.ambient &&
            newState.sceneLighting !== previousState.sceneLighting) {
          console.log(`💡 Applying scene lighting multiplier: ${newState.sceneLighting.toFixed(2)}`);
          applySceneLighting(newState.sceneLighting);
          
          // Ensure screens stay bright - restore their base emissive values
          screenMaterialsRef.current.forEach(({ material, baseEmissive }) => {
            if (material && baseEmissive) {
              material.emissiveColor = baseEmissive;
              material.emissiveIntensity = material.emissiveIntensity || 5.0;
              material.markAsDirty();
            }
          });
          
          console.log(`✅ Scene lighting intensity updated to ${newState.sceneLighting.toFixed(2)} (${(newState.sceneLighting * 100).toFixed(0)}%)`);
          previousState = newState;
          return;
        }
        
        // If only ambient intensity changed, update it directly without recreating all lights
        if (newState.preset === previousState.preset && 
            newState.enabled === previousState.enabled && 
            newState.ambient !== previousState.ambient &&
            newState.sceneLighting === previousState.sceneLighting) {
          // Update ambient light intensity directly
          if (lightsRef.current.ambient && baseIntensitiesRef.current.ambient !== undefined) {
            // Apply preset-specific multiplier and scene lighting
            let baseIntensity = newState.ambient;
            if (newState.preset === 'dramatic') {
              baseIntensity = newState.ambient * 0.5;
            } else if (newState.preset === 'bright') {
              baseIntensity = newState.ambient * 2;
            } else if (newState.preset === 'moody') {
              baseIntensity = newState.ambient * 0.3;
            }
            baseIntensitiesRef.current.ambient = baseIntensity;
            lightsRef.current.ambient.intensity = baseIntensity * newState.sceneLighting;
            console.log(`✅ Ambient light intensity updated to ${(baseIntensity * newState.sceneLighting).toFixed(3)} (base: ${baseIntensity.toFixed(3)}, scene: ${newState.sceneLighting.toFixed(2)}, preset: ${newState.preset})`);
          }
          previousState = newState;
          return;
        }
        
        // Preset or enabled state changed, recreate all lights with current values
        console.log(`🔄 Recreating lights due to preset/enabled change`);
        setupLighting(newState.preset, newState.enabled, newState.ambient);
        
        // Re-expose refs after lighting change
        (window as any).__babylonLightsRef = lightsRef;
        (window as any).__babylonBaseIntensitiesRef = baseIntensitiesRef;
        console.log('✅ Lights refs re-exposed after preset change:', {
          lightsCount: Object.keys(lightsRef.current).length,
          baseIntensitiesCount: Object.keys(baseIntensitiesRef.current).length
        });
        
        // If dark mode, ensure all materials are pure black except screens
        if (!newState.enabled && sceneRef.current) {
          sceneRef.current.meshes.forEach((mesh: any) => {
            if (mesh.material) {
              const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
              materials.forEach((mat: any) => {
                const hasEmissive = mat.emissiveColor && 
                  (mat.emissiveColor.r > 0.1 || mat.emissiveColor.g > 0.1 || mat.emissiveColor.b > 0.1);
                if (!hasEmissive) {
                  if (mat.ambientColor) mat.ambientColor = new Color3(0, 0, 0);
                  if (mat.ambientTexture) mat.ambientTexture = null;
                  if (mat.disableLighting !== undefined) mat.disableLighting = true;
                  mat.markAsDirty();
                }
              });
            }
          });
        }
        
        // Ensure screens stay bright after lighting recreation
        // Especially important for dark mode (lightsEnabled = false)
        screenMaterialsRef.current.forEach(({ material, baseEmissive }) => {
          if (material && baseEmissive) {
            material.emissiveColor = baseEmissive;
            // Higher intensity for dark mode
            material.emissiveIntensity = newState.enabled ? (material.emissiveIntensity || 5.0) : 5.0;
            if (material.disableLighting !== undefined) {
              material.disableLighting = true;
            }
            material.markAsDirty();
          }
        });
        
        previousState = newState;
      });
      
      console.log('✅ Lighting system initialized');
      
      // ===== VIBES SYSTEM DISABLED TEMPORARILY =====
      console.log('⚠️ Vibes system DISABLED - using default scene lighting only');
      
      console.log('📦 Loading batcave model...');
      
      // ALWAYS use Vercel Blob (works for both production and local dev)
      const glbUrl = 'https://dkpyy8zashbhkgoe.public.blob.vercel-storage.com/the_batcave.glb';

      console.log(`📂 Loading GLB from: Vercel Blob (CORS-enabled)`);
      console.log(`📦 URL: ${glbUrl}`);
      console.log('📦 File size: 121 MB uncompressed');
      console.log('⏳ Loading from Vercel Blob...');
      
      SceneLoader.AppendAsync(glbUrl, '', scene, (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total * 100).toFixed(1);
          console.log(`📥 Loading progress: ${progress}%`);
        }
      })
        .then(() => {
          console.log('✅ Batcave scene loaded!');
          
          // Remove test sphere once GLB loads successfully
          const testSphere = scene.getMeshByName('testSphere');
          if (testSphere) {
            testSphere.dispose();
            console.log('✅ Test sphere removed - GLB loaded successfully');
          }
          
          // ===== INSPECT GLB DEFAULT CONTENT =====
          console.log('📋 ===== GLB FILE CONTENTS =====');
          console.log('🔦 Lights in GLB:', scene.lights.length);
          scene.lights.forEach((light, idx) => {
            console.log(`  [${idx}] ${light.name || 'Unnamed'} - Type: ${light.getClassName()}, Enabled: ${light.isEnabled()}, Intensity: ${(light as any).intensity || 'N/A'}`);
          });
          
          console.log('📷 Cameras in GLB:', scene.cameras.length);
          scene.cameras.forEach((cam, idx) => {
            console.log(`  [${idx}] ${cam.name || 'Unnamed'} - Type: ${cam.getClassName()}, Position: (${cam.position.x.toFixed(2)}, ${cam.position.y.toFixed(2)}, ${cam.position.z.toFixed(2)})`);
          });
          
          console.log('🌍 Environment:', {
            environmentTexture: scene.environmentTexture ? 'Found' : 'None',
            environmentIntensity: scene.environmentIntensity || 'N/A',
            ambientColor: scene.ambientColor ? `(${scene.ambientColor.r.toFixed(3)}, ${scene.ambientColor.g.toFixed(3)}, ${scene.ambientColor.b.toFixed(3)})` : 'None'
          });
          
          console.log('📦 Meshes:', scene.meshes.length);
          console.log('🎨 Materials:', scene.materials.length);
          
          // ===== USE GLB's NATIVE LIGHTS AS DEFAULT =====
          console.log('💡 Using GLB native lights as default preset...');
          
          // Find and store GLB lights by type
          const glbLights = {
            spotLights: scene.lights.filter(l => l instanceof SpotLight) as SpotLight[],
            directionalLights: scene.lights.filter(l => l instanceof DirectionalLight) as DirectionalLight[],
            pointLights: scene.lights.filter(l => l instanceof PointLight) as PointLight[],
            hemisphericLights: scene.lights.filter(l => l instanceof HemisphericLight) as HemisphericLight[],
          };
          
          console.log(`  Found: ${glbLights.spotLights.length} spots, ${glbLights.directionalLights.length} directional, ${glbLights.pointLights.length} points, ${glbLights.hemisphericLights.length} hemispheric`);
          
          // Store GLB lights in lightsRef for control
          if (glbLights.spotLights.length > 0) {
            lightsRef.current.keySpot = glbLights.spotLights[0];
            baseIntensitiesRef.current.keySpot = glbLights.spotLights[0].intensity;
            console.log(`  ✅ Key spotlight: ${glbLights.spotLights[0].name} (intensity: ${glbLights.spotLights[0].intensity})`);
          }
          
          if (glbLights.spotLights.length > 1) {
            lightsRef.current.rimSpot = glbLights.spotLights[1];
            baseIntensitiesRef.current.rimSpot = glbLights.spotLights[1].intensity;
            console.log(`  ✅ Rim spotlight: ${glbLights.spotLights[1].name} (intensity: ${glbLights.spotLights[1].intensity})`);
          }
          
          if (glbLights.directionalLights.length > 0) {
            lightsRef.current.mainDir = glbLights.directionalLights[0];
            baseIntensitiesRef.current.mainDir = glbLights.directionalLights[0].intensity;
            console.log(`  ✅ Directional light: ${glbLights.directionalLights[0].name} (intensity: ${glbLights.directionalLights[0].intensity})`);
          }
          
          if (glbLights.hemisphericLights.length > 0) {
            lightsRef.current.ambient = glbLights.hemisphericLights[0];
            baseIntensitiesRef.current.ambient = glbLights.hemisphericLights[0].intensity;
            console.log(`  ✅ Hemispheric light: ${glbLights.hemisphericLights[0].name} (intensity: ${glbLights.hemisphericLights[0].intensity})`);
          }
          
          // GLB has no light objects, but has emissive lamp meshes
          // Find the lamp meshes and create lights at their positions
          console.log('🔍🔍🔍 SEARCHING FOR LAMP MESHES TO CREATE VOLUMETRIC LIGHTS...');
          
          // Search by name first
          const lampMeshesByName = scene.meshes.filter(m => 
            m.name && (
              m.name.toLowerCase().includes('lamp') ||
              m.name.toLowerCase().includes('light') ||
              m.name.toLowerCase().includes('bulb') ||
              m.name.toLowerCase().includes('lantern')
            )
          );
          console.log(`  📛 Found ${lampMeshesByName.length} meshes by name:`, lampMeshesByName.map(m => m.name));
          
          // Search by emissive material (meshes with glowing yellow materials)
          const emissiveMeshes = scene.meshes.filter(m => {
            if (!m.material) return false;
            const mat = m.material as any;
            if (mat.emissiveColor) {
              const r = mat.emissiveColor.r;
              const g = mat.emissiveColor.g;
              const b = mat.emissiveColor.b;
              // Look for yellow/orange emissives (more red+green than blue)
              return (r > 0.3 || g > 0.3) && (r + g > b * 1.5);
            }
            return false;
          });
          console.log(`  💡 Found ${emissiveMeshes.length} meshes with yellow/orange emissive:`, emissiveMeshes.map(m => m.name));
          
          // Use emissive meshes if found, otherwise name-based
          const lampMeshes = emissiveMeshes.length >= 2 ? emissiveMeshes : lampMeshesByName;
          console.log(`  ✅ Using ${lampMeshes.length} lamp meshes for light creation`);
          
          // Make yellow lamp MESHES glow (emissive) + create actual PointLights
          console.log('  💡 Making yellow lamp MESHES emissive + creating street lights...');
          
          let emissiveMeshCount = 0;
          lampMeshes.forEach((lampMesh: any) => {
            if (lampMesh.material) {
              const materials = Array.isArray(lampMesh.material) ? lampMesh.material : [lampMesh.material];
              materials.forEach((mat: any) => {
                if (mat.emissiveColor || mat.emissiveTexture) {
                  mat.emissiveIntensity = 8.0; // Brighter mesh glow to match stronger lights
                  mat.disableLighting = true; // Meshes emit light, not receive
                  mat.markAsDirty();
                  emissiveMeshCount++;
                }
              });
            }
          });
          console.log(`    ✅ Made ${emissiveMeshCount} yellow lamp materials emissive (intensity: 8.0)`);
          
          // TEST: Try different light types - CHANGE THIS TO SWITCH
          const LIGHT_TYPE: 'point' | 'spot' | 'directional' = 'spot'; // <-- Change to test different types
          
          console.log('🔦 STREET LIGHT TEST MODE');
          console.log(`   Current type: ${LIGHT_TYPE.toUpperCase()}`);
          console.log('   Change LIGHT_TYPE to: "point", "spot", or "directional" to test');
          
          // Find 2 lamps: left entry + above car
          const leftEntryLamp = lampMeshes.find((lamp: any) => {
            const pos = lamp.getAbsolutePosition();
            return pos.x < -3 && pos.y > 2; // Left side, elevated
          });
          
          const carLamp = lampMeshes.find((lamp: any) => {
            const pos = lamp.getAbsolutePosition();
            return Math.abs(pos.x) < 3 && Math.abs(pos.z) < 3 && pos.y > 3; // Center, high up
          });
          
          // Sodium vapor color - warm golden orange
          const sodiumColor = new Color3(1.0, 0.7, 0.35); // More orange
          const sodiumSpecular = new Color3(0.7, 0.5, 0.25);
          
          let streetLightsCreated = 0;
          
          if (LIGHT_TYPE === 'point') {
            // POINTLIGHT - omnidirectional sphere of light
            if (leftEntryLamp) {
              const light = new PointLight('leftStreetLight', leftEntryLamp.getAbsolutePosition(), scene);
              light.intensity = 300; // Much higher
              light.range = 35;
              light.diffuse = sodiumColor;
              light.specular = sodiumSpecular;
              streetLightsCreated++;
              console.log(`    ✅ LEFT PointLight (intensity: 300, range: 35)`);
            }
            if (carLamp) {
              const light = new PointLight('carStreetLight', carLamp.getAbsolutePosition(), scene);
              light.intensity = 300;
              light.range = 35;
              light.diffuse = sodiumColor;
              light.specular = sodiumSpecular;
              streetLightsCreated++;
              console.log(`    ✅ CAR PointLight (intensity: 300, range: 35)`);
            }
            
          } else if (LIGHT_TYPE === 'spot') {
            // SPOTLIGHT - directional cone (like real street lamp)
            if (leftEntryLamp) {
              const pos = leftEntryLamp.getAbsolutePosition();
              const light = new SpotLight(
                'leftStreetLight',
                pos,
                new Vector3(0, -1, 0.2), // Aim downward and slightly forward
                Math.PI / 3, // 60 degree cone
                2, // Soft falloff
                scene
              );
              light.intensity = 800; // SpotLights need higher intensity
              light.range = 40;
              light.diffuse = sodiumColor;
              light.specular = sodiumSpecular;
              streetLightsCreated++;
              console.log(`    ✅ LEFT SpotLight (intensity: 800, angle: 60°, aimed down+forward)`);
            }
            if (carLamp) {
              const pos = carLamp.getAbsolutePosition();
              const light = new SpotLight(
                'carStreetLight',
                pos,
                new Vector3(0, -1, 0), // Aim straight down at car
                Math.PI / 3,
                2,
                scene
              );
              light.intensity = 800;
              light.range = 40;
              light.diffuse = sodiumColor;
              light.specular = sodiumSpecular;
              streetLightsCreated++;
              console.log(`    ✅ CAR SpotLight (intensity: 800, angle: 60°, aimed down)`);
            }
            
          } else if (LIGHT_TYPE === 'directional') {
            // DIRECTIONALLIGHT - sun-like parallel rays
            const light = new DirectionalLight(
              'streetLight',
              new Vector3(0, -1, 0.3),
              scene
            );
            light.position = new Vector3(0, 10, -5);
            light.intensity = 3.0;
            light.diffuse = sodiumColor;
            light.specular = sodiumSpecular;
            streetLightsCreated++;
            console.log(`    ✅ DirectionalLight (intensity: 3.0)`);
          }
          
          console.log(`  ✅ Created ${streetLightsCreated} sodium vapor street lights (type: ${LIGHT_TYPE})`);
          
          console.log('✅ GLB native lights loaded and stored as default preset');
          console.log('🖼️ Textures:', scene.textures.length);
          console.log('📋 ===== END GLB CONTENTS =====');
          
          // Check total GLB lights count
          const totalGLBLights = glbLights.spotLights.length + glbLights.directionalLights.length + 
                                 glbLights.pointLights.length + glbLights.hemisphericLights.length;
          
          // If GLB has lights, we've already mapped them above
          if (totalGLBLights > 0) {
            console.log(`✅ GLB contains ${totalGLBLights} lights - using native GLB lights`);
            
            // NOW that GLB lights are loaded and mapped, apply lighting state
            console.log('🎬 Calling setupLighting NOW that GLB lights are ready...');
            setupLighting(useLightingStore.getState().currentPreset, useLightingStore.getState().lightsEnabled);
            
            // Re-expose refs after GLB lights are mapped
            (window as any).__babylonLightsRef = lightsRef;
            (window as any).__babylonBaseIntensitiesRef = baseIntensitiesRef;
            console.log('✅ Lights refs updated after GLB load:', {
              lightsCount: Object.keys(lightsRef.current).length,
              baseIntensitiesCount: Object.keys(baseIntensitiesRef.current).length
            });
          } else {
            console.log('⚠️ GLB has no lights - creating custom lighting...');
            
            // Fallback: Create custom lights if GLB truly has none
            setupLighting(useLightingStore.getState().currentPreset, useLightingStore.getState().lightsEnabled);
            
            // Fallback: Create custom lights if GLB has none
            scene.lights.forEach((light, idx) => {
              const lightName = light.name || `glbLight${idx}`;
              console.log(`  Mapping GLB light: ${lightName} (${light.getClassName()})`);
              
              // Try to identify light types and map them
              if (light instanceof HemisphericLight) {
                if (!lightsRef.current.ambient) {
                  lightsRef.current.ambient = light;
                  baseIntensitiesRef.current.ambient = (light as any).intensity || 1.0;
                  console.log(`    → Mapped to 'ambient'`);
                } else if (!lightsRef.current.fill) {
                  lightsRef.current.fill = light;
                  baseIntensitiesRef.current.fill = (light as any).intensity || 1.0;
                  console.log(`    → Mapped to 'fill'`);
                }
              } else if (light instanceof SpotLight) {
                if (!lightsRef.current.keySpot) {
                  lightsRef.current.keySpot = light;
                  baseIntensitiesRef.current.keySpot = (light as any).intensity || 1.0;
                  console.log(`    → Mapped to 'keySpot'`);
                } else if (!lightsRef.current.rimSpot) {
                  lightsRef.current.rimSpot = light;
                  baseIntensitiesRef.current.rimSpot = (light as any).intensity || 1.0;
                  console.log(`    → Mapped to 'rimSpot'`);
                }
              } else if (light instanceof DirectionalLight) {
                if (!lightsRef.current.mainDir) {
                  lightsRef.current.mainDir = light;
                  baseIntensitiesRef.current.mainDir = (light as any).intensity || 1.0;
                  console.log(`    → Mapped to 'mainDir'`);
                }
              } else if (light instanceof PointLight) {
                if (!lightsRef.current.point1) {
                  lightsRef.current.point1 = light;
                  baseIntensitiesRef.current.point1 = (light as any).intensity || 1.0;
                  console.log(`    → Mapped to 'point1'`);
                } else if (!lightsRef.current.point2) {
                  lightsRef.current.point2 = light;
                  baseIntensitiesRef.current.point2 = (light as any).intensity || 1.0;
                  console.log(`    → Mapped to 'point2'`);
                }
              }
            });
            
            // Re-expose refs after mapping GLB lights
            (window as any).__babylonLightsRef = lightsRef;
            (window as any).__babylonBaseIntensitiesRef = baseIntensitiesRef;
            console.log('✅ GLB lights mapped and refs exposed');
          }
          
          // Get all meshes from scene (AppendAsync adds to scene.meshes directly)
          const meshes = scene.meshes.filter((m: any) => {
            if (m.name === '__root__') return false;
            if (!m.getTotalVertices) return false;
            return m.getTotalVertices() > 0;
          });
          
          console.log(`✅ Processing ${meshes.length} meshes`);
          
          // IMPORTANT: Check ALL scene nodes for background/environment
          // Some GLBs have background as nodes or environment textures
          console.log('📋 Checking scene for environment/background...');
          console.log('  - Environment texture:', scene.environmentTexture ? 'Found' : 'Not found');
          console.log('  - Total meshes:', scene.meshes.length);
          console.log('  - Total nodes:', scene.getNodes ? scene.getNodes().length : 'N/A');
          
          // Check for environment texture FIRST (AppendAsync loads it)
          if (scene.environmentTexture) {
            console.log('✅ GLB includes environment texture - creating skybox');
            // Create skybox from environment texture
            const skybox = MeshBuilder.CreateBox('skybox', { size: 1000 }, scene);
            const skyboxMaterial = new PBRMaterial('skyboxMat', scene);
            skyboxMaterial.backFaceCulling = false;
            skyboxMaterial.disableLighting = true;
            skyboxMaterial.reflectionTexture = scene.environmentTexture;
            skyboxMaterial.reflectionTexture.coordinatesMode = 1; // SKYBOX_MODE
            skyboxMaterial.microSurface = 1.0;
            skybox.material = skyboxMaterial;
            skybox.infiniteDistance = true;
            scene.clearColor = new Color4(0, 0, 0, 0); // Transparent to show skybox
            console.log('✅ Skybox created from environment texture');
          }
          
          // Log all mesh names to debug background detection
          console.log('📋 All mesh names:', meshes.map((m: any) => m.name));
          
          // IMPORTANT: Ensure ALL meshes are visible first (GLB might have background meshes)
          // This includes any background meshes that came with the GLB
          meshes.forEach((mesh: any) => {
            mesh.setEnabled(true);
            mesh.visibility = 1;
            mesh.isVisible = true;
            
            // Don't apply shadows to background meshes (they shouldn't receive shadows)
            const name = mesh.name.toLowerCase();
            const isBackground = name.includes('sky') || 
                   name.includes('background') ||
                   name.includes('dome') ||
                   name.includes('environment') ||
                   name.includes('backdrop') ||
                   name.includes('bg');
            
            if (!isBackground) {
              mesh.receiveShadows = true;
            }
          });
          
          // Check for background/environment meshes - be more inclusive
          const backgroundMeshes = meshes.filter((m: any) => {
            const name = m.name.toLowerCase();
            // Check for common background/skybox names
            const nameMatch = name.includes('sky') || 
                   name.includes('background') ||
                   name.includes('dome') ||
                   name.includes('environment') ||
                   name.includes('hemisphere') ||
                   name.includes('hemi') ||
                   name.includes('ground') ||
                   name.includes('floor') ||
                   name.includes('base') ||
                   name.includes('world') ||
                   name.includes('space') ||
                   name.includes('backdrop') ||
                   name.includes('bg');
            
            // Also check if mesh is very large (likely background)
            let sizeMatch = false;
            if (m.getBoundingInfo) {
              try {
                const size = m.getBoundingInfo().boundingBox.extendSizeWorld.length();
                sizeMatch = size > 50;
              } catch (e) {
                // Ignore errors
              }
            }
            
            return nameMatch || sizeMatch;
          });
          
          console.log(`🔍 Found ${backgroundMeshes.length} potential background meshes`);
          backgroundMeshes.forEach((bg: any) => {
            const size = bg.getBoundingInfo?.()?.boundingBox?.extendSizeWorld?.length() || 'unknown';
            console.log(`  - ${bg.name} (size: ${size})`);
          });
          
          if (backgroundMeshes.length > 0) {
            console.log(`✅ Enabling ${backgroundMeshes.length} background meshes`);
            // Make background meshes visible and ensure they render
            backgroundMeshes.forEach((bg: any) => {
              bg.setEnabled(true);
              bg.visibility = 1;
              bg.isVisible = true;
              // Ensure materials are visible
              if (bg.material) {
                const materials = Array.isArray(bg.material) ? bg.material : [bg.material];
                materials.forEach((mat: any) => {
                  mat.alpha = 1;
                  mat.opacityTexture = null; // Remove any opacity that might hide it
                  // Ensure material is not transparent
                  if (mat.diffuseColor) {
                    mat.diffuseColor.a = 1;
                  }
                  if (mat.albedoColor) {
                    mat.albedoColor.a = 1;
                  }
                });
              }
            });
            // Set black background to show GLB's background meshes
            scene.clearColor = new Color4(0, 0, 0, 1);
            console.log('✅ Background enabled, using GLB background');
          } else if (scene.environmentTexture) {
            console.log('✅ GLB includes environment texture');
            scene.clearColor = new Color4(0, 0, 0, 0);
          } else {
            console.log('⚠️ No background meshes or environment texture found');
            console.log('💡 Using transparent background - GLB background should still be visible');
            // Keep transparent - the GLB's background meshes should still render
            scene.clearColor = new Color4(0, 0, 0, 0);
          }
          
          // Enable ALL lights from GLB model - turn them ON
          console.log(`💡 Found ${scene.lights.length} lights in GLB model`);
          scene.lights.forEach((light: any) => {
            light.setEnabled(true);
            // Turn on lights - if intensity is 0 or very low, set to visible level
            if (light.intensity !== undefined) {
              if (light.intensity === 0 || light.intensity < 0.1) {
                light.intensity = 1.0; // Turn on lights that were off
              }
            }
            console.log(`  ✅ Enabled light: ${light.name || 'unnamed'}, intensity: ${light.intensity}`);
          });
          
          console.log(`💡 Turned ON ${scene.lights.length} lights from GLB`);
          
          // Setup camera based on mode - define before avatar loading
          const setupCamera = (mode: 'first' | 'third', avatarMesh: AbstractMesh | null) => {
            // Cleanup previous camera observers
            if (camera && (camera as any).__avatarObserver) {
              scene.onBeforeRenderObservable.remove((camera as any).__avatarObserver);
            }
            
            if (camera && typeof camera.detachControl === 'function') {
              camera.detachControl();
            }
            
            if (!avatarMesh) {
              console.warn('⚠️ Cannot setup camera: avatar not loaded yet');
              return;
            }
            
            if (mode === 'first') {
              // First person - camera at avatar head position
              const avatarPos = avatarMesh.position.clone();
              avatarPos.y += 1.6; // Eye level
              const freeCam = new FreeCamera('firstPersonCamera', avatarPos, scene);
              freeCam.attachControl(canvasRef.current, true);
              freeCam.speed = 0.3;
              freeCam.angularSensibility = 1000;
              freeCam.inertia = 0.9;
              freeCam.applyGravity = false;
              freeCam.keysUp = [87]; // W
              freeCam.keysDown = [83]; // S
              freeCam.keysLeft = [65]; // A
              freeCam.keysRight = [68]; // D
              
              // Link camera to avatar movement - update avatar position from camera
              const avatarUpdateObserver = scene.onBeforeRenderObservable.add(() => {
                if (avatarMesh && freeCam) {
                  const camPos = freeCam.position.clone();
                  camPos.y -= 1.6; // Adjust to avatar body position
                  avatarMesh.position.x = camPos.x;
                  avatarMesh.position.z = camPos.z;
                  avatarMesh.rotation.y = freeCam.rotation.y;
                }
              });
              
              // Store observer for cleanup
              (freeCam as any).__avatarObserver = avatarUpdateObserver;
              
              scene.activeCamera = freeCam;
              camera = freeCam;
              freeCameraModeRef.current = true;
              console.log('✅ First person camera activated');
            } else {
              // Third person - ArcRotateCamera following avatar
              const arcCam = new ArcRotateCamera(
                'thirdPersonCamera',
                -Math.PI / 2,
                Math.PI / 3,
                5,
                avatarMesh.position.clone(),
                scene
              );
              arcCam.attachControl(canvasRef.current, true);
              arcCam.lowerRadiusLimit = 2;
              arcCam.upperRadiusLimit = 20;
              arcCam.wheelDeltaPercentage = 0.01;
              
              // Enhanced mouse sensitivity for third-person camera
              arcCam.angularSensibilityX = 500;
              arcCam.angularSensibilityY = 500;
              arcCam.panningSensibility = 50;
              arcCam.inertia = 0.9;
              
              console.log('✅ Third-person camera controls linked to cursor');
              
              // Link camera to avatar - camera follows avatar
              const cameraFollowObserver = scene.onBeforeRenderObservable.add(() => {
                if (avatarMesh && arcCam) {
                  arcCam.setTarget(avatarMesh.position);
                }
              });
              
              // Store observer for cleanup
              (arcCam as any).__avatarObserver = cameraFollowObserver;
              
              scene.activeCamera = arcCam;
              camera = arcCam;
              freeCameraModeRef.current = false;
              console.log('✅ Third person camera activated');
            }
          };
          
          // Create avatar - try to load Mixamo GLB, fallback to capsule
          const createAvatar = async () => {
            if (avatarRef.current) {
              avatarRef.current.dispose();
            }
            
            // Try to load Mixamo avatar GLB
            const avatarFiles = ['avatar.glb', 'mixamo_avatar.glb', 'character.glb'];
            let avatarLoaded = false;
            
            for (const avatarFile of avatarFiles) {
              try {
                console.log(`📦 Attempting to load avatar: ${avatarFile}`);
                const result = await SceneLoader.ImportMeshAsync('', '/', avatarFile, scene);
                
                if (result.meshes.length > 0) {
                  // Find the root mesh (usually the largest or first mesh)
                  let avatarMesh: AbstractMesh | null = null;
                  
                  // Look for a root mesh or the largest mesh
                  const meshes = result.meshes.filter(m => m.getTotalVertices && m.getTotalVertices() > 0);
                  if (meshes.length > 0) {
                    // Find root mesh (no parent) or largest mesh
                    avatarMesh = meshes.find(m => !m.parent) || meshes[0];
                    
                    // If still not found, use the largest mesh
                    if (!avatarMesh) {
                      let maxVertices = 0;
                      meshes.forEach(m => {
                        const vertices = m.getTotalVertices();
                        if (vertices > maxVertices) {
                          maxVertices = vertices;
                          avatarMesh = m;
                        }
                      });
                    }
                  }
                  
                  if (avatarMesh) {
                    // Set up the avatar mesh
                    avatarMesh.name = 'avatar';
                    avatarMesh.position = new Vector3(0, 0, 0);
                    
                    // Enable shadows - receiveShadows is valid, but castShadows must use shadowGenerator
                    avatarMesh.receiveShadows = true;
                    
                    // Add to shadow generator if it exists
                    const mainLight = scene.getLightByName('mainLight');
                    if (mainLight && (mainLight as any).getShadowGenerator) {
                      const shadowGenerator = (mainLight as any).getShadowGenerator();
                      if (shadowGenerator) {
                        shadowGenerator.addShadowCaster(avatarMesh, true);
                      }
                    }
                    
                    // Enable shadows for all child meshes
                    avatarMesh.getChildMeshes().forEach((child: AbstractMesh) => {
                      child.receiveShadows = true;
                      if (mainLight && (mainLight as any).getShadowGenerator) {
                        const shadowGenerator = (mainLight as any).getShadowGenerator();
                        if (shadowGenerator) {
                          shadowGenerator.addShadowCaster(child, true);
                        }
                      }
                    });
                    
                    // Scale avatar if needed (Mixamo avatars are typically ~1.8m tall)
                    // Check bounding box to determine if scaling is needed
                    if (avatarMesh.getBoundingInfo) {
                      const bounds = avatarMesh.getBoundingInfo();
                      const height = bounds.boundingBox.extendSizeWorld.y * 2;
                      // If avatar is too small or too large, scale it
                      if (height < 1.0 || height > 3.0) {
                        const targetHeight = 1.8; // Standard human height
                        const scale = targetHeight / height;
                        avatarMesh.scaling = new Vector3(scale, scale, scale);
                        console.log(`📏 Scaled avatar from ${height.toFixed(2)}m to ${targetHeight}m (scale: ${scale.toFixed(2)})`);
                      }
                    }
                    
                    avatarRef.current = avatarMesh;
                    console.log(`✅ Mixamo avatar loaded: ${avatarFile}`);
                    avatarLoaded = true;
                    return avatarMesh;
                  }
                }
              } catch (error: any) {
                console.log(`⚠️ Failed to load ${avatarFile}:`, error.message);
                // Continue to next file or fallback
              }
            }
            
            // Fallback: Create a simple capsule avatar if GLB loading failed
            if (!avatarLoaded) {
              console.log('💡 Creating fallback capsule avatar (place avatar.glb in /public folder for Mixamo avatar)');
              
              const avatarBody = MeshBuilder.CreateCylinder('avatarBody', {
                height: 1.8,
                diameter: 0.4,
                tessellation: 16
              }, scene);
              
              const avatarHead = MeshBuilder.CreateSphere('avatarHead', {
                diameter: 0.35,
                segments: 16
              }, scene);
              
              avatarHead.position.y = 1.0;
              avatarHead.parent = avatarBody;
              
              // Create avatar material - neutral grey (not blue!)
              const avatarMaterial = new StandardMaterial('avatarMat', scene);
              avatarMaterial.diffuseColor = new Color3(0.3, 0.3, 0.3); // Neutral grey
              avatarMaterial.specularColor = new Color3(0.2, 0.2, 0.2);
              avatarBody.material = avatarMaterial;
              avatarHead.material = avatarMaterial;
              
              // Position avatar at origin
              avatarBody.position = new Vector3(0, 0.9, 0);
              avatarBody.receiveShadows = true;
              avatarHead.receiveShadows = true;
              
              // Add to shadow generator if it exists
              const mainLight = scene.getLightByName('mainLight');
              if (mainLight && (mainLight as any).getShadowGenerator) {
                const shadowGenerator = (mainLight as any).getShadowGenerator();
                if (shadowGenerator) {
                  shadowGenerator.addShadowCaster(avatarBody, true);
                  shadowGenerator.addShadowCaster(avatarHead, true);
                }
              }
              
              avatarRef.current = avatarBody;
              console.log('✅ Fallback capsule avatar created');
              return avatarBody;
            }
            
            return avatarRef.current;
          };
          
          // Load avatar asynchronously
          const avatarPromise = createAvatar();
          let avatar: AbstractMesh | null = null;
          
          avatarPromise.then((loadedAvatar) => {
            avatar = loadedAvatar;
            // Setup camera after avatar is loaded
            setupCamera(cameraMode, avatar);
            
            // Subscribe to camera mode changes
            const cameraUnsubscribe = useCameraStore.subscribe((state) => {
              const mode = state.cameraMode;
              if (sceneRef.current && avatar) {
                setupCamera(mode, avatar);
              }
            });
            
            // Store unsubscribe for cleanup
            (window as any).__cameraUnsubscribe = cameraUnsubscribe;
          }).catch((error) => {
            console.error('❌ Failed to create avatar:', error);
            // Create fallback avatar synchronously
            const avatarBody = MeshBuilder.CreateCylinder('avatarBody', {
              height: 1.8,
              diameter: 0.4,
              tessellation: 16
            }, scene);
            const avatarHead = MeshBuilder.CreateSphere('avatarHead', {
              diameter: 0.35,
              segments: 16
            }, scene);
            avatarHead.position.y = 1.0;
            avatarHead.parent = avatarBody;
            const avatarMaterial = new StandardMaterial('avatarMat', scene);
            avatarMaterial.diffuseColor = new Color3(0.3, 0.3, 0.3); // Neutral grey
            avatarBody.material = avatarMaterial;
            avatarHead.material = avatarMaterial;
            avatarBody.position = new Vector3(0, 0.9, 0);
            avatarBody.receiveShadows = true;
            avatarHead.receiveShadows = true;
            
            // Add to shadow generator if it exists
            const mainLight = scene.getLightByName('mainLight');
            if (mainLight && (mainLight as any).getShadowGenerator) {
              const shadowGenerator = (mainLight as any).getShadowGenerator();
              if (shadowGenerator) {
                shadowGenerator.addShadowCaster(avatarBody, true);
                shadowGenerator.addShadowCaster(avatarHead, true);
              }
            }
            
            avatarRef.current = avatarBody;
            avatar = avatarBody;
            setupCamera(cameraMode, avatar);
            
            // Subscribe to camera mode changes
            const cameraUnsubscribe = useCameraStore.subscribe((state) => {
              const mode = state.cameraMode;
              if (sceneRef.current && avatar) {
                setupCamera(mode, avatar);
              }
            });
            (window as any).__cameraUnsubscribe = cameraUnsubscribe;
          });
          
          // Temporary avatar for initial camera setup (will be replaced when GLB loads)
          const tempAvatar = MeshBuilder.CreateCylinder('tempAvatar', {
            height: 1.8,
            diameter: 0.4,
            tessellation: 16
          }, scene);
          tempAvatar.position = new Vector3(0, 0.9, 0);
          tempAvatar.setEnabled(false); // Hide temporary avatar
          avatar = tempAvatar;
          
          // Initial camera setup with temporary avatar (will be updated when real avatar loads)
          setupCamera(cameraMode, tempAvatar);
          
          // Find and enable screens from GLB model - turn them ON
          const screenMeshes = meshes.filter((mesh: any) => {
            const name = mesh.name.toLowerCase();
            return name.includes('screen') || 
                   name.includes('monitor') || 
                   name.includes('display') ||
                   name.includes('tv') ||
                   name.includes('panel');
          });
          
          console.log(`📺 Found ${screenMeshes.length} screen meshes in GLB`);
          screenMaterialsRef.current = []; // Clear previous screen materials
          screenMeshes.forEach((screenMesh: any) => {
            screenMesh.setEnabled(true);
            screenMesh.visibility = 1;
            screenMesh.isVisible = true;
            
            // Enable emissive materials on screens to make them glow/visible
            // ONLY boost intensity - DON'T change colors (preserve GLB's original blue/cyan)
            if (screenMesh.material) {
              const materials = Array.isArray(screenMesh.material) ? screenMesh.material : [screenMesh.material];
              materials.forEach((mat: any) => {
                if (mat.emissiveColor) {
                  // Store original emissive color (DON'T modify it!)
                  const baseEmissive = new Color3(mat.emissiveColor.r, mat.emissiveColor.g, mat.emissiveColor.b);
                  
                  // ONLY boost intensity - preserve original color (blue Batman screens!)
                  mat.emissiveIntensity = 10.0; // Very high - screens must glow in dark cave
                  
                  // Disable lighting so screens emit regardless of scene darkness
                  if (mat.disableLighting !== undefined) {
                    mat.disableLighting = true;
                  }
                  mat.markAsDirty();
                  
                  // Store screen material reference with original emissive
                  screenMaterialsRef.current.push({ material: mat, baseEmissive });
                }
              });
            }
            console.log(`  ✅ Enabled screen: ${screenMesh.name}`);
          });
          
          // Also check for meshes with emissive materials (lights/screens)
          // ONLY boost intensity - DON'T change colors
          meshes.forEach((mesh: any) => {
            if (mesh.material) {
              const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
              materials.forEach((mat: any) => {
                if (mat.emissiveColor) {
                  const emissive = mat.emissiveColor;
                  const emissiveIntensity = emissive.r + emissive.g + emissive.b;
                  
                  // If material has ANY emissive color, boost intensity (preserve color!)
                  if (emissiveIntensity > 0.01) {
                    // Store ORIGINAL emissive color (DON'T modify!)
                    const baseEmissive = new Color3(emissive.r, emissive.g, emissive.b);
                    
                    // ONLY boost intensity - preserve original color
                    mat.emissiveIntensity = 10.0; // Very high - emissives must glow in dark cave
                    if (mat.disableLighting !== undefined) {
                      mat.disableLighting = true;
                    }
                    mat.markAsDirty();
                    
                    screenMaterialsRef.current.push({ material: mat, baseEmissive });
                    console.log(`  💡 Boosted emissive intensity for: ${mesh.name} (color preserved)`);
                  }
                }
              });
            }
          });
          
          console.log(`📺 Turned ON ${screenMeshes.length} screens from GLB`);
          
          // Process all meshes to ensure textures and materials are properly loaded
          meshes.forEach((mesh: any) => {
            // Check if this is a background mesh
            const name = mesh.name.toLowerCase();
            const isBackground = name.includes('sky') || 
                   name.includes('background') ||
                   name.includes('dome') ||
                   name.includes('environment') ||
                   name.includes('backdrop') ||
                   name.includes('bg');
            
            // Enable shadows (receive shadows) - but not for background meshes
            if (!isBackground) {
              mesh.receiveShadows = true;
            }
            
            // Ensure mesh is visible
            mesh.setEnabled(true);
            mesh.visibility = 1;
            mesh.isVisible = true;
            
            // Ensure materials are properly updated
            if (mesh.material) {
              const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
              materials.forEach((mat: any) => {
                mat.needsUpdate = true;
                
                // For background materials, ensure they're fully visible and not affected by lighting
                if (isBackground) {
                  mat.alpha = 1;
                  mat.opacityTexture = null;
                  // Disable lighting on background materials so they show their original colors
                  if (mat.disableLighting !== undefined) {
                    mat.disableLighting = true;
                  }
                  // Ensure no transparency
                  if (mat.diffuseColor) {
                    mat.diffuseColor.a = 1;
                  }
                  if (mat.albedoColor) {
                    mat.albedoColor.a = 1;
                  }
                } else {
                  // Handle PBR materials for non-background meshes - ensure they receive light
                  // Make sure lighting is enabled
                  if (mat.disableLighting !== undefined) {
                    mat.disableLighting = false; // Enable lighting for scene meshes
                  }
                  
                  // CRITICAL: Ensure shaders are enabled - disable unlit mode
                  if (mat.unlit !== undefined) {
                    mat.unlit = false; // Enable shader-based lighting
                  }
                  
                  // Force shader compilation by marking material as dirty
                  mat.markAsDirty();
                  
                  // DON'T TOUCH MATERIALS - Let GLB materials render as-is
                  // Preserve original PBR values completely
                  
                  // For PBR materials, ensure all shader features are enabled
                  if (mat.getClassName && mat.getClassName() === 'PBRMaterial') {
                    // Force PBR shader features
                    mat.usePhysicalLightFalloff = true;
                    mat.useRadianceOverAlpha = true;
                    mat.environmentBRDF = true;
                    // Ensure textures are properly bound
                    if (mat.albedoTexture) mat.albedoTexture.updateSamplingMode(2);
                    if (mat.normalTexture) mat.normalTexture.updateSamplingMode(2);
                    if (mat.metallicRoughnessTexture) mat.metallicRoughnessTexture.updateSamplingMode(2);
                  }
                  
                  // Ensure emissive is not overriding lighting (unless it's meant to glow)
                  if (mat.emissiveColor) {
                    const emissive = mat.emissiveColor;
                    // Only keep emissive if it's significant (for screens/lights)
                    if (emissive.r < 0.1 && emissive.g < 0.1 && emissive.b < 0.1) {
                      mat.emissiveColor = new Color3(0, 0, 0);
                    }
                  }
                  
                  // Force shader recompilation
                  mat.markAsDirty();
                  mat.getEffect?.(); // Force effect compilation
                }
                
                // CRITICAL: Force all textures to load and initialize properly
                const textureTypes = [
                  'diffuseTexture', 'albedoTexture', 'baseTexture', 'baseColorTexture',
                  'normalTexture', 'bumpTexture', 'normalMap',
                  'roughnessMetallicTexture', 'metallicRoughnessTexture', 'roughnessTexture', 'metallicTexture',
                  'emissiveTexture', 'occlusionTexture', 'ambientTexture', 'ambientOcclusionTexture',
                  'specularTexture', 'specularGlossinessTexture',
                  'clearcoatTexture', 'clearcoatRoughnessTexture', 'clearcoatNormalTexture',
                  'sheenColorTexture', 'sheenRoughnessTexture',
                  'transmissionTexture', 'thicknessTexture'
                ];
                
                let textureFound = false;
                textureTypes.forEach((texProp: string) => {
                  const texture = (mat as any)[texProp];
                  if (texture) {
                    textureFound = true;
                    // Ensure texture is enabled
                    if (texture.level !== undefined) {
                      texture.level = 1.0; // Full intensity
                    }
                    // Force texture to load
                    if (texture.updateSamplingMode) {
                      texture.updateSamplingMode(2); // LINEAR_LINEAR
                    }
                    // Ensure texture coordinates are set
                    if (texture.coordinatesIndex !== undefined && texture.coordinatesIndex === -1) {
                      texture.coordinatesIndex = 0;
                    }
                    // Force texture to be active
                    if (texture.isEnabled !== undefined) {
                      texture.isEnabled = true;
                    }
                    // Ensure texture is ready and loaded
                    if (texture.isReady) {
                      const ready = texture.isReady();
                      if (!ready) {
                        // Wait for texture to load
                        texture.onLoadObservable?.addOnce(() => {
                          console.log(`  ✅ Texture loaded: ${texProp} for ${mesh.name}`);
                          mat.markAsDirty();
                        });
                      }
                    }
                    // Force texture update
                    if (texture.update) {
                      texture.update();
                    }
                    // Ensure texture has proper wrap mode
                    if (texture.wrapU !== undefined) {
                      texture.wrapU = 1; // WRAP_ADDRESSMODE
                    }
                    if (texture.wrapV !== undefined) {
                      texture.wrapV = 1; // WRAP_ADDRESSMODE
                    }
                    console.log(`  ✅ Found texture: ${texProp} for ${mesh.name}`);
                  }
                });
                
                if (!textureFound) {
                  console.log(`  ⚠️ No textures found for material on ${mesh.name}`);
                }
                
                // CRITICAL: Ensure material uses textures (not just colors)
                // For PBR materials, make sure base texture is being used
                if (mat.getClassName && mat.getClassName() === 'PBRMaterial') {
                  // Ensure base texture is active
                  if (mat.albedoTexture && mat.albedoColor) {
                    // If we have a texture, don't override with solid color
                    mat.albedoColor = new Color3(1, 1, 1); // White to show texture properly
                  }
                  // Ensure texture is not being overridden
                  if (mat.useAlphaFromAlbedoTexture !== undefined) {
                    mat.useAlphaFromAlbedoTexture = true;
                  }
                }
                
                // Force material update (shader compiles on first render)
                mat.markAsDirty();
              });
            }
            
            // Process child meshes recursively
            const processMesh = (m: any) => {
              const childName = m.name.toLowerCase();
              const isChildBackground = childName.includes('sky') || 
                     childName.includes('background') ||
                     childName.includes('dome') ||
                     childName.includes('environment') ||
                     childName.includes('backdrop') ||
                     childName.includes('bg');
              
              if (!isChildBackground) {
                m.receiveShadows = true;
              }
              
              if (m.material) {
                const materials = Array.isArray(m.material) ? m.material : [m.material];
                materials.forEach((mat: any) => {
                  mat.needsUpdate = true;
                  mat.markAsDirty();
                  
                  // Ensure child meshes receive light (unless background)
                  if (!isChildBackground) {
                    if (mat.disableLighting !== undefined) {
                      mat.disableLighting = false;
                    }
                    if (mat.unlit !== undefined) {
                      mat.unlit = false;
                    }
                  }
                  
                  if (mat.environmentIntensity !== undefined) {
                    mat.environmentIntensity = 1.0;
                  }
                });
              }
              
              m.getChildMeshes().forEach(processMesh);
            };
            
            mesh.getChildMeshes().forEach(processMesh);
          });
          
          // Create shadow generator if we have a directional light
          const mainLight = scene.getLightByName('mainLight') || lightsRef.current.mainDir;
          if (mainLight && mainLight instanceof DirectionalLight) {
          const shadowGenerator = new ShadowGenerator(2048, mainLight);
          shadowGenerator.useBlurExponentialShadowMap = true;
          shadowGenerator.blurKernel = 32;
          
          meshes.forEach((mesh: any) => {
            // Add meshes to shadow generator (skip root/empty meshes and skyboxes)
            if (mesh.getTotalVertices && mesh.getTotalVertices() > 0) {
              const name = mesh.name.toLowerCase();
              // Skip skybox/background meshes from shadow casting
              if (!name.includes('sky') && !name.includes('background') && !name.includes('dome')) {
                shadowGenerator.addShadowCaster(mesh);
              }
            }
          });
            console.log('✅ Shadow generator created with mainLight');
          } else {
            console.log('⚠️ No mainLight found for shadow generator');
          }
          
          // Adjust camera to see the cave better
          if (meshes.length > 0 && camera instanceof ArcRotateCamera) {
            const bounds = meshes[0].getBoundingInfo();
            if (bounds) {
              const center = bounds.boundingBox.centerWorld;
              camera.setTarget(center);
              camera.radius = Math.max(bounds.boundingBox.extendSizeWorld.length() * 2, 10);
            }
          }
          
          // Create VM screens in circular layout
          const projects = useProjectStore.getState().projects;
          const screensWithVMs = projects.filter(p => p.vmUrl && p.screenId);
          
          console.log(`📺 Projects with VMs: ${screensWithVMs.length}`, screensWithVMs.map(p => ({ id: p.id, screenId: p.screenId, vmUrl: p.vmUrl })));
          
          if (screensWithVMs.length > 0) {
            console.log(`📺 Creating ${screensWithVMs.length} VM screens...`);
            const screenRadius = 15;
            const screenHeight = 5;
            const screenWidth = 3;
            const screenHeight_3d = 2;
            
            const vmScreens: any[] = [];
            
            screensWithVMs.forEach((project, index) => {
              if (!project.screenId || !project.vmUrl) return;
              
              try {
                const angle = (index / screensWithVMs.length) * Math.PI * 2;
                const x = Math.cos(angle) * screenRadius;
                const z = Math.sin(angle) * screenRadius;
                const y = screenHeight;
                
                const screen = MeshBuilder.CreatePlane(`screen_${project.screenId}`, {
                  width: screenWidth,
                  height: screenHeight_3d
                }, scene);
                
                screen.position = new Vector3(x, y, z);
                screen.lookAt(Vector3.Zero());
                
                // Create material for screen
                const screenMaterial = new PBRMaterial(`screenMat_${project.screenId}`, scene);
                screenMaterial.emissiveColor = new Color3(0.1, 0.1, 0.1);
                screen.material = screenMaterial;
                
                // Create GUI texture for iframe
                const advancedTexture = AdvancedDynamicTexture.CreateForMesh(screen, screenWidth * 100, screenHeight_3d * 100);
                const rect = new Rectangle(`rect_${project.screenId}`);
                rect.width = 1;
                rect.height = 1;
                rect.thickness = 0;
                rect.background = 'black';
                advancedTexture.addControl(rect);
                
                // Store screen reference for camera tracking
                vmScreens.push({ screen, project, angle });
                
                console.log(`✅ Created screen ${project.screenId} for ${project.name} at angle ${angle.toFixed(2)}`);
              } catch (error: any) {
                console.error(`❌ Failed to create screen for ${project.name}:`, error);
              }
            });
            
            // Update screen rotation to face camera
            if (vmScreens.length > 0 && camera) {
              const currentCamera = camera; // Capture camera reference
              scene.onBeforeRenderObservable.add(() => {
                if (currentCamera) {
                  vmScreens.forEach(({ screen }) => {
                    const direction = currentCamera.position.subtract(screen.position).normalize();
                    screen.lookAt(screen.position.add(direction));
                  });
                }
              });
            }
            
            console.log(`✅ Created ${vmScreens.length} VM screens`);
          } else {
            console.log('💡 No VM screens to create - configure projects in the Float Panel');
          }
          
          console.log('✅ Textures and materials processed');
          
          // CRITICAL: Wait for all textures to be ready, then force material updates
          console.log('⏳ Waiting for all textures to load...');
          const textureCount = scene.textures.length;
          console.log(`📦 Found ${textureCount} textures in scene`);
          
          // Log all textures for debugging
          scene.textures.forEach((tex: any, index: number) => {
            console.log(`  Texture ${index + 1}: ${tex.name || 'unnamed'} - Ready: ${tex.isReady ? tex.isReady() : 'N/A'}`);
          });
          
          const waitForTextures = () => {
            let allReady = true;
            let loadingCount = 0;
            
            scene.textures.forEach((tex: any, index: number) => {
              if (tex.isReady) {
                const ready = tex.isReady();
                if (!ready) {
                  allReady = false;
                  loadingCount++;
                  // Force texture to load
                  if (tex.update) {
                    tex.update();
                  }
                }
              }
            });
            
            if (!allReady) {
              console.log(`⏳ Still loading ${loadingCount} textures...`);
              setTimeout(waitForTextures, 100);
              return;
            }
            
            console.log('✅ All textures loaded!');
            
            // Now force shader compilation for all materials with textures
            console.log('🔧 Forcing shader compilation for all materials...');
            meshes.forEach((mesh: any) => {
              if (mesh.material) {
                const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                materials.forEach((mat: any) => {
                  // Ensure all textures are properly bound
                  const textureProps = ['albedoTexture', 'diffuseTexture', 'baseTexture', 'baseColorTexture', 
                                       'normalTexture', 'emissiveTexture', 'metallicRoughnessTexture'];
                  textureProps.forEach((prop: string) => {
                    const tex = (mat as any)[prop];
                    if (tex && tex.update) {
                      tex.update();
                    }
                  });
                  
                  // Force shader compilation
                  mat.markAsDirty();
                  // Ensure shaders are enabled
                  if (mat.unlit !== undefined) {
                    mat.unlit = false;
                  }
                  if (mat.disableLighting !== undefined && !mesh.name.toLowerCase().includes('background')) {
                    mat.disableLighting = false;
                  }
                  // Force effect compilation
                  if (mat.getEffect) {
                    try {
                      mat.getEffect();
                    } catch (e) {
                      // Will compile on render
                    }
                  }
                });
              }
            });
            
            // Force a render to trigger shader compilation
            if (engine) {
              scene.render();
              console.log('✅ Shader compilation initiated (materials marked dirty)');
            }
            
            // NOW apply initial vibe after scene is fully loaded and textures ready
            // Longer delay to ensure everything is settled
            // VIBES DISABLED - Don't apply any vibe settings
            console.log('✅ Scene fully loaded - vibes system disabled, keeping default lighting');
          };
          
          // Start waiting for textures
          setTimeout(waitForTextures, 100);
          
          // Load Batman OBJ model
          console.log('🦇 Loading Batman model...');
          SceneLoader.ImportMeshAsync('', '/', 'batman.obj', scene)
            .then((result) => {
              console.log('✅ Batman model loaded!', result);
              
              if (result.meshes && result.meshes.length > 0) {
                // Get the main mesh (usually the first one or the one without a parent)
                let batmanMesh: AbstractMesh | null = null;
                const meshes = result.meshes.filter((m: any) => m.getTotalVertices && m.getTotalVertices() > 0);
                
                if (meshes.length > 0) {
                  // Find the root mesh (no parent) or use the largest mesh
                  batmanMesh = meshes.find((m: any) => !m.parent) || meshes[0];
                  
                  if (!batmanMesh && meshes.length > 0) {
                    // Find mesh with most vertices
                    let maxVertices = 0;
                    meshes.forEach((m: any) => {
                      const vertices = m.getTotalVertices();
                      if (vertices > maxVertices) {
                        maxVertices = vertices;
                        batmanMesh = m;
                      }
                    });
                  }
                }
                
                if (batmanMesh) {
                  batmanMesh.name = 'batman';
                  
                  // Position Batman in the scene (center, on ground level)
                  batmanMesh.position = new Vector3(0, 0, 0);
                  
                  // Scale Batman to appropriate size (adjust as needed)
                  if (batmanMesh.getBoundingInfo) {
                    const bounds = batmanMesh.getBoundingInfo();
                    const height = bounds.boundingBox.extendSizeWorld.y * 2;
                    const targetHeight = 1.8; // ~1.8 meters tall
                    if (height > 0.1 && height !== targetHeight) {
                      const scale = targetHeight / height;
                      batmanMesh.scaling = new Vector3(scale, scale, scale);
                      console.log(`📏 Scaled Batman from ${height.toFixed(2)}m to ${targetHeight}m (scale: ${scale.toFixed(2)})`);
                    }
                  }
                  
                  // Enable shadows
                  batmanMesh.receiveShadows = true;
                  
                  // Apply shadows to all child meshes
                  batmanMesh.getChildMeshes().forEach((child: AbstractMesh) => {
                    child.receiveShadows = true;
                  });
                  
                  // Add to shadow generator if it exists
                  const mainLight = scene.getLightByName('mainLight');
                  if (mainLight && (mainLight as any).getShadowGenerator) {
                    const shadowGenerator = (mainLight as any).getShadowGenerator();
                    if (shadowGenerator) {
                      shadowGenerator.addShadowCaster(batmanMesh, true);
                      batmanMesh.getChildMeshes().forEach((child: AbstractMesh) => {
                        shadowGenerator.addShadowCaster(child, true);
                      });
                    }
                  }
                  
                  // Ensure materials are properly set up
                  if (batmanMesh.material) {
                    const materials = Array.isArray(batmanMesh.material) 
                      ? batmanMesh.material 
                      : [batmanMesh.material];
                    
                    materials.forEach((mat: any) => {
                      if (mat) {
                        mat.receiveShadows = true;
                        mat.markAsDirty();
                      }
                    });
                  }
                  
                  console.log(`✅ Batman positioned at (${batmanMesh.position.x}, ${batmanMesh.position.y}, ${batmanMesh.position.z})`);
          } else {
                  console.warn('⚠️ No valid Batman mesh found in OBJ file');
                }
              } else {
                console.warn('⚠️ Batman OBJ loaded but no meshes found');
              }
            })
            .catch((error) => {
              console.error('❌ Failed to load Batman model:', error);
              console.log('💡 Make sure batman.obj is in the /public folder');
            });
        })
        .catch((error) => {
          console.error('❌ Failed to load batcave:', error);
          console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
          });
          console.log('💡 Check Vercel Blob URL accessibility');
          console.log('💡 Check browser Network tab for CORS/404 errors');
          console.log('💡 Scene will continue with test sphere visible');
          
          // Show non-intrusive error notification
          const errorDiv = document.createElement('div');
          errorDiv.id = 'glb-load-error';
          errorDiv.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: rgba(220, 38, 38, 0.95); color: white; padding: 12px 20px; border-radius: 8px; z-index: 10000; font-family: monospace; font-size: 12px; max-width: 80%; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3);';
          errorDiv.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 4px;">⚠️ GLB File Not Found</div>
            <div style="font-size: 11px; opacity: 0.9;">Check console for details. Scene is rendering with test sphere.</div>
          `;
          // Remove existing error if present
          const existingError = document.getElementById('glb-load-error');
          if (existingError) existingError.remove();
          document.body.appendChild(errorDiv);
          
          // Auto-hide after 10 seconds
          setTimeout(() => {
            const err = document.getElementById('glb-load-error');
            if (err) err.style.opacity = '0';
            setTimeout(() => {
              const err2 = document.getElementById('glb-load-error');
              if (err2) err2.remove();
            }, 300);
          }, 10000);
        });

      // Keyboard controls - attach to canvas and window for maximum coverage
      const onKeyDown = (e: KeyboardEvent) => {
        // Only handle if not typing in an input
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return;
        }
        
        // Prevent default for all game keys to avoid browser shortcuts
        if (e.code === 'KeyW' || e.code === 'KeyA' || e.code === 'KeyS' || e.code === 'KeyD' || 
            e.code === 'KeyZ' || e.code === 'KeyX' || e.code === 'KeyF' || e.code === 'KeyC' ||
            e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
          e.preventDefault();
          e.stopPropagation();
        }
        
        keys[e.code] = true;
        (window as any).__babylonKeys[e.code] = true; // Update global too
        console.log(`⌨️ Key pressed: ${e.code}`);
        
        // Z/X zoom handled in render loop for continuous zoom
        
        // Toggle pointer lock with C - for FPS-style mouse control
        if (e.code === 'KeyC' && canvasRef.current) {
          if (document.pointerLockElement) {
            // Exit pointer lock
            document.exitPointerLock();
            console.log('🔓 Pointer unlocked');
          } else {
            // Request pointer lock
            canvasRef.current.requestPointerLock();
            console.log('🔒 Pointer locked');
          }
        }
        
        // Toggle free camera with F - now uses cameraStore
        if (e.code === 'KeyF') {
          const { toggleCameraMode } = useCameraStore.getState();
          toggleCameraMode();
        }
      };

      const onKeyUp = (e: KeyboardEvent) => {
        // Only handle if not typing in an input
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return;
        }
        
        if (e.code === 'KeyW' || e.code === 'KeyA' || e.code === 'KeyS' || e.code === 'KeyD' || 
            e.code === 'KeyZ' || e.code === 'KeyX' || e.code === 'KeyF' || e.code === 'KeyC' ||
            e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
          e.preventDefault();
          e.stopPropagation();
        }
        keys[e.code] = false;
        (window as any).__babylonKeys[e.code] = false; // Update global too
      };

      // Attach to both canvas and window
      if (canvasRef.current) {
        canvasRef.current.addEventListener('keydown', onKeyDown);
        canvasRef.current.addEventListener('keyup', onKeyUp);
        canvasRef.current.setAttribute('tabindex', '0'); // Make canvas focusable
        console.log('✅ Keyboard listeners attached to canvas');
      }
      window.addEventListener('keydown', onKeyDown, true);
      window.addEventListener('keyup', onKeyUp, true);
      console.log('✅ Keyboard event listeners attached to window');

      // Prevent browser zoom on touch - handle touch gestures properly
      const preventZoom = (e: TouchEvent) => {
        if (e.touches.length > 1) {
          e.preventDefault(); // Prevent pinch zoom on page
        }
      };
      
      const preventDoubleTapZoom = (e: TouchEvent) => {
        e.preventDefault();
      };
      
      // Add touch event listeners to prevent browser zoom
      canvasRef.current.addEventListener('touchstart', preventZoom, { passive: false });
      canvasRef.current.addEventListener('touchmove', preventZoom, { passive: false });
      canvasRef.current.addEventListener('touchend', preventDoubleTapZoom, { passive: false });
      
      // Also prevent wheel zoom on the page (only allow on canvas)
      const preventPageZoom = (e: WheelEvent) => {
        if (e.target === canvasRef.current || (e.target as Node).contains?.(canvasRef.current)) {
          // Allow zoom on canvas
          return;
        }
        // Prevent zoom elsewhere
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
        }
      };
      
      window.addEventListener('wheel', preventPageZoom, { passive: false });

      // Enhanced free camera movement with Space/Shift for vertical movement
      // Handle avatar movement in first person and third person modes
      // Add continuous forward movement in camera look direction
      const movementObserver = scene.onBeforeRenderObservable.add(() => {
        const currentCameraMode = useCameraStore.getState().cameraMode;
        const currentKeys = (window as any).__babylonKeys || keys; // Fallback to local keys
        
        if (camera instanceof FreeCamera && currentCameraMode === 'first') {
          // First person: Movement in camera look direction
          const moveSpeed = 0.15;
          const forward = camera.getForwardRay().direction;
          // FIXED: Swap cross product order to fix A/D inversion (left-handed system)
          const right = Vector3.Cross(Vector3.Up(), forward).normalize();
          
          let moveVector = Vector3.Zero();
          
          // W - Move forward in look direction
          if (currentKeys['KeyW'] === true) {
            moveVector = moveVector.add(forward.scale(moveSpeed));
          }
          // S - Move backward
          if (currentKeys['KeyS'] === true) {
            moveVector = moveVector.add(forward.scale(-moveSpeed));
          }
          // A - Strafe left (FIXED: now correctly moves left)
          if (currentKeys['KeyA'] === true) {
            moveVector = moveVector.add(right.scale(-moveSpeed));
          }
          // D - Strafe right (FIXED: now correctly moves right)
          if (currentKeys['KeyD'] === true) {
            moveVector = moveVector.add(right.scale(moveSpeed));
          }
          
          // Apply horizontal movement
          if (moveVector.length() > 0) {
            camera.position.addInPlace(moveVector);
          }
          
          // Vertical movement with Space (up) and Shift (down)
          const verticalSpeed = 0.15;
          let verticalMove = 0;
          
          if (currentKeys['Space'] === true) {
            verticalMove += verticalSpeed;
          }
          if (currentKeys['ShiftLeft'] === true || currentKeys['ShiftRight'] === true) {
            verticalMove -= verticalSpeed;
          }
          
          // Apply vertical movement smoothly
          if (verticalMove !== 0) {
            const newPos = camera.position.clone();
            newPos.y += verticalMove;
            camera.position = newPos;
          }
        } else if (currentCameraMode === 'third' && avatarRef.current) {
          // Third person: Move avatar with WASD in camera relative direction
          const moveSpeed = 0.1;
          const avatar = avatarRef.current;
          
          if (camera instanceof ArcRotateCamera) {
            const forward = camera.getForwardRay().direction;
            // FIXED: Swap cross product order to fix A/D inversion (left-handed system)
            const right = Vector3.Cross(Vector3.Up(), forward).normalize();
            
            let moveX = 0;
            let moveZ = 0;
            
            // Check keys individually to avoid issues
            if (currentKeys['KeyW'] === true) moveZ += moveSpeed;
            if (currentKeys['KeyS'] === true) moveZ -= moveSpeed;
            // FIXED: A/D now correctly strafe left/right
            if (currentKeys['KeyA'] === true) moveX -= moveSpeed;
            if (currentKeys['KeyD'] === true) moveX += moveSpeed;
            
            if (moveX !== 0 || moveZ !== 0) {
              const moveVector = forward.scale(moveZ).add(right.scale(moveX));
              avatar.position.addInPlace(moveVector);
              
              // Rotate avatar to face movement direction
              if (moveVector.length() > 0.01) {
                avatar.rotation.y = Math.atan2(moveVector.x, moveVector.z);
              }
            }
          }
          
          // FIXED: Z/X zoom now works continuously in render loop
          if (camera instanceof ArcRotateCamera) {
            const zoomSpeed = 0.5;
            if (currentKeys['KeyZ'] === true) {
              camera.radius = Math.max(camera.radius - zoomSpeed, camera.lowerRadiusLimit || 2);
            }
            if (currentKeys['KeyX'] === true) {
              camera.radius = Math.min(camera.radius + zoomSpeed, camera.upperRadiusLimit || 100);
            }
          }
        }
      });
      
      // Store observer for cleanup
      (window as any).__movementObserver = movementObserver;

      // Start render loop IMMEDIATELY - don't wait for GLB to load
      // This ensures the scene is visible even if GLB fails
      console.log('🎬 Starting render loop...');
      engine.runRenderLoop(() => {
        if (scene) {
        scene.render();
        }
      });
      console.log('✅ Render loop started! Scene will render even if GLB fails to load.');

      // Handle resize
      const handleResize = () => {
        engine?.resize();
      };
      window.addEventListener('resize', handleResize);

      // Return cleanup function from async IIFE
      return () => {
        console.log('🧹 Cleaning up...');
        window.removeEventListener('keydown', onKeyDown, true);
        window.removeEventListener('keyup', onKeyUp, true);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('wheel', preventPageZoom);
        
        // Unsubscribe from stores
        if (typeof unsubscribe !== 'undefined') unsubscribe();
        if (typeof unsubscribeVibes !== 'undefined') unsubscribeVibes();
        
        // Remove movement observer
        if ((window as any).__movementObserver) {
          scene.onBeforeRenderObservable.remove((window as any).__movementObserver);
        }
        
        // Remove touch and keyboard event listeners from canvas
        if (canvasRef.current) {
          canvasRef.current.removeEventListener('touchstart', preventZoom);
          canvasRef.current.removeEventListener('touchmove', preventZoom);
          canvasRef.current.removeEventListener('touchend', preventDoubleTapZoom);
          canvasRef.current.removeEventListener('keydown', onKeyDown);
          canvasRef.current.removeEventListener('keyup', onKeyUp);
        }
        
        if (camera && typeof camera.detachControl === 'function') {
          try {
            camera.detachControl();
          } catch (e) {
            console.warn('Error detaching camera controls:', e);
          }
        }
        if (engine) {
          engine.dispose();
        }
      };
    } catch (err: any) {
      console.error('❌ Error:', err);
      console.error('Error stack:', err.stack);
      return () => {}; // Return empty cleanup on error
    }
    })(); // Close async IIFE and return cleanup
  }, [useWebGPU]); // Removed currentVibe dependency - vibes system disabled

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ 
        display: 'block', 
        width: '100%', 
        height: '100%', 
        background: 'transparent',
        opacity: 1,
        visibility: 'visible'
      }}
      onClick={(e) => {
        // Focus canvas on click to enable keyboard input
        if (canvasRef.current) {
          canvasRef.current.focus();
          console.log('✅ Canvas focused for keyboard input');
        }
      }}
      tabIndex={0}
    />
  );
}


