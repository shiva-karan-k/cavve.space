'use client';

import { useState, useEffect } from 'react';
import { Light } from '@babylonjs/core';
import { useProjectStore } from '@/store/projectStore';
import { useCameraStore } from '@/store/cameraStore';
import { useSocialStore } from '@/store/socialStore';
import { useVajranStore } from '@/store/vajranStore';
import { useLightingStore } from '@/store/lightingStore';
import { useVibesStore } from '@/store/vibesStore';
import ConfigPanel from './ConfigPanel';
import ControlsPanel from './ControlsPanel';
import VibesPanel from './VibesPanel';
import IPlane from './IPlane';
import SocialPane from './SocialPane';
import VajranPane from './VajranPane';

export default function UIOverlay() {
  const [showConfig, setShowConfig] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showVibes, setShowVibes] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [showBhairavHelp, setShowBhairavHelp] = useState(false);
  const [isBhairavHovered, setIsBhairavHovered] = useState(false);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const cameraMode = useCameraStore((state) => state.cameraMode);
  const { lightsEnabled, currentPreset, toggleLights, cyclePreset } = useLightingStore();
  const { currentVibe, setVibe, useWebGPU, setUseWebGPU } = useVibesStore();
  const sections = useProjectStore((state) => state.sections);
  const initializeProjects = useProjectStore((state) => state.initializeProjects);
  const projects = useProjectStore((state) => state.projects);
  
  // Social store
  const people = useSocialStore((state) => state.people);
  const initializePeople = useSocialStore((state) => state.initializePeople);
  
  // Vajran store
  const karmas = useVajranStore((state) => state.karmas);
  const karyas = useVajranStore((state) => state.karyas);
  const kriyas = useVajranStore((state) => state.kriyas);
  const sankalpas = useVajranStore((state) => state.sankalpas);
  const yudh = useVajranStore((state) => state.yudh);
  const initializeVajran = useVajranStore((state) => state.initializeVajran);

  useEffect(() => {
    initializeProjects();
    initializePeople();
    initializeVajran();
    
    // Listen for pointer lock changes
    const handlePointerLockChange = () => {
      setIsPointerLocked(!!document.pointerLockElement);
    };
    
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, [initializeProjects, initializePeople, initializeVajran]);

  // Click outside handler for popups
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Don't close if clicking on buttons that open panels
      if (target.closest('[data-panel-trigger]')) {
        return;
      }
      
      // Close Config Panel if clicking outside
      if (showConfig && !target.closest('[data-config-panel]')) {
        setShowConfig(false);
      }
      
      // Close Controls Panel if clicking outside
      if (showControls && !target.closest('[data-controls-panel]')) {
        setShowControls(false);
      }
      
      // Close Vibes Panel if clicking outside
      if (showVibes && !target.closest('[data-vibes-panel]')) {
        setShowVibes(false);
      }
    };

    if (showConfig || showControls || showVibes) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showConfig, showControls, showVibes]);

  // Handle clicking outside to close selected block - simplified
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!selectedBlock) return;
      
      const target = e.target as HTMLElement;
      
      // Don't close if clicking on Bhairav plane or any interactive element
      const isBhairavPlane = target.closest('[data-bhairav-plane]');
      const isButton = target.closest('button') || target.tagName === 'BUTTON';
      const isInput = target.closest('input') || target.tagName === 'INPUT';
      
      // Close if clicking on canvas (3D scene)
      const isCanvas = target.tagName === 'CANVAS' || target.closest('canvas');
      
      if (!isBhairavPlane && !isButton && !isInput && isCanvas) {
        setSelectedBlock(null);
      }
    };

    if (selectedBlock) {
      document.addEventListener('click', handleClickOutside, true);
      return () => document.removeEventListener('click', handleClickOutside, true);
    }
  }, [selectedBlock]);

  const getProjectScreenId = (projectId: string): number | undefined => {
    return projects?.find((p) => p.id === projectId)?.screenId;
  };

  const getProjectVmUrl = (projectId: string): string | undefined => {
    return projects?.find((p) => p.id === projectId)?.vmUrl;
  };

  // Get all blocks from all sections with safety checks, excluding life section blocks
  const allBlocks = sections
    ?.filter((section) => section.id !== 'life')
    ?.flatMap((section) => section?.blocks || []) || [];

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
      {/* Top left - cavve.net logo */}
      <div className="absolute top-4 left-4 pointer-events-auto z-50">
        <a 
          href="https://cavve.net" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-white font-bold text-xl tracking-wider hover:text-gray-300 transition-colors"
          style={{
            textShadow: '0 0 10px rgba(255, 255, 255, 0.3), 0 0 20px rgba(255, 255, 255, 0.1)',
            fontFamily: 'monospace',
          }}
        >
          cavve.net
        </a>
      </div>
      
      {/* Top bar - Vajran Pane */}
      <VajranPane karmas={karmas} karyas={karyas} kriyas={kriyas} sankalpas={sankalpas} yudh={yudh} />
      
      {/* Left edge - I Plane */}
      <IPlane />
      
      {/* Right edge - Social Pane */}
      <SocialPane people={people} />

      {/* Ghar Ghar Me Bhairav - Bottom Navbar with blocks and projects */}
      {selectedBlock && (
        <div 
          className="fixed inset-0 z-30"
          onClick={() => setSelectedBlock(null)}
          style={{ pointerEvents: 'auto', cursor: 'default' }}
        />
      )}
      <div 
        data-bhairav-plane
        className={`absolute pointer-events-auto z-40 transition-all duration-300 ${
          selectedBlock 
            ? 'left-[20%] right-[20%]' 
            : isBhairavHovered
              ? 'left-[50%] -translate-x-1/2 w-auto min-w-[300px]'
              : 'left-1/2 -translate-x-1/2 w-auto min-w-[120px]'
        } ${showConfig ? 'bottom-[50vh]' : 'bottom-0'}`}
        onMouseEnter={() => {
          setIsBhairavHovered(true);
          setShowBhairavHelp(true);
        }}
        onMouseLeave={() => {
          setIsBhairavHovered(false);
          setShowBhairavHelp(false);
        }}
      >
        <div className={`bg-black/90 backdrop-blur-sm rounded-lg rounded-b-none relative overflow-hidden transition-all duration-300 ${
          isBhairavHovered || selectedBlock ? 'p-4 pb-5' : 'p-3 px-6'
        }`}>
              {/* Red accent glow effect - top (shifted left, thinner) */}
              <div className="absolute top-0 left-0 right-0 h-0.5 opacity-90" style={{
                background: 'linear-gradient(to right, transparent 0%, transparent 15%, rgba(220, 38, 38, 0.4) 30%, rgba(220, 38, 38, 0.9) 40%, rgba(220, 38, 38, 0.4) 50%, transparent 70%, transparent 100%)'
              }}></div>
              <div className="absolute top-0 left-0 right-0 h-[0.3px] blur-sm opacity-60" style={{
                background: 'linear-gradient(to right, transparent 0%, transparent 20%, rgba(239, 68, 68, 0.3) 35%, rgba(239, 68, 68, 0.7) 40%, rgba(239, 68, 68, 0.3) 45%, transparent 65%, transparent 100%)'
              }}></div>
              <div className="absolute top-0 left-0 right-0 h-[0.3px] blur-md opacity-40" style={{
                background: 'linear-gradient(to right, transparent 0%, transparent 25%, rgba(185, 28, 28, 0.2) 35%, rgba(185, 28, 28, 0.5) 40%, rgba(185, 28, 28, 0.2) 45%, transparent 60%, transparent 100%)'
              }}></div>
              
              {/* Lord Hanuman gradient - bottom (shifted right, increased width) */}
              {(isBhairavHovered || selectedBlock) && (
                <>
                  <div className="absolute bottom-0 left-0 right-0 h-1 opacity-90" style={{
                    background: 'linear-gradient(to right, transparent 0%, transparent 30%, rgba(249, 115, 22, 0.4) 50%, rgba(249, 115, 22, 0.9) 60%, rgba(249, 115, 22, 0.4) 70%, transparent 85%, transparent 100%)'
                  }}></div>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 blur-sm opacity-60" style={{
                    background: 'linear-gradient(to right, transparent 0%, transparent 35%, rgba(251, 191, 36, 0.3) 55%, rgba(251, 191, 36, 0.7) 60%, rgba(251, 191, 36, 0.3) 65%, transparent 80%, transparent 100%)'
                  }}></div>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 blur-md opacity-40" style={{
                    background: 'linear-gradient(to right, transparent 0%, transparent 40%, rgba(234, 88, 12, 0.2) 55%, rgba(234, 88, 12, 0.5) 60%, rgba(234, 88, 12, 0.2) 65%, transparent 75%, transparent 100%)'
                  }}></div>
                </>
              )}
              
              <div className={`flex justify-center items-start transition-all duration-300 ${
                isBhairavHovered || selectedBlock ? 'mb-3 mt-2' : 'mb-0 mt-0'
              }`}>
                <div className={`text-white uppercase tracking-wider transition-all duration-300 ${
                  isBhairavHovered || selectedBlock 
                    ? 'text-sm font-semibold' 
                    : 'text-xs font-semibold'
                }`}>
                  {isBhairavHovered || selectedBlock ? (
                    <>Ghar Ghar Me <span className="text-base">Bhairav</span></>
                  ) : (
                    'Bhairav'
                  )}
                </div>
              </div>
              
              {/* Block tags - centered horizontal scroll - only show when hovered or selected */}
              {(isBhairavHovered || selectedBlock) && (
                <>
                  <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide justify-center items-center">
                    <div className="flex gap-2 flex-shrink-0">
                      {allBlocks.map((block) => {
                        if (!block) return null;
                        const isSelected = selectedBlock === block.id;
                        const blockProjects = (block.items || []).filter((item) => {
                          const project = projects?.find((p) => p.id === item.id);
                          return project?.vmUrl || project?.screenId;
                        });
                        const totalItems = (block.items || []).length;
                        return (
                          <button
                            key={block.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBlock(isSelected ? null : block.id);
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0 relative ${
                              isSelected
                                ? 'bg-white text-black border-2 border-white'
                                : 'bg-gray-800 text-gray-300 border-2 border-gray-700 hover:border-white hover:text-white'
                            }`}
                          >
                            {block.name}
                            {/* Item count badge - top right - no background, just number */}
                            <span className={`absolute -top-1 -right-1 text-[10px] font-semibold ${
                              isSelected ? 'text-black' : 'text-white'
                            }`}>
                              {totalItems}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Projects in selected block - horizontal scroll */}
                  {selectedBlock && (
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                      {allBlocks
                        .find((b) => b?.id === selectedBlock)
                        ?.items?.map((item, index, array) => {
                          if (!item) return null;
                          const screenId = getProjectScreenId(item.id);
                          const vmUrl = getProjectVmUrl(item.id);
                          const isLast = index === (array?.length || 0) - 1;
                          return (
                            <div key={item.id} className="flex items-center flex-shrink-0">
                              <div
                                className={`px-2 py-1 rounded text-xs transition-all ${
                                  vmUrl
                                    ? 'bg-white/20 border border-white text-white'
                                    : 'bg-gray-800 border border-gray-700 text-gray-300'
                                }`}
                              >
                                <div className="font-medium">{item.name}</div>
                                {screenId && (
                                  <div className="text-[10px] text-gray-400">#{screenId}</div>
                                )}
                              </div>
                              {!isLast && <div className="mx-1 text-gray-600 text-xs">→</div>}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Help text - appears on hover */}
          {showBhairavHelp && (
            <div className="absolute bottom-[120px] right-[20%] pointer-events-auto z-[60] animate-fadeIn">
              <div className="w-80 rounded-lg p-[1px]"
                style={{
                  background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.8), rgba(255, 255, 255, 0.6), rgba(249, 115, 22, 0.8))',
                }}
              >
                <div className="bg-black/95 backdrop-blur-sm rounded-lg p-4 shadow-xl text-xs text-gray-300 text-right">
                  n kabhi kabhi jab zindagi me shiv milega, uske baad bhairav mode jaroor ayega. all your bhairav mode stuff here. more modes n dimensions coming soon.
                </div>
              </div>
            </div>
          )}

      {/* Top right - Camera and Config */}
      <div className="absolute top-4 right-4 pointer-events-auto z-50">
        <div className="flex items-center gap-2">
          {/* Camera Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const { toggleCameraMode } = useCameraStore.getState();
              toggleCameraMode();
            }}
            className="px-4 py-2 border-2 border-white/30 hover:border-white hover:bg-white/10 text-white rounded font-semibold transition-all"
            title="Toggle Camera"
          >
            📷 {cameraMode === 'first' ? '1st' : '3rd'}
          </button>
          
          {/* Configure Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowConfig(!showConfig);
            }}
            data-panel-trigger="config"
            className="px-4 py-2 border-2 border-white/30 hover:border-white hover:bg-white/10 text-white rounded font-semibold transition-all"
            title="Configure"
          >
            {showConfig ? '✕ Close' : '⚙️ Configure'}
          </button>
        </div>
      </div>

      {/* Bottom right - Light Switch and Controls */}
      <div className="absolute bottom-4 right-4 pointer-events-auto z-50">
        <div className="flex items-center gap-2">
          {/* Light Switch Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('🔘 Light switch button clicked');
              console.log('  Current state:', { lightsEnabled });
              toggleLights();
              console.log('  After toggle:', { lightsEnabled: useLightingStore.getState().lightsEnabled });
            }}
            className={`w-12 h-12 border-2 border-white/30 hover:border-white hover:bg-white/10 text-white rounded-lg font-semibold transition-all flex items-center justify-center text-xl ${
              !lightsEnabled ? 'opacity-50' : ''
            }`}
            title={`Toggle Lights (${lightsEnabled ? 'ON' : 'OFF'})`}
          >
            💡
          </button>
          
          {/* Preset Switcher Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              cyclePreset();
            }}
            className="w-12 h-12 border-2 border-white/30 hover:border-white hover:bg-white/10 text-white rounded-lg font-semibold transition-all flex items-center justify-center text-xl"
            title={`Lighting Preset: ${currentPreset}`}
          >
            🔆
          </button>
          
          {/* Pointer Lock Toggle Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const canvas = document.querySelector('canvas');
              if (canvas) {
                if (document.pointerLockElement) {
                  document.exitPointerLock();
                } else {
                  canvas.requestPointerLock();
                }
              }
            }}
            className={`w-12 h-12 border-2 border-white/30 hover:border-white hover:bg-white/10 text-white rounded-lg font-semibold transition-all flex items-center justify-center text-xl ${
              isPointerLocked ? 'bg-white/20 border-white' : ''
            }`}
            title={`Pointer Lock (C) - ${isPointerLocked ? 'ON' : 'OFF'}`}
          >
            {isPointerLocked ? '🔒' : '🔓'}
          </button>
          
          {/* Controls Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowControls(!showControls);
            }}
            data-panel-trigger="controls"
            className="px-4 py-2 border-2 border-white/30 hover:border-white hover:bg-white/10 text-white rounded font-semibold transition-all"
            title="Controls"
          >
            🎮 Controls
          </button>
          
          {/* Vibes Panel Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowVibes(!showVibes);
            }}
            data-panel-trigger="vibes"
            className="px-4 py-2 border-2 border-white/30 hover:border-white hover:bg-white/10 text-white rounded font-semibold transition-all"
            title="Scene Vibes & Rendering"
          >
            🎨 Vibes
          </button>
        </div>
      </div>

      {/* Config Panel as Bottom Bar - only when open */}
      {showConfig && (
        <div 
          data-config-panel 
          className="absolute bottom-0 left-64 right-80 pointer-events-auto z-50 transition-all duration-300 transform translate-y-0"
          style={{ animation: 'slideUp 0.3s ease-out' }}
        >
          <ConfigPanel onClose={() => setShowConfig(false)} />
        </div>
      )}
      
      {/* Controls Panel - positioned near controls button */}
      {showControls && (
        <div 
          data-controls-panel 
          className="absolute bottom-24 right-4 pointer-events-auto z-50 transition-all duration-300 transform translate-x-0"
          style={{ animation: 'slideInRight 0.3s ease-out' }}
        >
          <ControlsPanel onClose={() => setShowControls(false)} />
        </div>
      )}
      
      {/* Vibes Panel (includes all lighting & rendering controls) */}
      {showVibes && (
        <div 
          data-vibes-panel 
          className="pointer-events-auto z-50 transition-all duration-300 transform translate-x-0"
          style={{ 
            position: 'absolute',
            top: '16px',
            right: '16px',
            animation: 'slideInRight 0.3s ease-out'
          }}
        >
          <VibesPanel
            useWebGPU={useWebGPU}
            setUseWebGPU={setUseWebGPU}
            vibe={currentVibe}
            setVibe={setVibe}
            listLights={(window as any).__babylonListLights}
            selectLight={(window as any).__babylonSelectLight}
            setGizmosEnabled={(window as any).__babylonSetGizmosEnabled}
            setGizmoMode={(window as any).__babylonSetGizmoMode}
          />
        </div>
      )}
    </div>
  );
}
