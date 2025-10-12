'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';

export const useWalletConnection = () => {
  const { open } = useAppKit();
  const { address, isConnected, caipAddress } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('eip155');
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  useEffect(() => {
    const setupProvider = async () => {
      if (isConnected && walletProvider && caipAddress) {
        try {
          const ethersProvider = new ethers.BrowserProvider(walletProvider as any);
          setProvider(ethersProvider);
          
          const ethSigner = await ethersProvider.getSigner();
          setSigner(ethSigner);
        } catch (error) {
          console.error('Failed to setup wallet provider:', error);
          setProvider(null);
          setSigner(null);
        }
      } else {
        setProvider(null);
        setSigner(null);
      }
    };

    setupProvider();
  }, [isConnected, walletProvider, caipAddress]);

  const openWalletModal = () => {
    open();
  };

  return {
    address,
    isConnected,
    provider,
    signer,
    openWalletModal
  };
};
