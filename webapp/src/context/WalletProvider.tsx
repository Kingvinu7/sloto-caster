'use client';

import React, { ReactNode } from 'react';
import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { base, baseSepolia } from '@reown/appkit/networks';

// Your WalletConnect Project ID - Get one at https://cloud.reown.com
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'a9e76b0ec4e509017100199fb6ff6957';

// Define metadata for your app
const metadata = {
  name: 'Sloto-caster',
  description: 'Farcaster slot machine game on Base network. Win real ETH!',
  url: 'https://sloto-caster.vercel.app',
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
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#7c3aed',
    '--w3m-border-radius-master': '12px'
  }
});

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  return <>{children}</>;
}
