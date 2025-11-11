'use client';

import { useState } from 'react';

interface VajranPaneProps {
  karmas?: any[];
  karyas?: any[];
  kriyas?: any[];
  sankalpas?: any[];
  yudh?: any[];
}

export default function VajranPane({ karmas = [], karyas = [], kriyas = [], sankalpas = [], yudh = [] }: VajranPaneProps) {
  const [showHelp, setShowHelp] = useState(false);
  const items = [
    { name: "Karma", count: karmas.length, data: karmas },
    { name: "Karya", count: karyas.length, data: karyas },
    { name: "Kriya", count: kriyas.length, data: kriyas },
    { name: "Sankalpa", count: sankalpas.length, data: sankalpas },
    { name: "Yudha", count: yudh.length, data: yudh },
  ];
  
  return (
    <>
      <div className="absolute top-0 left-[30%] right-[30%] pointer-events-auto z-50">
        <div 
          className="bg-black/90 backdrop-blur-sm rounded-b-lg p-6 w-full relative overflow-hidden"
          onMouseEnter={() => setShowHelp(true)}
          onMouseLeave={() => setShowHelp(false)}
        >
        {/* Golden gradient accent effect - top */}
        <div className="absolute top-0 left-0 right-0 h-1 opacity-90" style={{
          background: 'linear-gradient(to right, transparent 0%, transparent 20%, rgba(217, 119, 6, 0.3) 40%, rgba(217, 119, 6, 0.8) 50%, rgba(217, 119, 6, 0.3) 60%, transparent 80%, transparent 100%)'
        }}></div>
        <div className="absolute top-0 left-0 right-0 h-0.5 blur-sm opacity-60" style={{
          background: 'linear-gradient(to right, transparent 0%, transparent 25%, rgba(245, 158, 11, 0.2) 45%, rgba(245, 158, 11, 0.6) 50%, rgba(245, 158, 11, 0.2) 55%, transparent 75%, transparent 100%)'
        }}></div>
        <div className="absolute top-0 left-0 right-0 h-0.5 blur-md opacity-40" style={{
          background: 'linear-gradient(to right, transparent 0%, transparent 30%, rgba(180, 83, 9, 0.15) 45%, rgba(180, 83, 9, 0.4) 50%, rgba(180, 83, 9, 0.15) 55%, transparent 70%, transparent 100%)'
        }}></div>
        
        {/* Golden gradient accent effect - bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 opacity-90" style={{
          background: 'linear-gradient(to right, transparent 0%, transparent 20%, rgba(217, 119, 6, 0.3) 40%, rgba(217, 119, 6, 0.8) 50%, rgba(217, 119, 6, 0.3) 60%, transparent 80%, transparent 100%)'
        }}></div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 blur-sm opacity-60" style={{
          background: 'linear-gradient(to right, transparent 0%, transparent 25%, rgba(245, 158, 11, 0.2) 45%, rgba(245, 158, 11, 0.6) 50%, rgba(245, 158, 11, 0.2) 55%, transparent 75%, transparent 100%)'
        }}></div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 blur-md opacity-40" style={{
          background: 'linear-gradient(to right, transparent 0%, transparent 30%, rgba(180, 83, 9, 0.15) 45%, rgba(180, 83, 9, 0.4) 50%, rgba(180, 83, 9, 0.15) 55%, transparent 70%, transparent 100%)'
        }}></div>
        
        <div className="text-2xl font-bold text-white text-center uppercase tracking-wider mb-4">
          Har Har Mahadev
        </div>
        
        <div className="flex gap-4 justify-center items-center flex-wrap">
          {items.map((item) => (
            <div
              key={item.name}
              className="px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-white transition-all cursor-pointer group relative"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-300 group-hover:text-white">
                  {item.name}
                </span>
              </div>
              {/* Count badge - top right - no background, just number */}
              <span className="absolute -top-1 -right-1 text-[10px] font-semibold text-white">
                {item.count}
              </span>
            </div>
          ))}
        </div>
        </div>
      </div>
      
      {/* Help text - appears on hover */}
      {showHelp && (
        <div className="absolute top-[100px] left-1/2 -translate-x-1/2 pointer-events-auto z-[60] animate-fadeIn">
          <div className="w-80 bg-black/95 backdrop-blur-sm rounded-lg p-4 border-2 border-white shadow-xl text-xs text-gray-300 text-center">
            Your life momentum summarized from mahadev dimension.
          </div>
        </div>
      )}
    </>
  );
}

