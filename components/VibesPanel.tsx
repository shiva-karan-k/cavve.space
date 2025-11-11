'use client';

import React, { useEffect, useState, useRef } from 'react';
import { PRESETS, Vibe } from '@/types/vibes';
import { Light } from '@babylonjs/core';

type SavedPresets = Record<string, Vibe>;
const LS_KEY = 'batcave_presets_v1';

export function loadSaved(): SavedPresets {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveAll(obj: SavedPresets) {
  localStorage.setItem(LS_KEY, JSON.stringify(obj));
}

function encodeVibe(v: Vibe): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(v))));
}

function decodeVibe(s: string): Vibe | null {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(s))));
  } catch {
    return null;
  }
}

interface VibesPanelProps {
  useWebGPU: boolean;
  setUseWebGPU: (v: boolean) => void;
  vibe: Vibe;
  setVibe: (v: Vibe) => void;
  listLights?: () => Light[];
  selectLight?: (name: string) => void;
  setGizmosEnabled?: (on: boolean) => void;
  setGizmoMode?: (mode: 'translate' | 'rotate' | 'scale') => void;
}

export default function VibesPanel({
  useWebGPU,
  setUseWebGPU,
  vibe,
  setVibe,
  listLights,
  selectLight,
  setGizmosEnabled,
  setGizmoMode,
}: VibesPanelProps) {
  const [saved, setSaved] = useState<SavedPresets>(loadSaved());
  const [newName, setNewName] = useState('');
  const [gizmosEnabled, setGizmosEnabledLocal] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [progress, setProgress] = useState(0);
  const sliderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Detect current preset
  const getCurrentPresetName = () => {
    for (const [name, preset] of Object.entries(PRESETS)) {
      if (JSON.stringify(preset) === JSON.stringify(vibe)) {
        return name;
      }
    }
    return 'custom';
  };
  
  const currentPresetName = getCurrentPresetName();

  // Load from URL if present
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const q = new URLSearchParams(window.location.search);
    const packed = q.get('vibe');
    if (packed) {
      const v = decodeVibe(packed);
      if (v) setVibe(v);
    }
  }, []);

  function applyPreset(name: string, custom = false) {
    const src = custom ? saved[name] : PRESETS[name];
    if (!src) return;
    
    // Show progress bar
    setIsApplying(true);
    setProgress(0);
    
    // Simulate progress steps
    const steps = [
      () => { setProgress(20); }, // Loading preset
      () => { setProgress(40); }, // Applying environment
      () => { setProgress(60); }, // Updating lights
      () => { setProgress(80); }, // Applying post-processing
      () => { setProgress(100); }, // Complete
    ];
    
    let stepIndex = 0;
    const progressInterval = setInterval(() => {
      if (stepIndex < steps.length) {
        steps[stepIndex]();
        stepIndex++;
      } else {
        clearInterval(progressInterval);
        setTimeout(() => {
          setIsApplying(false);
          setProgress(0);
        }, 200);
      }
    }, 100);
    
    // Apply the vibe
    setVibe({ ...src });
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('vibe', encodeVibe(src));
      window.history.replaceState(null, '', url.toString());
    }
  }

  function savePreset() {
    if (!newName.trim()) {
      alert('Give this preset a name');
      return;
    }
    const next = { ...saved, [newName]: { ...vibe } };
    setSaved(next);
    saveAll(next);
    setNewName('');
  }

  function deletePreset(name: string) {
    const next = { ...saved };
    delete next[name];
    setSaved(next);
    saveAll(next);
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(saved, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'batcave-presets.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(String(reader.result));
        setSaved(obj);
        saveAll(obj);
      } catch {
        alert('Invalid JSON');
      }
    };
    reader.readAsText(f);
  }

  function share() {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('vibe', encodeVibe(vibe));
    navigator.clipboard.writeText(url.toString());
    alert('Sharable link copied to clipboard!');
  }

  // Debounced vibe update for sliders
  const debouncedSetVibe = (newVibe: Vibe) => {
    // Clear existing timeout
    if (sliderTimeoutRef.current) {
      clearTimeout(sliderTimeoutRef.current);
    }
    
    // Set new timeout - only apply after 150ms of no changes
    sliderTimeoutRef.current = setTimeout(() => {
      setVibe(newVibe);
    }, 150);
  };
  
  const slider = (
    label: string,
    min: number,
    max: number,
    step: number,
    get: () => number,
    set: (n: number) => void,
    useDebounce = true
  ) => (
    <label className="flex items-center justify-between gap-2 text-sm">
      <span className="w-32">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={get()}
        onChange={(e) => set(parseFloat(e.target.value))}
        className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white"
      />
      <span className="w-12 text-right text-xs text-gray-400">{get().toFixed(2)}</span>
    </label>
  );

  return (
    <div
      className="absolute right-4 top-4 w-96 p-3 bg-black/60 backdrop-blur-sm text-gray-200 rounded-lg font-sans text-sm z-50 overflow-y-auto max-h-[90vh]"
      style={{ fontFamily: 'Inter, system-ui' }}
    >
      {/* Current Mode Display */}
      <div className="mb-3 p-2 bg-white/10 rounded border border-white/20">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Current Mode:</span>
          <span className="text-sm font-semibold text-white uppercase">{currentPresetName}</span>
        </div>
      </div>
      
      {/* Progress Bar */}
      {isApplying && (
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-400">Applying preset...</span>
            <span className="text-xs text-gray-400">{progress}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Presets */}
      <div className="flex flex-wrap gap-2 mb-3">
        {Object.keys(PRESETS).map((p) => (
          <button
            key={p}
            onClick={() => applyPreset(p)}
            className={`px-2 py-1 rounded border text-xs transition-all ${
              currentPresetName === p
                ? 'bg-white text-black border-white font-semibold'
                : 'bg-gray-900 hover:bg-gray-800 text-gray-300 border-gray-700'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* WebGPU Switch */}
      <label className="flex justify-between items-center mb-3 text-sm">
        <span>WebGPU (if available)</span>
        <input
          type="checkbox"
          checked={useWebGPU}
          onChange={(e) => setUseWebGPU(e.target.checked)}
          className="w-4 h-4"
        />
      </label>

      <div className="space-y-2 mb-3">
        {slider(
          'Env Intensity',
          0,
          1,
          0.01,
          () => vibe.envIntensity,
          (n) => setVibe({ ...vibe, envIntensity: n })
        )}
        {slider(
          'Exposure',
          0.5,
          2,
          0.01,
          () => vibe.exposure,
          (n) => setVibe({ ...vibe, exposure: n })
        )}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={vibe.bloom.enabled}
            onChange={(e) => setVibe({ ...vibe, bloom: { ...vibe.bloom, enabled: e.target.checked } })}
            className="w-4 h-4"
          />
          <span>Bloom</span>
        </label>
        {slider(
          'Bloom Thresh',
          0.6,
          1.4,
          0.01,
          () => vibe.bloom.threshold,
          (n) => setVibe({ ...vibe, bloom: { ...vibe.bloom, threshold: n } })
        )}
        {slider(
          'Bloom Weight',
          0,
          0.3,
          0.005,
          () => vibe.bloom.weight,
          (n) => setVibe({ ...vibe, bloom: { ...vibe.bloom, weight: n } })
        )}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={vibe.fog.enabled}
            onChange={(e) => setVibe({ ...vibe, fog: { ...vibe.fog, enabled: e.target.checked } })}
            className="w-4 h-4"
          />
          <span>Fog</span>
        </label>
        {slider(
          'Fog Density',
          0.0,
          0.01,
          0.0001,
          () => vibe.fog.density,
          (n) => setVibe({ ...vibe, fog: { ...vibe.fog, density: n } })
        )}
        {slider(
          'Key Intensity',
          0,
          1500,
          1,
          () => vibe.key.intensity,
          (n) => setVibe({ ...vibe, key: { ...vibe.key, intensity: n } })
        )}
        {slider(
          'Key Angle',
          10,
          50,
          0.5,
          () => vibe.key.angle,
          (n) => setVibe({ ...vibe, key: { ...vibe.key, angle: n } })
        )}
        {slider(
          'Rim Intensity',
          0,
          1500,
          1,
          () => vibe.rim.intensity,
          (n) => setVibe({ ...vibe, rim: { ...vibe.rim, intensity: n } })
        )}
        {slider(
          'Rim Angle',
          10,
          50,
          0.5,
          () => vibe.rim.angle,
          (n) => setVibe({ ...vibe, rim: { ...vibe.rim, angle: n } })
        )}
        {slider(
          'Emissive Boost',
          1,
          10,
          0.1,
          () => vibe.emissiveIntensity,
          (n) => setVibe({ ...vibe, emissiveIntensity: n })
        )}
      </div>

      {/* Lights & Gizmos */}
      <hr className="border-gray-700 my-3" />
      <div className="space-y-2 mb-3">
        <div className="flex justify-between items-center">
          <strong className="text-white">Lights</strong>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={gizmosEnabled}
              onChange={(e) => {
                setGizmosEnabledLocal(e.target.checked);
                setGizmosEnabled?.(e.target.checked);
              }}
              className="w-4 h-4"
            />
            <span>Gizmos</span>
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {(listLights?.() || []).map((l) => (
            <button
              key={l.name}
              onClick={() => selectLight?.(l.name)}
              className="px-2 py-1 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded border border-gray-700 text-xs"
            >
              {l.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setGizmoMode?.('translate')}
            className="px-2 py-1 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded border border-gray-700 text-xs"
          >
            Translate (W)
          </button>
          <button
            onClick={() => setGizmoMode?.('rotate')}
            className="px-2 py-1 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded border border-gray-700 text-xs"
          >
            Rotate (E)
          </button>
          <button
            onClick={() => setGizmoMode?.('scale')}
            className="px-2 py-1 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded border border-gray-700 text-xs"
          >
            Scale (R)
          </button>
        </div>
        <small className="text-xs text-gray-500">Tip: click a light name to attach gizmo; use W/E/R hotkeys.</small>
      </div>

      {/* Save/Load Presets */}
      <hr className="border-gray-700 my-3" />
      <div className="space-y-2 mb-3">
        <strong className="text-white block">Save Preset</strong>
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="preset name…"
            className="flex-1 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') savePreset();
            }}
          />
          <button
            onClick={savePreset}
            className="px-3 py-1 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded border border-gray-700 text-xs"
          >
            Save
          </button>
        </div>
        {Object.keys(saved).length > 0 && (
          <>
            <strong className="text-white block mt-3">My Presets</strong>
            <div className="space-y-1">
              {Object.keys(saved).map((name) => (
                <div key={name} className="flex gap-2">
                  <button
                    onClick={() => applyPreset(name, true)}
                    className="flex-1 px-2 py-1 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded border border-gray-700 text-xs text-left"
                  >
                    {name}
                  </button>
                  <button
                    onClick={() => deletePreset(name)}
                    className="px-2 py-1 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded border border-gray-700 text-xs"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
        <div className="flex gap-2 mt-3">
          <button
            onClick={exportJSON}
            className="px-3 py-1 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded border border-gray-700 text-xs"
          >
            Export
          </button>
          <label className="px-3 py-1 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded border border-gray-700 text-xs cursor-pointer">
            Import
            <input
              type="file"
              accept="application/json"
              onChange={importJSON}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Share Link */}
      <hr className="border-gray-700 my-3" />
      <div className="flex gap-2">
        <button
          onClick={() => applyPreset('noir')}
          className="flex-1 px-3 py-1 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded border border-gray-700 text-xs"
        >
          Reset Noir
        </button>
        <button
          onClick={share}
          className="flex-1 px-3 py-1 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded border border-gray-700 text-xs"
        >
          Share Link
        </button>
      </div>
    </div>
  );
}

