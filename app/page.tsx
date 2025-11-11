'use client';

import { Suspense } from 'react';
import BabylonScene from '@/components/BabylonScene';
import UIOverlay from '@/components/UIOverlay';
import { crashLogger } from '@/utils/crashLogger';

export default function Home() {
  return (
    <main className="w-full h-screen relative overflow-hidden">
      <Suspense fallback={null}>
        <BabylonScene />
      </Suspense>
      
      <UIOverlay />
    </main>
  );
}
