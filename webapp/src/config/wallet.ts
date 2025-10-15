import { createAppKit } from '@reown/appkit';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { base, baseSepolia } from '@reown/appkit/networks';

// Your WalletConnect Project ID - Get one at https://cloud.reown.com
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

// Define metadata for your app
const metadata = {
  name: 'Sloto-caster',
  description: 'Farcaster slot machine game on Base network. Win real ETH!',
  url: 'https://sloto-caster.vercel.app',
  icons: ['https://sloto-caster.vercel.app/logo.png']
};

// Create the Reown AppKit instance
export const createWalletModal = () => {
  return createAppKit({
    adapters: [new EthersAdapter()],
    networks: [base, baseSepolia],
    metadata,
    projectId,
    features: {
      analytics: true,
      email: false,
      socials: false,
      emailShowWallets: true
    },
    themeMode: 'dark',
    themeVariables: {
      '--w3m-accent': '#7c3aed',
      '--w3m-border-radius-master': '12px'
    }
  });
};
