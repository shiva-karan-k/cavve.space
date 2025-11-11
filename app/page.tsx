'use client';

import { Suspense, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import UIOverlay from '@/components/UIOverlay';

// Load BabylonScene AFTER UI is ready - prevents blocking
const BabylonScene = dynamic(() => import('@/components/BabylonScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-black">
      <div className="text-white text-center">
        <div className="animate-pulse text-6xl mb-4">🦇</div>
        <p className="text-lg">Loading Batcave...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  const [sceneReady, setSceneReady] = useState(false);

  useEffect(() => {
    // Delay scene loading to ensure UI is fully interactive first
    const timer = setTimeout(() => {
      setSceneReady(true);
    }, 100); // Small delay to let UI mount and become interactive
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="w-full h-screen relative overflow-hidden">
      {/* UI loads FIRST and is always interactive */}
      <UIOverlay />
      
      {/* Scene loads AFTER UI is ready */}
      {sceneReady && (
        <Suspense fallback={null}>
          <BabylonScene />
        </Suspense>
      )}
    </main>
  );
}
