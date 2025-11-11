'use client';

import { useState, useEffect } from 'react';

export default function LoadingScreen() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!loading) return null;

  return (
    <div className="absolute inset-0 bg-black flex items-center justify-center z-50">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-pulse">🦇</div>
        <div className="text-2xl font-bold text-green-400 mb-2">
          Loading Batman Cave...
        </div>
        <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    </div>
  );
}



