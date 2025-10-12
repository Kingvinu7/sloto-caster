'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';

export const useWalletConnection = () => {
  const { open } = useAppKit();
  const { address, isConnected, chainId } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('eip155');
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  useEffect(() => {
    if (isConnected && walletProvider) {
      const ethersProvider = new ethers.BrowserProvider(walletProvider);
      setProvider(ethersProvider);
      
      ethersProvider.getSigner().then((signer) => {
        setSigner(signer);
      });
    } else {
      setProvider(null);
      setSigner(null);
    }
  }, [isConnected, walletProvider]);

  const openWalletModal = () => {
    open();
  };

  return {
    address,
    isConnected,
    chainId,
    provider,
    signer,
    openWalletModal
  };
};
