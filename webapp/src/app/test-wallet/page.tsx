'use client';

import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { useEffect, useState } from 'react';
import ClientOnly from '../ClientOnly';

function TestWalletContent() {
  const { open } = useAppKit();
  const { address, isConnected, caipAddress, status } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('eip155');
  const [providerInfo, setProviderInfo] = useState<any>(null);

  useEffect(() => {
    if (walletProvider) {
      setProviderInfo({
        hasProvider: true,
        type: typeof walletProvider,
        keys: Object.keys(walletProvider).slice(0, 10),
      });
    }
  }, [walletProvider]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <h1 className="text-2xl font-bold text-white mb-6">🧪 Reown AppKit Test Page</h1>
        
        <div className="space-y-4">
          <button
            onClick={() => open()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700"
          >
            Open Wallet Modal
          </button>

          <div className="bg-black/30 p-4 rounded-lg text-white space-y-2">
            <h2 className="font-bold text-lg mb-3">Connection Status:</h2>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-semibold">Is Connected:</div>
              <div className={isConnected ? 'text-green-400' : 'text-red-400'}>
                {isConnected ? '✅ Yes' : '❌ No'}
              </div>

              <div className="font-semibold">Status:</div>
              <div className="text-yellow-400">{status || 'N/A'}</div>

              <div className="font-semibold">Address:</div>
              <div className="font-mono text-xs break-all">
                {address || 'Not connected'}
              </div>

              <div className="font-semibold">CAIP Address:</div>
              <div className="font-mono text-xs break-all">
                {caipAddress || 'Not connected'}
              </div>

              <div className="font-semibold">Provider Available:</div>
              <div className={walletProvider ? 'text-green-400' : 'text-red-400'}>
                {walletProvider ? '✅ Yes' : '❌ No'}
              </div>
            </div>

            {providerInfo && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="font-semibold mb-2">Provider Info:</div>
                <pre className="text-xs bg-black/50 p-2 rounded overflow-x-auto">
                  {JSON.stringify(providerInfo, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div className="bg-blue-900/30 p-4 rounded-lg text-white text-sm">
            <h3 className="font-bold mb-2">📊 Expected Results:</h3>
            <ul className="space-y-1 list-disc list-inside">
              <li>Click &quot;Open Wallet Modal&quot; should show wallet options</li>
              <li>After connecting, &quot;Is Connected&quot; should be ✅ Yes</li>
              <li>Address should show your wallet address (0x...)</li>
              <li>CAIP Address should show with chain ID (eip155:8453:0x...)</li>
              <li>Provider Available should be ✅ Yes</li>
            </ul>
          </div>

          <div className="bg-orange-900/30 p-4 rounded-lg text-white text-sm">
            <h3 className="font-bold mb-2">🔍 Check Console Logs:</h3>
            <p>Open browser DevTools (F12) → Console tab</p>
            <p className="mt-2">Look for:</p>
            <pre className="bg-black/50 p-2 rounded mt-1 text-xs">
✅ Reown AppKit initialized with project ID: a9e76b0ec4e509017100199fb6ff6957
            </pre>
          </div>

          <div className="bg-green-900/30 p-4 rounded-lg text-white text-sm">
            <h3 className="font-bold mb-2">📍 Test URL:</h3>
            <p>Make sure this URL is whitelisted in Reown Dashboard:</p>
            <code className="bg-black/50 px-2 py-1 rounded text-xs">
              {typeof window !== 'undefined' ? window.location.origin : 'Loading...'}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TestWallet() {
  return (
    <ClientOnly>
      <TestWalletContent />
    </ClientOnly>
  );
}
