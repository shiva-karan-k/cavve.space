'use client';

import React, { useEffect, useState } from 'react';
import { useVibesStore } from '@/store/vibesStore';
import { PRESETS } from '@/types/vibes';

export default function VibesPanel() {
  const { currentVibe, setVibe, applyPreset } = useVibesStore();
  const [currentMode, setCurrentMode] = useState<string>('default');

  // Detect which preset is currently active
  useEffect(() => {
    const activePreset = Object.entries(PRESETS).find(([_, preset]) => {
      return JSON.stringify(preset) === JSON.stringify(currentVibe);
    });
    if (activePreset) {
      setCurrentMode(activePreset[0]);
    }
  }, [currentVibe]);

  const handlePresetClick = (presetName: string) => {
    setCurrentMode(presetName);
    applyPreset(presetName);
  };

  return (
    <div 
      className="bg-black/90 backdrop-blur-md rounded-lg p-4 border border-white/20 shadow-2xl"
      style={{ animation: 'slideInRight 0.3s ease-out' }}
      data-vibes-panel
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-white">Vibes</h2>
        <div className="text-xs text-gray-400 px-2 py-1 bg-white/10 rounded">
          {currentMode}
        </div>
      </div>
      
      {/* Preset Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {Object.keys(PRESETS).map((presetName) => (
          <button
            key={presetName}
            onClick={() => handlePresetClick(presetName)}
            className={`px-3 py-2 rounded text-sm font-medium transition-all ${
              currentMode === presetName
                ? 'bg-white text-black border-2 border-white'
                : 'bg-white/10 text-white border border-white/30 hover:bg-white/20'
            }`}
          >
            {presetName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      <div className="mt-4 text-xs text-gray-400 text-center">
        Select a vibe to change the scene atmosphere
      </div>
    </div>
  );
}
