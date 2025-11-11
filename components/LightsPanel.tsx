'use client';

import { useState, useEffect } from 'react';
import { Vector3 } from '@babylonjs/core';
import { useLightingStore } from '@/store/lightingStore';

interface LightsPanelProps {
  onClose: () => void;
  lightsRef: React.MutableRefObject<{
    ambient?: any;
    fill?: any;
    keySpot?: any;
    rimSpot?: any;
    mainDir?: any;
    point1?: any;
    point2?: any;
  }>;
  baseIntensitiesRef: React.MutableRefObject<{
    ambient?: number;
    fill?: number;
    keySpot?: number;
    rimSpot?: number;
    mainDir?: number;
    point1?: number;
    point2?: number;
  }>;
}

interface LightInfo {
  name: string;
  type: string;
  position?: { x: number; y: number; z: number };
  direction?: { x: number; y: number; z: number };
  intensity: number;
  baseIntensity: number;
  color?: { r: number; g: number; b: number };
  enabled: boolean;
}

export default function LightsPanel({ onClose, lightsRef, baseIntensitiesRef }: LightsPanelProps) {
  const { sceneLightingIntensity } = useLightingStore();
  const [lights, setLights] = useState<LightInfo[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const updateLights = () => {
      if (!lightsRef || !lightsRef.current) {
        console.log('⚠️ Lights ref not available yet');
        return;
      }
      
      // Check if refs are actually populated (not just empty objects)
      const lightsKeys = Object.keys(lightsRef.current);
      if (lightsKeys.length === 0) {
        console.log('⚠️ Lights ref exists but no lights created yet');
        return;
      }
      
      const lightsList: LightInfo[] = [];
      
      if (lightsRef.current.ambient) {
        const light = lightsRef.current.ambient;
        lightsList.push({
          name: 'Ambient Light',
          type: 'Hemispheric',
          direction: light.direction ? { x: light.direction.x, y: light.direction.y, z: light.direction.z } : undefined,
          intensity: light.intensity || 0,
          baseIntensity: baseIntensitiesRef.current.ambient || 0,
          color: light.diffuse ? { r: light.diffuse.r, g: light.diffuse.g, b: light.diffuse.b } : undefined,
          enabled: light.isEnabled(),
        });
      }
      
      if (lightsRef.current.fill) {
        const light = lightsRef.current.fill;
        lightsList.push({
          name: 'Fill Light',
          type: 'Hemispheric',
          direction: light.direction ? { x: light.direction.x, y: light.direction.y, z: light.direction.z } : undefined,
          intensity: light.intensity || 0,
          baseIntensity: baseIntensitiesRef.current.fill || 0,
          color: light.diffuse ? { r: light.diffuse.r, g: light.diffuse.g, b: light.diffuse.b } : undefined,
          enabled: light.isEnabled(),
        });
      }
      
      if (lightsRef.current.keySpot) {
        const light = lightsRef.current.keySpot;
        lightsList.push({
          name: 'Key Spotlight',
          type: 'Spot',
          position: light.position ? { x: light.position.x, y: light.position.y, z: light.position.z } : undefined,
          direction: light.direction ? { x: light.direction.x, y: light.direction.y, z: light.direction.z } : undefined,
          intensity: light.intensity || 0,
          baseIntensity: baseIntensitiesRef.current.keySpot || 0,
          color: light.diffuse ? { r: light.diffuse.r, g: light.diffuse.g, b: light.diffuse.b } : undefined,
          enabled: light.isEnabled(),
        });
      }
      
      if (lightsRef.current.rimSpot) {
        const light = lightsRef.current.rimSpot;
        lightsList.push({
          name: 'Rim Spotlight',
          type: 'Spot',
          position: light.position ? { x: light.position.x, y: light.position.y, z: light.position.z } : undefined,
          direction: light.direction ? { x: light.direction.x, y: light.direction.y, z: light.direction.z } : undefined,
          intensity: light.intensity || 0,
          baseIntensity: baseIntensitiesRef.current.rimSpot || 0,
          color: light.diffuse ? { r: light.diffuse.r, g: light.diffuse.g, b: light.diffuse.b } : undefined,
          enabled: light.isEnabled(),
        });
      }
      
      if (lightsRef.current.mainDir) {
        const light = lightsRef.current.mainDir;
        lightsList.push({
          name: 'Main Directional',
          type: 'Directional',
          position: light.position ? { x: light.position.x, y: light.position.y, z: light.position.z } : undefined,
          direction: light.direction ? { x: light.direction.x, y: light.direction.y, z: light.direction.z } : undefined,
          intensity: light.intensity || 0,
          baseIntensity: baseIntensitiesRef.current.mainDir || 0,
          color: light.diffuse ? { r: light.diffuse.r, g: light.diffuse.g, b: light.diffuse.b } : undefined,
          enabled: light.isEnabled(),
        });
      }
      
      if (lightsRef.current.point1) {
        const light = lightsRef.current.point1;
        lightsList.push({
          name: 'Point Light 1',
          type: 'Point',
          position: light.position ? { x: light.position.x, y: light.position.y, z: light.position.z } : undefined,
          intensity: light.intensity || 0,
          baseIntensity: baseIntensitiesRef.current.point1 || 0,
          color: light.diffuse ? { r: light.diffuse.r, g: light.diffuse.g, b: light.diffuse.b } : undefined,
          enabled: light.isEnabled(),
        });
      }
      
      if (lightsRef.current.point2) {
        const light = lightsRef.current.point2;
        lightsList.push({
          name: 'Point Light 2',
          type: 'Point',
          position: light.position ? { x: light.position.x, y: light.position.y, z: light.position.z } : undefined,
          intensity: light.intensity || 0,
          baseIntensity: baseIntensitiesRef.current.point2 || 0,
          color: light.diffuse ? { r: light.diffuse.r, g: light.diffuse.g, b: light.diffuse.b } : undefined,
          enabled: light.isEnabled(),
        });
      }
      
      setLights(lightsList);
      if (lightsList.length > 0) {
        console.log(`✅ Lights panel: Found ${lightsList.length} lights`);
      }
    };
    
    // Update immediately and then every 200ms for responsiveness
    updateLights();
    const interval = setInterval(updateLights, 200);
    
    return () => clearInterval(interval);
  }, [lightsRef, baseIntensitiesRef, refreshKey]);

  const updateLightPosition = (lightName: string, axis: 'x' | 'y' | 'z', value: number) => {
    const lightMap: { [key: string]: string } = {
      'Ambient Light': 'ambient',
      'Fill Light': 'fill',
      'Key Spotlight': 'keySpot',
      'Rim Spotlight': 'rimSpot',
      'Main Directional': 'mainDir',
      'Point Light 1': 'point1',
      'Point Light 2': 'point2',
    };
    
    const key = lightMap[lightName];
    const light = lightsRef.current[key as keyof typeof lightsRef.current];
    
    if (light && light.position) {
      const oldValue = light.position[axis];
      if (axis === 'x') light.position.x = value;
      if (axis === 'y') light.position.y = value;
      if (axis === 'z') light.position.z = value;
      console.log(`📍 Updated ${lightName} position ${axis}: ${oldValue.toFixed(2)} → ${value.toFixed(2)}`);
      setRefreshKey(prev => prev + 1);
    } else {
      console.warn(`⚠️ Cannot update position for ${lightName}: light or position not found`);
    }
  };

  const updateLightDirection = (lightName: string, axis: 'x' | 'y' | 'z', value: number) => {
    const lightMap: { [key: string]: string } = {
      'Ambient Light': 'ambient',
      'Fill Light': 'fill',
      'Key Spotlight': 'keySpot',
      'Rim Spotlight': 'rimSpot',
      'Main Directional': 'mainDir',
      'Point Light 1': 'point1',
      'Point Light 2': 'point2',
    };
    
    const key = lightMap[lightName];
    const light = lightsRef.current[key as keyof typeof lightsRef.current];
    
    if (light && light.direction) {
      const oldValue = light.direction[axis];
      if (axis === 'x') light.direction.x = value;
      if (axis === 'y') light.direction.y = value;
      if (axis === 'z') light.direction.z = value;
      
      // Normalize direction vector for directional/spot lights (not hemispheric)
      // Check by light name since the actual light object doesn't have a type property
      const needsNormalization = lightName.includes('Spotlight') || lightName.includes('Directional');
      if (needsNormalization && light.direction && typeof (light.direction as Vector3).normalize === 'function') {
        const dir = light.direction as Vector3;
        dir.normalize();
        console.log(`🧭 Normalized ${lightName} direction to: (${dir.x.toFixed(3)}, ${dir.y.toFixed(3)}, ${dir.z.toFixed(3)})`);
      }
      
      console.log(`🧭 Updated ${lightName} direction ${axis}: ${oldValue.toFixed(2)} → ${value.toFixed(2)}`);
      setRefreshKey(prev => prev + 1);
    } else {
      console.warn(`⚠️ Cannot update direction for ${lightName}: light or direction not found`);
    }
  };

  const updateBaseIntensity = (lightName: string, value: number) => {
    const lightMap: { [key: string]: { baseKey: keyof typeof baseIntensitiesRef.current; lightKey: keyof typeof lightsRef.current } } = {
      'Ambient Light': { baseKey: 'ambient', lightKey: 'ambient' },
      'Fill Light': { baseKey: 'fill', lightKey: 'fill' },
      'Key Spotlight': { baseKey: 'keySpot', lightKey: 'keySpot' },
      'Rim Spotlight': { baseKey: 'rimSpot', lightKey: 'rimSpot' },
      'Main Directional': { baseKey: 'mainDir', lightKey: 'mainDir' },
      'Point Light 1': { baseKey: 'point1', lightKey: 'point1' },
      'Point Light 2': { baseKey: 'point2', lightKey: 'point2' },
    };
    
    const keys = lightMap[lightName];
    if (keys) {
      const oldBase = baseIntensitiesRef.current[keys.baseKey] || 0;
      const oldIntensity = lightsRef.current[keys.lightKey]?.intensity || 0;
      
      baseIntensitiesRef.current[keys.baseKey] = value;
      const light = lightsRef.current[keys.lightKey];
      if (light) {
        light.intensity = value * sceneLightingIntensity;
        console.log(`💡 Updated ${lightName} intensity: base ${oldBase.toFixed(3)} → ${value.toFixed(3)}, total ${oldIntensity.toFixed(3)} → ${light.intensity.toFixed(3)}`);
      } else {
        console.warn(`⚠️ Light ${lightName} not found when updating intensity`);
      }
      setRefreshKey(prev => prev + 1);
    } else {
      console.warn(`⚠️ Unknown light name: ${lightName}`);
    }
  };

  const toggleLight = (lightName: string) => {
    const lightMap: { [key: string]: string } = {
      'Ambient Light': 'ambient',
      'Fill Light': 'fill',
      'Key Spotlight': 'keySpot',
      'Rim Spotlight': 'rimSpot',
      'Main Directional': 'mainDir',
      'Point Light 1': 'point1',
      'Point Light 2': 'point2',
    };
    
    const key = lightMap[lightName];
    const light = lightsRef.current[key as keyof typeof lightsRef.current];
    
    if (light) {
      const wasEnabled = light.isEnabled();
      light.setEnabled(!wasEnabled);
      console.log(`🔌 Toggled ${lightName}: ${wasEnabled ? 'ON' : 'OFF'} → ${!wasEnabled ? 'ON' : 'OFF'}`);
      setRefreshKey(prev => prev + 1);
    } else {
      console.warn(`⚠️ Light ${lightName} not found when toggling`);
    }
  };

  return (
    <div 
      className="bg-black/95 backdrop-blur-sm rounded-lg p-6 border border-white/30 shadow-xl max-w-4xl max-h-[80vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-white">Lights Panel</h2>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 text-xl"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-4 text-sm text-gray-300">
        {lights.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No lights found. Make sure lights are enabled and a preset is active.
          </div>
        ) : (
          lights.map((light, index) => (
            <div key={index} className="border border-white/20 rounded-lg p-4 bg-black/50">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-white font-semibold">{light.name}</h3>
                  <span className="text-xs text-gray-400">{light.type}</span>
                </div>
                <button
                  onClick={() => toggleLight(light.name)}
                  className={`px-3 py-1 rounded text-xs font-semibold ${
                    light.enabled 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  {light.enabled ? 'ON' : 'OFF'}
                </button>
              </div>
              
              <div className="space-y-2">
                {/* Base Intensity */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs">Base Intensity</span>
                    <span className="text-xs text-gray-400">{light.baseIntensity.toFixed(3)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={light.type === 'Spot' ? "1000" : light.type === 'Directional' ? "10" : "2"}
                    step="0.01"
                    value={light.baseIntensity}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      updateBaseIntensity(light.name, value);
                    }}
                    onInput={(e) => {
                      const value = parseFloat((e.target as HTMLInputElement).value);
                      updateBaseIntensity(light.name, value);
                    }}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>
                
                {/* Current Intensity (with scene lighting multiplier) */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs">Current Intensity</span>
                    <span className="text-xs text-gray-400">{light.intensity.toFixed(3)}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Base × Scene Lighting ({sceneLightingIntensity.toFixed(2)})
                  </div>
                </div>
                
                {/* Position (if applicable) */}
                {light.position && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">X</label>
                      <input
                        type="number"
                        step="0.1"
                        value={light.position.x.toFixed(1)}
                        onChange={(e) => updateLightPosition(light.name, 'x', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Y</label>
                      <input
                        type="number"
                        step="0.1"
                        value={light.position.y.toFixed(1)}
                        onChange={(e) => updateLightPosition(light.name, 'y', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Z</label>
                      <input
                        type="number"
                        step="0.1"
                        value={light.position.z.toFixed(1)}
                        onChange={(e) => updateLightPosition(light.name, 'z', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-xs"
                      />
                    </div>
                  </div>
                )}
                
                {/* Direction (if applicable) */}
                {light.direction && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Dir X</label>
                      <input
                        type="number"
                        step="0.1"
                        value={light.direction.x.toFixed(2)}
                        onChange={(e) => updateLightDirection(light.name, 'x', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Dir Y</label>
                      <input
                        type="number"
                        step="0.1"
                        value={light.direction.y.toFixed(2)}
                        onChange={(e) => updateLightDirection(light.name, 'y', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Dir Z</label>
                      <input
                        type="number"
                        step="0.1"
                        value={light.direction.z.toFixed(2)}
                        onChange={(e) => updateLightDirection(light.name, 'z', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-xs"
                      />
                    </div>
                  </div>
                )}
                
                {/* Color (if available) */}
                {light.color && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Color:</span>
                      <div 
                        className="w-8 h-8 rounded border border-white/30"
                        style={{
                          backgroundColor: `rgb(${Math.round(light.color.r * 255)}, ${Math.round(light.color.g * 255)}, ${Math.round(light.color.b * 255)})`
                        }}
                      />
                      <span className="text-xs text-gray-500">
                        RGB({light.color.r.toFixed(2)}, {light.color.g.toFixed(2)}, {light.color.b.toFixed(2)})
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

