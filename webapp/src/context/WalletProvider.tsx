'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { base, baseSepolia } from '@reown/appkit/networks';

// Your WalletConnect Project ID - Get one at https://cloud.reown.com
const projectId = 'a9e76b0ec4e509017100199fb6ff6957';

interface WalletProviderProps {
  children: ReactNode;
}

let isInitialized = false;

export function WalletProvider({ children }: WalletProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (!isInitialized && typeof window !== 'undefined') {
      isInitialized = true;

      // Define metadata for your app
      const metadata = {
        name: 'Sloto-caster',
        description: 'Farcaster slot machine game on Base network. Win real ETH!',
        url: window.location.origin,
        icons: ['https://sloto-caster.vercel.app/logo.png']
      };

      // Create the Reown AppKit instance
      createAppKit({
        adapters: [new EthersAdapter()],
        networks: [base, baseSepolia],
        metadata,
        projectId,
        features: {
          analytics: true,
          email: false,
          socials: false,
        },
        themeMode: 'dark',
        themeVariables: {
          '--w3m-accent': '#7c3aed',
          '--w3m-border-radius-master': '12px'
        },
        enableAnalytics: true,
        enableOnramp: false,
      });

      console.log('✅ Reown AppKit initialized with project ID:', projectId);
    }
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
