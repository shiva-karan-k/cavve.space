'use client';

import { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';

export default function IPlane() {
  const [showHelp, setShowHelp] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const sections = useProjectStore((state) => state.sections);
  
  // Get life section blocks (mind, body, soul, banking, identity, socials, portfolios)
  const lifeSection = sections?.find(s => s.id === 'life');
  const iPlaneBlocks = lifeSection?.blocks || [];
  
  return (
    <>
      <div className={`absolute top-0 bottom-0 pointer-events-auto z-50 flex items-center transition-all duration-300 ${
        isHovered ? 'left-0 w-64' : '-left-12 w-16'
      }`}>
        <div 
          className={`bg-black/90 backdrop-blur-sm flex flex-col relative transition-all duration-300 ${
            isHovered ? 'w-full p-6' : 'w-full p-4'
          }`}
          onMouseEnter={() => {
            setIsHovered(true);
            setShowHelp(true);
          }}
          onMouseLeave={() => {
            setIsHovered(false);
            setShowHelp(false);
          }}
        >
        {/* Magenta/third eye gradient accent effect - right edge - spans full container height */}
        <div className="absolute top-0 right-0 bottom-0 w-1 opacity-90" style={{
          background: 'linear-gradient(to bottom, transparent 0%, transparent 15%, rgba(168, 85, 247, 0.4) 35%, rgba(168, 85, 247, 0.9) 50%, rgba(168, 85, 247, 0.4) 65%, transparent 85%, transparent 100%)'
        }}></div>
        <div className="absolute top-0 right-0 bottom-0 w-0.5 blur-sm opacity-60" style={{
          background: 'linear-gradient(to bottom, transparent 0%, transparent 20%, rgba(232, 121, 249, 0.3) 40%, rgba(232, 121, 249, 0.7) 50%, rgba(232, 121, 249, 0.3) 60%, transparent 80%, transparent 100%)'
        }}></div>
        <div className="absolute top-0 right-0 bottom-0 w-0.5 blur-md opacity-40" style={{
          background: 'linear-gradient(to bottom, transparent 0%, transparent 25%, rgba(147, 51, 234, 0.2) 40%, rgba(147, 51, 234, 0.5) 50%, rgba(147, 51, 234, 0.2) 60%, transparent 75%, transparent 100%)'
        }}></div>
        
        <div className="text-xs font-semibold text-white mb-4 uppercase tracking-wider text-center">
          I
        </div>
        
        {/* Tags - centered vertically - only show when hovered */}
        {isHovered && (
          <>
            <div className="flex flex-col gap-3 items-center">
              {iPlaneBlocks.map((block) => {
                if (!block) return null;
                const itemCount = block.items?.length || 0;
                
                return (
                  <div
                    key={block.id}
                    className="relative group w-full"
                  >
                    <button
                      className="w-full px-4 py-3 rounded-lg text-sm font-medium transition-all bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-white text-gray-300 hover:text-white"
                    >
                      <div className="flex items-center justify-between">
                        <span className="capitalize">{block.name}</span>
                        {itemCount > 0 && (
                          <span className="ml-2 px-2 py-0.5 bg-white/20 text-white rounded-full text-xs font-semibold">
                            {itemCount}
                          </span>
                        )}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
            
            {/* P.S. text - faded, positioned at bottom */}
            <div className="mt-6 text-xs text-gray-400/60 italic text-center pointer-events-none">
              P.S. The I isn&apos;t real.
            </div>
          </>
        )}
        </div>
      </div>
      
      {/* Help text - appears on hover */}
      {showHelp && (
        <div className="absolute left-[280px] top-1/2 -translate-y-1/2 pointer-events-auto z-[60] animate-fadeIn">
          <div className="w-64 rounded-lg p-[1px]"
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.8), rgba(255, 255, 255, 0.6), rgba(232, 121, 249, 0.8))',
            }}
          >
            <div className="bg-black/95 backdrop-blur-sm rounded-lg p-4 shadow-xl text-xs text-gray-300">
              All the things about yourself you organize here and connect agents to help operate. Agent Shiva incoming.
            </div>
          </div>
        </div>
      )}
    </>
  );
}

