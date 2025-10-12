# Wallet Integration Guide

This project uses **Reown AppKit** (formerly WalletConnect) for multi-wallet support, allowing users to connect with various Web3 wallets including MetaMask, Coinbase Wallet, Rainbow, Trust Wallet, and more.

## 🔑 Features

- **Multi-Wallet Support**: Connect with 300+ wallets via Reown AppKit
- **Network Support**: Base Mainnet and Base Sepolia testnet
- **Fallback Options**: Direct MetaMask connection as backup
- **Farcaster Integration**: Seamless integration with Farcaster mini-app
- **Modern UI**: Dark theme with custom purple accent colors

## 📦 Installation

The required packages are already installed:

```bash
npm install @reown/appkit @reown/appkit-adapter-ethers ethers@6.15.0
```

## ⚙️ Configuration

### 1. Get a WalletConnect Project ID

1. Visit [Reown Cloud](https://cloud.reown.com)
2. Create a new project
3. Copy your Project ID

### 2. Set Environment Variables

Create a `.env.local` file in the `webapp` directory:

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

You can also use the default project ID included in the code for testing.

## 🏗️ Architecture

### Components

1. **WalletProvider** (`src/context/WalletProvider.tsx`)
   - Initializes Reown AppKit globally
   - Configures networks and theme
   - Wraps the entire application

2. **useWalletConnection Hook** (`src/hooks/useWalletConnection.ts`)
   - Provides easy access to wallet state
   - Returns provider, signer, and connection status
   - Simplifies wallet interactions

3. **Main Game Integration** (`src/app/page.tsx`)
   - Uses `useAppKitAccount` hook
   - Displays connection button
   - Syncs wallet state with game

## 🎮 Usage

### Connecting a Wallet

Users can connect via:

1. **Reown AppKit Button**: Click the wallet button to see all available wallets
2. **MetaMask Direct**: Optional direct MetaMask connection
3. **Farcaster**: Automatic connection in Farcaster mini-app

### In Your Code

```typescript
import { useAppKitAccount } from '@reown/appkit/react';

function MyComponent() {
  const { address, isConnected, chainId } = useAppKitAccount();
  
  if (isConnected) {
    console.log('Connected wallet:', address);
    console.log('Chain ID:', chainId);
  }
}
```

### Custom Hook Usage

```typescript
import { useWalletConnection } from '@/hooks/useWalletConnection';

function MyComponent() {
  const { 
    address, 
    isConnected, 
    provider, 
    signer, 
    openWalletModal 
  } = useWalletConnection();
  
  const sendTransaction = async () => {
    if (!signer) return;
    
    const tx = await signer.sendTransaction({
      to: '0x...',
      value: ethers.parseEther('0.01')
    });
    
    await tx.wait();
  };
}
```

## 🌐 Supported Networks

- **Base Mainnet** (Chain ID: 8453)
- **Base Sepolia** (Chain ID: 84532)

## 🎨 Customization

### Theme Colors

Modify in `src/context/WalletProvider.tsx`:

```typescript
themeVariables: {
  '--w3m-accent': '#7c3aed', // Purple accent
  '--w3m-border-radius-master': '12px'
}
```

### Add More Networks

```typescript
import { arbitrum, optimism } from '@reown/appkit/networks';

createAppKit({
  // ... other config
  networks: [base, baseSepolia, arbitrum, optimism],
});
```

## 🔧 Troubleshooting

### Wallet Not Connecting

1. Check that your Project ID is valid
2. Ensure you're on a supported network
3. Try refreshing the page
4. Clear browser cache

### Environment Variable Not Loading

1. Make sure `.env.local` is in the `webapp` directory
2. Restart the Next.js development server
3. Check that the variable starts with `NEXT_PUBLIC_`

## 📚 Resources

- [Reown AppKit Docs](https://docs.reown.com/appkit/overview)
- [WalletConnect Cloud](https://cloud.reown.com)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Base Network](https://base.org/)

## 🚀 Deployment Notes

When deploying, make sure to:

1. Set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` in your hosting environment
2. Add your production domain to the WalletConnect project allowlist
3. Test wallet connections on the deployed site

---

Built with ❤️ using Reown AppKit (WalletConnect v2)
