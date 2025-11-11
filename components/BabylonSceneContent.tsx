'use client';

import { useEffect, useRef } from 'react';
import { Engine, Scene, HemisphericLight, DirectionalLight, PointLight, Vector3, FreeCamera, ArcRotateCamera, ShadowGenerator, PBRMaterial, StandardMaterial, Color3, Color4, MeshBuilder } from '@babylonjs/core';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { AdvancedDynamicTexture, Rectangle } from '@babylonjs/gui';
import '@babylonjs/loaders/glTF';
import { useProjectStore } from '@/store/projectStore';

export default function BabylonSceneContent() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const freeCameraModeRef = useRef(false);

  useEffect(() => {
    if (!canvasRef.current) {
      console.error('❌ Canvas ref is null');
      return;
    }

    console.log('🎮 Starting Babylon.js initialization...');

    let engine: Engine | null = null;
    let camera: FreeCamera | ArcRotateCamera | null = null;
    const keys: { [key: string]: boolean } = {};

    try {
      // Get canvas dimensions
      const rect = canvasRef.current.getBoundingClientRect();
      const width = rect.width || window.innerWidth;
      const height = rect.height || window.innerHeight;
      
      console.log(`📐 Canvas size: ${width}x${height}`);

      // Initialize engine with shader support
      engine = new Engine(canvasRef.current, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        antialias: true,
        alpha: true,
        premultipliedAlpha: false,
        powerPreference: "high-performance",
        doNotHandleContextLost: false
      });
      console.log('✅ Engine created with shader support');

      // Create scene
      const scene = new Scene(engine);
      // Start with black background - will use GLB's background if available
      scene.clearColor = new Color4(0, 0, 0, 1); // Black background
      
      // Enable shadows and shader features
      scene.shadowsEnabled = true;
      scene.imageProcessingConfiguration.toneMappingEnabled = true;
      scene.imageProcessingConfiguration.exposure = 1.0;
      console.log('✅ Scene created with shader features enabled');

      // Start with ArcRotateCamera for better initial view
      camera = new ArcRotateCamera(
        'camera',
        -Math.PI / 2,
        Math.PI / 3,
        15,
        Vector3.Zero(),
        scene
      );
      
      // Configure camera controls with proper touch gesture support
      camera.attachControl(canvasRef.current, true);
      camera.lowerRadiusLimit = 2;
      camera.upperRadiusLimit = 100; // Much further zoom out
      camera.wheelDeltaPercentage = 0.01; // Faster zoom
      
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
      
      scene.activeCamera = camera;
      console.log('✅ Camera created');

      // Enhanced lighting setup - increased intensities for brighter scene
      // Main ambient light
      const ambientLight = new HemisphericLight('ambientLight', new Vector3(0, 1, 0), scene);
      ambientLight.intensity = 1.5; // Increased from 0.8
      ambientLight.diffuse = new Color3(1, 1, 1);
      
      // Bottom fill light
      const fillLight = new HemisphericLight('fillLight', new Vector3(0, -1, 0), scene);
      fillLight.intensity = 0.8; // Increased from 0.4
      fillLight.diffuse = new Color3(0.8, 0.8, 0.9);
      
      // Main directional light (simulating overhead/cave entrance)
      const mainLight = new DirectionalLight('mainLight', new Vector3(0, -1, -0.5), scene);
      mainLight.position = new Vector3(0, 10, 0);
      mainLight.intensity = 2.0; // Increased from 1.2
      mainLight.diffuse = new Color3(1, 0.95, 0.9);
      mainLight.shadowEnabled = true;
      
      // Additional point lights for better illumination
      const pointLight1 = new PointLight('pointLight1', new Vector3(5, 5, 5), scene);
      pointLight1.intensity = 1.2; // Increased from 0.6
      pointLight1.range = 20;
      
      const pointLight2 = new PointLight('pointLight2', new Vector3(-5, 5, -5), scene);
      pointLight2.intensity = 1.2; // Increased from 0.6
      pointLight2.range = 20;
      
      console.log('✅ Enhanced lights created');
      
      console.log('📦 Loading batcave model...');
      // Use AppendAsync to load FULL scene including environment textures and backgrounds
      SceneLoader.AppendAsync('/', 'the_batcave.glb', scene)
        .then(() => {
          console.log('✅ Batcave scene loaded!');
          
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
          screenMeshes.forEach((screenMesh: any) => {
            screenMesh.setEnabled(true);
            screenMesh.visibility = 1;
            screenMesh.isVisible = true;
            
            // Enable emissive materials on screens to make them glow/visible
            if (screenMesh.material) {
              const materials = Array.isArray(screenMesh.material) ? screenMesh.material : [screenMesh.material];
              materials.forEach((mat: any) => {
                // Turn on emissive for screens
                if (mat.emissiveColor) {
                  // If emissive is very low or zero, set it to visible
                  const emissive = mat.emissiveColor;
                  if (emissive.r < 0.3 && emissive.g < 0.3 && emissive.b < 0.3) {
                    mat.emissiveColor = new Color3(0.5, 0.5, 0.5); // Make screens glow
                  }
                } else {
                  // Add emissive if it doesn't exist
                  mat.emissiveColor = new Color3(0.5, 0.5, 0.5);
                }
                mat.emissiveIntensity = mat.emissiveIntensity || 1.0;
                mat.markAsDirty();
              });
            }
            console.log(`  ✅ Enabled screen: ${screenMesh.name}`);
          });
          
          // Also check for meshes with emissive materials that might be lights/screens
          meshes.forEach((mesh: any) => {
            if (mesh.material) {
              const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
              materials.forEach((mat: any) => {
                // If material has emissive, it might be a light or screen
                if (mat.emissiveColor) {
                  const emissive = mat.emissiveColor;
                  const emissiveIntensity = emissive.r + emissive.g + emissive.b;
                  // If emissive exists but is very low, turn it on
                  if (emissiveIntensity > 0 && emissiveIntensity < 0.3) {
                    const currentMax = Math.max(emissive.r, emissive.g, emissive.b);
                    if (currentMax > 0) {
                      // Scale up existing emissive
                      mat.emissiveColor = new Color3(
                        Math.min(1, emissive.r * 2),
                        Math.min(1, emissive.g * 2),
                        Math.min(1, emissive.b * 2)
                      );
                      mat.emissiveIntensity = mat.emissiveIntensity || 1.0;
                      mat.markAsDirty();
                      console.log(`  💡 Turned on emissive for: ${mesh.name}`);
                    }
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
                  
                  // Ensure materials receive ambient and diffuse lighting
                  if (mat.metallicFactor !== undefined || mat.roughnessFactor !== undefined) {
                    mat.environmentIntensity = 1.0;
                    if (mat.metallicFactor !== undefined) mat.metallicFactor = 0.5;
                    if (mat.roughnessFactor !== undefined) mat.roughnessFactor = 0.5;
                  }
                  
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
                
                // Force material update and shader recompilation
                mat.markAsDirty();
                mat.forceCompilation?.();
                
                // Ensure material is ready
                if (mat.getEffect) {
                  try {
                    mat.getEffect();
                  } catch (e) {
                    // Will compile on first render
                  }
                }
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
          
          // Create shadow generator
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
          };
          
          // Start waiting for textures
          setTimeout(waitForTextures, 100);
        })
        .catch((error) => {
          console.error('❌ Failed to load batcave:', error);
          console.log('💡 Make sure the_batcave.glb is in the /public folder');
          // Keep scene visible even on error
        });

      // Keyboard controls
      const onKeyDown = (e: KeyboardEvent) => {
        keys[e.code] = true;
        
        // Zoom in with Z
        if (e.code === 'KeyZ' && camera instanceof ArcRotateCamera) {
          e.preventDefault();
          camera.radius = Math.max(camera.radius - 1, camera.lowerRadiusLimit || 2);
        }
        
        // Zoom out with X
        if (e.code === 'KeyX' && camera instanceof ArcRotateCamera) {
          e.preventDefault();
          camera.radius = Math.min(camera.radius + 1, camera.upperRadiusLimit || 100);
        }
        
        // Toggle free camera with F
        if (e.code === 'KeyF') {
          e.preventDefault();
          freeCameraModeRef.current = !freeCameraModeRef.current;
          
          if (freeCameraModeRef.current) {
            // Switch to FreeCamera with Counter-Strike style controls
            const currentPos = camera?.position.clone() || new Vector3(0, 2, 5);
            
            if (camera && typeof camera.detachControl === 'function') {
              camera.detachControl();
            }
            
            const freeCam = new FreeCamera('freeCamera', currentPos, scene);
            
            // Counter-Strike style smooth mouse controls
            freeCam.attachControl(canvasRef.current, true);
            freeCam.speed = 0.3; // Smooth movement speed
            freeCam.angularSensibility = 1000; // Lower = more sensitive (smoother mouse)
            freeCam.inertia = 0.9; // Smooth deceleration
            freeCam.applyGravity = false; // No gravity for free cam
            
            // Configure WASD keys for smooth movement relative to camera
            // W/S = forward/backward, A/D = strafe left/right
            freeCam.keysUp = [87]; // W
            freeCam.keysDown = [83]; // S
            freeCam.keysLeft = [65]; // A
            freeCam.keysRight = [68]; // D
            
            // If switching from ArcRotateCamera, try to preserve viewing direction
            if (camera instanceof ArcRotateCamera) {
              const forward = camera.getForwardRay().direction;
              freeCam.setTarget(currentPos.add(forward.scale(5)));
            }
            
            scene.activeCamera = freeCam;
            camera = freeCam;
            console.log('✅ Switched to Free Camera (CS-style controls)');
          } else {
            // Switch back to ArcRotateCamera
            if (camera && typeof camera.detachControl === 'function') {
              camera.detachControl();
            }
            const currentPos = camera?.position || new Vector3(0, 2, 5);
            const arcCam = new ArcRotateCamera(
              'arcCamera',
              -Math.PI / 2,
              Math.PI / 3,
              currentPos.length(),
              Vector3.Zero(),
              scene
            );
            arcCam.attachControl(canvasRef.current, true);
            arcCam.lowerRadiusLimit = 2;
            arcCam.upperRadiusLimit = 100;
            arcCam.wheelDeltaPercentage = 0.01;
            scene.activeCamera = arcCam;
            camera = arcCam;
            console.log('✅ Switched to Arc Rotate Camera');
          }
        }
      };

      const onKeyUp = (e: KeyboardEvent) => {
        keys[e.code] = false;
      };

      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);

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
      // Using FreeCamera's built-in WASD + manual vertical control for smooth CS-style feel
      scene.onBeforeRenderObservable.add(() => {
        if (freeCameraModeRef.current && camera instanceof FreeCamera) {
          // Vertical movement with Space (up) and Shift (down)
          const verticalSpeed = 0.15;
          let verticalMove = 0;
          
          if (keys['Space']) {
            verticalMove += verticalSpeed;
          }
          if (keys['ShiftLeft'] || keys['ShiftRight']) {
            verticalMove -= verticalSpeed;
          }
          
          // Apply vertical movement smoothly
          if (verticalMove !== 0) {
            const newPos = camera.position.clone();
            newPos.y += verticalMove;
            camera.position = newPos;
          }
        }
      });

      // Start render loop
      console.log('🎬 Starting render loop...');
      engine.runRenderLoop(() => {
        scene.render();
      });
      console.log('✅ Render loop started!');

      // Handle resize
      const handleResize = () => {
        engine?.resize();
      };
      window.addEventListener('resize', handleResize);

      return () => {
        console.log('🧹 Cleaning up...');
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('wheel', preventPageZoom);
        
        // Remove touch event listeners
        if (canvasRef.current) {
          canvasRef.current.removeEventListener('touchstart', preventZoom);
          canvasRef.current.removeEventListener('touchmove', preventZoom);
          canvasRef.current.removeEventListener('touchend', preventDoubleTapZoom);
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
    }
  }, []);

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
    />
  );
}


