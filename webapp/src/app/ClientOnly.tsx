'use client';

import { useEffect, useState } from 'react';

export default function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-2 sm:p-4 flex items-center justify-center">
        <div className="w-full max-w-sm sm:max-w-md bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
          <div className="text-center">
            <div className="text-4xl mb-4">🎰</div>
            <div className="text-white">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
