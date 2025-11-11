'use client';

interface ControlsPanelProps {
  onClose: () => void;
}

export default function ControlsPanel({ onClose }: ControlsPanelProps) {
  
  return (
    <div 
      className="bg-black/95 backdrop-blur-sm rounded-lg p-6 border border-white/30 shadow-xl max-w-md"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-white">Controls</h2>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 text-xl"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-4 text-sm text-gray-300">
        <div>
          <h3 className="text-white font-semibold mb-2">Movement</h3>
          <div className="space-y-1 ml-4">
            <div className="flex justify-between">
              <span>Move Forward</span>
              <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">W</kbd>
            </div>
            <div className="flex justify-between">
              <span>Move Backward</span>
              <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">S</kbd>
            </div>
            <div className="flex justify-between">
              <span>Strafe Left</span>
              <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">A</kbd>
            </div>
            <div className="flex justify-between">
              <span>Strafe Right</span>
              <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">D</kbd>
            </div>
            <div className="flex justify-between">
              <span>Move Up</span>
              <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">Space</kbd>
            </div>
            <div className="flex justify-between">
              <span>Move Down</span>
              <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">Shift</kbd>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-white font-semibold mb-2">Camera</h3>
          <div className="space-y-1 ml-4">
            <div className="flex justify-between">
              <span>Look Around</span>
              <span className="text-xs text-gray-400">Mouse</span>
            </div>
            <div className="flex justify-between">
              <span>Zoom In</span>
              <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">Z</kbd>
            </div>
            <div className="flex justify-between">
              <span>Zoom Out</span>
              <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">X</kbd>
            </div>
            <div className="flex justify-between">
              <span>Toggle 1st/3rd Person</span>
              <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">F</kbd>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-white font-semibold mb-2">Camera & Cursor</h3>
          <div className="space-y-1 ml-4">
            <div className="flex justify-between">
              <span>Toggle Pointer Lock</span>
              <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">C</kbd>
            </div>
            <div className="text-xs text-gray-400 mt-2">
              <strong>Mouse Control:</strong> Drag to rotate camera, scroll to zoom.<br/>
              <strong>Pointer Lock (C):</strong> FPS-style control - cursor hidden, mouse rotates view.<br/>
              Press ESC or C to unlock cursor.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

