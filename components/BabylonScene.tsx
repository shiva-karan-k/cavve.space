'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Babylon.js to avoid SSR issues
const BabylonSceneContent = dynamic(() => import('./BabylonSceneContent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <div className="text-xl mb-2">Loading 3D Engine...</div>
        <div className="text-sm text-gray-400">Initializing Babylon.js</div>
      </div>
    </div>
  ),
});

export default function BabylonScene() {
  return <BabylonSceneContent />;
}

