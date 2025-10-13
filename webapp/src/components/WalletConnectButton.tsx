'use client';

import React from 'react';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { Wallet } from 'lucide-react';

export function WalletConnectButton() {
  const { open } = useAppKit();
  const { isConnected, address } = useAppKitAccount();

  const handleClick = () => {
    open();
  };

  if (isConnected && address) {
    return (
      <button
        onClick={handleClick}
        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 sm:px-6 rounded-lg font-semibold flex items-center justify-center gap-2 hover:from-green-700 hover:to-emerald-700 transition-all duration-200 text-sm sm:text-base border-2 border-green-400"
      >
        <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
        <span>{address.slice(0, 6)}...{address.slice(-4)}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 sm:px-6 rounded-lg font-semibold flex items-center justify-center gap-2 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-sm sm:text-base shadow-lg hover:shadow-xl"
    >
      <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
      <span>Connect Wallet</span>
    </button>
  );
}
