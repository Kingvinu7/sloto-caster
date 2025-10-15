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
      const appKit = createAppKit({
        adapters: [new EthersAdapter()],
        networks: [base, baseSepolia],
        defaultNetwork: base,
        metadata,
        projectId,
        features: {
          analytics: true,
          email: false,
          socials: false,
          swaps: false,
          onramp: false
        },
        themeMode: 'dark',
        themeVariables: {
          '--w3m-accent': '#7c3aed',
          '--w3m-border-radius-master': '12px'
        },
        featuredWalletIds: [
          'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
          'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase
          '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
        ]
      });

      // Expose globally for debugging
      if (typeof window !== 'undefined') {
        (window as any).reownAppKit = appKit;
      }

      console.log('✅ Reown AppKit initialized with project ID:', projectId);
    }
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
