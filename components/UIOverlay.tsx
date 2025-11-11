'use client';

import { useState, useEffect } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useCameraStore } from '@/store/cameraStore';
import { useSocialStore } from '@/store/socialStore';
import { useVajranStore } from '@/store/vajranStore';
import ConfigPanel from './ConfigPanel';
import IPlane from './IPlane';
import SocialPane from './SocialPane';
import VajranPane from './VajranPane';

export default function UIOverlay() {
  const [showConfig, setShowConfig] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [showBhairavHelp, setShowBhairavHelp] = useState(false);
  const cameraMode = useCameraStore((state) => state.cameraMode);
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
  }, [initializeProjects, initializePeople, initializeVajran]);

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
            : 'left-[50%] -translate-x-1/2 w-auto min-w-[300px]'
        } ${showConfig ? 'bottom-[50vh]' : 'bottom-0'}`}
        onMouseEnter={() => setShowBhairavHelp(true)}
        onMouseLeave={() => setShowBhairavHelp(false)}
      >
        <div className="bg-black/90 backdrop-blur-sm rounded-lg rounded-b-none p-4 pb-5 relative overflow-hidden">
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
              <div className="absolute bottom-0 left-0 right-0 h-1 opacity-90" style={{
                background: 'linear-gradient(to right, transparent 0%, transparent 30%, rgba(249, 115, 22, 0.4) 50%, rgba(249, 115, 22, 0.9) 60%, rgba(249, 115, 22, 0.4) 70%, transparent 85%, transparent 100%)'
              }}></div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 blur-sm opacity-60" style={{
                background: 'linear-gradient(to right, transparent 0%, transparent 35%, rgba(251, 191, 36, 0.3) 55%, rgba(251, 191, 36, 0.7) 60%, rgba(251, 191, 36, 0.3) 65%, transparent 80%, transparent 100%)'
              }}></div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 blur-md opacity-40" style={{
                background: 'linear-gradient(to right, transparent 0%, transparent 40%, rgba(234, 88, 12, 0.2) 55%, rgba(234, 88, 12, 0.5) 60%, rgba(234, 88, 12, 0.2) 65%, transparent 75%, transparent 100%)'
              }}></div>
              
              <div className="flex justify-center items-start mb-3 mt-2">
                <div className="text-sm font-semibold text-white uppercase tracking-wider">
                  Ghar Ghar Me <span className="text-base">Bhairav</span>
                </div>
              </div>
              
              {/* Block tags - centered horizontal scroll */}
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
            </div>
          </div>
          
          {/* Help text - appears on hover */}
          {showBhairavHelp && (
            <div className="absolute bottom-[120px] right-[20%] pointer-events-auto z-[60] animate-fadeIn">
              <div className="w-80 bg-black/95 backdrop-blur-sm rounded-lg p-4 border-2 border-white shadow-xl text-xs text-gray-300 text-right">
                n kabhi kabhi jab zindagi me shiv milega, uske baad bhairav mode jaroor ayega. all your bhairav mode stuff here. more modes n dimensions coming soon.
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
          {/* Light Switch Button - just the switch */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement light toggle
              console.log('Light toggle clicked');
            }}
            className="w-12 h-12 border-2 border-white/30 hover:border-white hover:bg-white/10 text-white rounded-lg font-semibold transition-all flex items-center justify-center text-xl"
            title="Toggle Lights"
          >
            💡
          </button>
          
          {/* Controls Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement controls panel
              console.log('Controls clicked');
            }}
            className="px-4 py-2 border-2 border-white/30 hover:border-white hover:bg-white/10 text-white rounded font-semibold transition-all"
            title="Controls"
          >
            🎮 Controls
          </button>
        </div>
      </div>

      {/* Config Panel as Bottom Bar - only when open */}
      {showConfig && (
        <div className="absolute bottom-0 left-64 right-80 pointer-events-auto z-50">
          <ConfigPanel onClose={() => setShowConfig(false)} />
        </div>
      )}
    </div>
  );
}
