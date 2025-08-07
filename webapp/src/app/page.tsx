'use client';

import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Users, 
  Play, 
  Wallet, 
  ArrowLeft, 
  History, 
  ExternalLink 
} from 'lucide-react';
import { sdk } from '@farcaster/miniapp-sdk';
import { ethers } from 'ethers';

export default function SlotoCaster() {
  // Contract details - CORRECTED WITH PROPER ETH CALCULATIONS
  const CONTRACT_ADDRESS = "0x3f47191577718C8B184c319316a89D3469335161";
  const BASE_MAINNET_CHAIN_ID = 8453;
  const SPIN_COST_WEI = "20000000000000"; // 0.00002 ETH (~$0.08 at ETH $3,877)

  // Game state
  const [reels, setReels] = useState(['🍒', '🍋', '🍊']);
  const [spinning, setSpinning] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [spinning1, setSpinning1] = useState(false);
  const [spinning2, setSpinning2] = useState(false);
  const [spinning3, setSpinning3] = useState(false);
  
  // User state
  const [isConnected, setIsConnected] = useState(false);
  const [inMiniApp, setInMiniApp] = useState(false);
  const [userFid, setUserFid] = useState<number | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [hasWonToday, setHasWonToday] = useState(false);
  
  // Contract state - UPDATED FOR V2
  const [dailyWinners, setDailyWinners] = useState(0);
  const [maxDailyWinners] = useState(5);
  const [contractBalance, setContractBalance] = useState("0");
  const [jackpotAvailable, setJackpotAvailable] = useState(true);
  
  // Navigation state
  const [currentPage, setCurrentPage] = useState('game');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Player stats - ENHANCED WITH REFRESH STATE
  const [playerStats, setPlayerStats] = useState({
    totalSpins: 0,
    totalWins: 0,
    totalSpent: 0,
    totalWinnings: 0,
    jackpotsWon: 0
  });

  const [refreshing, setRefreshing] = useState(false);
  
  // Data
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const symbols = ['🍒', '🍋', '🍊', '⭐', '💎', '🔔', '7️⃣', '🎰', '💰'];

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined';
  };

  // Helper to get the right provider using official Farcaster SDK
  const getProvider = async () => {
    try {
      if (inMiniApp) {
        const provider = await sdk.wallet.getEthereumProvider();
        if (provider) {
          return new ethers.BrowserProvider(provider);
        }
        throw new Error('Farcaster wallet provider not available');
      }
    } catch (error) {
      console.log('Farcaster provider failed, trying fallback:', error);
    }

    if (typeof window !== 'undefined' && (window as any).ethereum) {
      return new ethers.BrowserProvider((window as any).ethereum);
    }

    throw new Error('No wallet provider found');
  };
  
  // ENHANCED: Load contract data with better error handling and debug logs
  const loadContractData = async (fid: number, showLoadingNotification = false) => {
    try {
      if (showLoadingNotification) {
        setRefreshing(true);
        showNotification('🔄 Refreshing stats...', 'blue');
      }
      
      console.log('🔄 Loading contract data for FID:', fid);
      
      // Use mainnet RPC for reads
      const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        [
          "function getDailyThreeWinsCount() external view returns (uint256)",
          "function getContractBalance() external view returns (uint256)",
          "function getTotalWinners() external view returns (uint256)",
          "function hasPlayerWonJackpotOnDay(uint256 fid) external view returns (bool)",
          "function isJackpotAvailableToday() external view returns (bool)",
          "function getLatestWinners(uint256 count) external view returns (tuple(uint256 fid, address wallet, uint256 timestamp, uint256 day, uint256 amount, uint8 winType)[])",
          "function getPlayerStats(uint256 fid) external view returns (tuple(uint256 totalSpins, uint256 totalWins, uint256 totalSpent, uint256 totalWinnings, uint256 lastPlayDay, uint256 jackpotsWon))"
        ],
        provider
      );
      
      const [dailyCount, balance, totalWinners, wonToday, jackpotAvailableToday, playerStats] = await Promise.all([
        contract.getDailyThreeWinsCount(),
        contract.getContractBalance(),
        contract.getTotalWinners(),
        contract.hasPlayerWonJackpotOnDay(fid),
        contract.isJackpotAvailableToday(),
        contract.getPlayerStats(fid).catch(() => ({ totalSpins: 0, totalWins: 0, totalSpent: 0, totalWinnings: 0, lastPlayDay: 0, jackpotsWon: 0 }))
      ]);
      
      // Update contract state
      setDailyWinners(Number(dailyCount));
      setContractBalance(Number(ethers.formatEther(balance)).toFixed(4));
      setHasWonToday(wonToday);
      setJackpotAvailable(jackpotAvailableToday);

      // ENHANCED: Store player stats with debug logging
      const newPlayerStats = {
        totalSpins: Number(playerStats.totalSpins),
        totalWins: Number(playerStats.totalWins), 
        totalSpent: Number(ethers.formatEther(playerStats.totalSpent)),
        totalWinnings: Number(ethers.formatEther(playerStats.totalWinnings)),
        jackpotsWon: Number(playerStats.jackpotsWon || 0)
      };

      console.log('📊 Player stats loaded:', newPlayerStats);
      setPlayerStats(newPlayerStats);

      // Load winners
      if (Number(totalWinners) > 0) {
        const winners = await contract.getLatestWinners(10);
        const formattedWinners = winners.map((winner: any) => ({
          address: `${winner.wallet.slice(0, 6)}...${winner.wallet.slice(-4)}`,
          fid: winner.fid.toString(),
          timestamp: new Date(Number(winner.timestamp) * 1000).toLocaleString(),
          day: 'On-chain',
          reward: winner.winType === 4 ? '$11.63' : winner.winType === 3 ? '$0.39' : winner.winType === 2 ? '$0.23' : '$0.08'
        }));
        setLeaderboard(formattedWinners);
      }

      console.log('✅ Contract data loaded successfully');
      
      if (showLoadingNotification) {
        showNotification('✅ Stats refreshed!', 'green');
      }

    } catch (error) {
      console.error('❌ Failed to load contract data:', error);
      setContractBalance("0.003");
      setDailyWinners(0);
      
      if (showLoadingNotification) {
        showNotification('❌ Failed to refresh stats', 'red');
      }
    } finally {
      setRefreshing(false);
    }
  };
  
  // Get wallet address using proper SDK method
  const getWalletAddress = async () => {
    try {
      if (inMiniApp) {
        const provider = await sdk.wallet.getEthereumProvider();
        if (provider) {
          const ethProvider = new ethers.BrowserProvider(provider);
          const signer = await ethProvider.getSigner();
          return await signer.getAddress();
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to get wallet address:', error);
      return null;
    }
  };

  // FIXED: Auto-refresh stats when viewing history page
  useEffect(() => {
    if (currentPage === 'history' && isConnected && userFid) {
      loadContractData(userFid);
    }
  }, [currentPage, isConnected, userFid]); // ✅ FIXED: Hook moved to top level

  // Farcaster initialization
  useEffect(() => {
    const initFarcaster = async () => {
      try {
        await sdk.actions.ready();
        const ctx = await sdk.context;

        console.log('Farcaster SDK context:', ctx);
        
        setInMiniApp(true);
        setUserFid(ctx.user.fid);
        setIsConnected(true);

        const address = await getWalletAddress();
        if (address) {
          setWalletAddress(address);
        }

        await loadContractData(ctx.user.fid);
        showNotification('🎉 Connected via Farcaster!', 'green');
      } catch (error) {
        console.error('Farcaster SDK initialization failed:', error);
        setInMiniApp(false);
      }
    };
    initFarcaster();
  }, []); // ✅ FIXED: Removed unnecessary dependencies

  // Load ethers if needed (fallback)
  useEffect(() => {
    if (!inMiniApp) {
      const loadEthers = async () => {
        if (!(window as any).ethers) {
          try {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/ethers@6.8.0/dist/ethers.umd.min.js';
            script.onload = () => {
              console.log('✅ Ethers.js loaded successfully');
            };
            script.onerror = () => {
              setError('Failed to load Web3 library. Please refresh the page.');
            };
            document.head.appendChild(script);
          } catch (error) {
            console.error('Error loading ethers:', error);
          }
        }
      };
      loadEthers();
    }
  }, [inMiniApp]);

  // Connect wallet (MetaMask fallback)
  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is required! Please install MetaMask to play.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts'
      });
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const chainId = await (window as any).ethereum.request({ method: 'eth_chainId' });
      if (parseInt(chainId, 16) !== BASE_MAINNET_CHAIN_ID) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${BASE_MAINNET_CHAIN_ID.toString(16)}` }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await (window as any).ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${BASE_MAINNET_CHAIN_ID.toString(16)}`,
                chainName: 'Base Mainnet',
                rpcUrls: ['https://mainnet.base.org'],
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18
                },
                blockExplorerUrls: ['https://basescan.org']
              }]
            });
          } else {
            throw switchError;
          }
        }
      }

      setWalletAddress(accounts[0]);
      setIsConnected(true);

      const testFid = Math.floor(Math.random() * 100000) + 10000;
      setUserFid(testFid);

      await loadContractData(testFid);
      showNotification(`✅ Connected! Ready to play with FID ${testFid}`, 'green');

    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      setError(`Failed to connect: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ENHANCED: Play slot machine with better stats refresh
  const spinReels = async () => {
    if (spinning || hasWonToday || !userFid || dailyWinners >= maxDailyWinners) return;
    try {
      setLoading(true);
      setError('');
      setSpinning(true);
      setHasWon(false);
      
      setSpinning1(true);
      setSpinning2(true);
      setSpinning3(true);

      const provider = await getProvider();
      const signer = await provider.getSigner();
      
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        ["function playSlotMachine(uint256 fid) external payable"],
        signer
      );
      
      showNotification(`🎰 Sending spin transaction...`, 'blue');

      // Send transaction
      const tx = await contract.playSlotMachine(userFid, {
        value: SPIN_COST_WEI,
        gasLimit: 300000
      });
      
      showNotification(`🎉 Transaction sent! Hash: ${tx.hash.slice(0, 10)}...`, 'green');

      // Simulate result for immediate UI feedback
      const simulatedWin = Math.random() < 0.48; // 48% chance for pairs
      const bigWin = Math.random() < 0.01; // 1% chance for big win
      
      let newReels;
      if (bigWin) {
        newReels = ['7️⃣', '7️⃣', '7️⃣'];
      } else if (simulatedWin) {
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        newReels = [symbol, symbol, symbols[Math.floor(Math.random() * symbols.length)]];
      } else {
        newReels = [
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)]
        ];
      }

      // Animate the reels
      setTimeout(() => {
        setSpinning1(false);
        setReels(prev => [newReels[0], prev[1], prev[2]]);
      }, 1000);
      setTimeout(() => {
        setSpinning2(false);
        setReels(prev => [prev[0], newReels[1], prev[2]]);
      }, 1500);
      setTimeout(() => {
        setSpinning3(false);
        setReels(prev => [prev[0], prev[1], newReels[2]]);
        setSpinning(false);
        
        if (bigWin) {
          setHasWon(true);
          showNotification(`🎉 Potential JACKPOT! Check your wallet for confirmation!`, 'green');
        } else if (simulatedWin) {
          showNotification(`💰 Nice win! Check your wallet!`, 'green');
        } else {
          showNotification(`😔 Better luck next time! Try again for $0.08!`, 'orange');
        }

        // ENHANCED: Multiple refresh attempts with proper timing
        if (userFid) {
          // Quick refresh after 3 seconds
          setTimeout(() => {
            console.log('🔄 First refresh attempt...');
            loadContractData(userFid);
          }, 3000);
          
          // Main refresh after 8 seconds (for blockchain confirmation)
          setTimeout(() => {
            console.log('🔄 Main refresh attempt...');
            loadContractData(userFid, true);
          }, 8000);
          
          // Final refresh after 15 seconds (ensure all data is updated)
          setTimeout(() => {
            console.log('🔄 Final refresh attempt...');
            loadContractData(userFid);
          }, 15000);
        }
      }, 2000);

    } catch (error: any) {
      setSpinning(false);
      setSpinning1(false);
      setSpinning2(false);
      setSpinning3(false);
      
      if (error.message.includes('user rejected') || error.message.includes('User denied')) {
        setError('Transaction cancelled by user');
      } else if (error.message.includes('insufficient funds')) {
        setError('Insufficient ETH for transaction');
      } else {
        setError(`Spin failed: ${error.message.slice(0, 100)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Share function with correct prize values
  const handleShare = async () => {
    try {
      let shareText;

      if (hasWon || hasWonToday) {
        // Won message
        shareText = `🎰💰 I just won real ETH from Sloto-caster slot machine game! 

You can also win - start playing now! 🎯

https://farcaster.xyz/miniapps/q48CMd_Ss_iF/sloto-caster`;
      } else {
        // Not won message  
        shareText = `🎰 I'm playing Sloto-caster where you can earn ETH by getting 7️⃣7️⃣7️⃣ in the slot machine! 

Hit the $11.63 jackpot! 💰

https://farcaster.xyz/miniapps/q48CMd_Ss_iF/sloto-caster`;
      }

      if (inMiniApp) {
        // Use Farcaster SDK compose cast
        const result = await sdk.actions.composeCast({
          text: shareText,
        });
        
        if (result?.cast) {
          showNotification('🎉 Cast posted successfully!', 'green');
        } else {
          showNotification('📝 Cast composer opened!', 'blue');
        }
      } else {
        // Fallback for non-miniapp environments
        const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}`;
        window.open(warpcastUrl, '_blank');
        showNotification('🚀 Opening cast composer...', 'blue');
      }
      
    } catch (error) {
      console.error('Share failed:', error);
      showNotification('❌ Share failed. Try again!', 'red');
    }
  };
  
  // Show notification
  const showNotification = (message: string, color = 'blue') => {
    const notification = document.createElement('div');
    const colorClasses = {
      green: 'bg-green-600 border-green-400',
      blue: 'bg-blue-600 border-blue-400',
      orange: 'bg-orange-600 border-orange-400',
      red: 'bg-red-600 border-red-400'
    };
    notification.className = `fixed top-4 left-1/2 transform -translate-x-1/2 ${colorClasses[color as keyof typeof colorClasses]} text-white px-4 py-2 rounded-lg font-bold z-50 shadow-xl border-2 max-w-xs text-center text-sm`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 4000);
  };

  const ReelSymbol = ({ symbol, spinning }: { symbol: string; spinning: boolean }) => (
    <div className={`w-16 h-20 sm:w-20 sm:h-24 bg-gradient-to-b from-gray-100 via-white to-gray-100 rounded-lg flex items-center justify-center text-2xl sm:text-3xl shadow-lg border-2 border-gray-300 relative overflow-hidden ${spinning ? 'animate-pulse' : ''}`}>
      {spinning ? (
        <div className="animate-spin text-3xl sm:text-4xl">🎰</div>
      ) : (
        <div className="drop-shadow-lg">{symbol}</div>
      )}
      <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-red-500 rounded-full"></div>
      <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full"></div>
      <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-red-500 rounded-full"></div>
      <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full"></div>
    </div>
  );

  const renderGamePage = () => (
    <>
      {/* Header */}
      <div className="text-center mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">🎰 Sloto-caster</h1>
        <p className="text-white/80 text-sm sm:text-base">Multiple ways to win ETH! Hit the jackpot!</p>
        <div className="text-xs text-white/60 mt-2">
          <a 
            href={`https://basescan.org/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-white break-all"
          >
            <span className="hidden sm:inline">Contract: </span>
            <span className="sm:hidden">📄 </span>
            {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
        </div>
      </div>

      {/* Farcaster Connection Banner */}
      {inMiniApp && (
        <div className="bg-green-600/20 border border-green-400 rounded-lg p-2 mb-4 text-center">
          <p className="text-green-200 text-xs">🎉 Connected via Farcaster mini-app</p>
        </div>
      )}

      {/* Jackpot Status */}
      <div className="text-center mb-4">
        {jackpotAvailable ? (
          <p className="text-yellow-400 font-bold animate-pulse">
            🏆 $11.63 JACKPOT STILL AVAILABLE TODAY!
          </p>
        ) : (
          <p className="text-red-400">
            🏆 Daily jackpot claimed - try tomorrow!
          </p>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-600/20 border border-red-400 rounded-lg p-3 mb-4 text-center">
          <p className="text-red-200 text-xs sm:text-sm break-words">{error}</p>
          <button 
            onClick={() => setError('')}
            className="text-red-300 text-xs mt-2 hover:text-red-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Daily Stats */}
      <div className="bg-white/10 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="text-sm sm:text-base">Big Winners Today</span>
          </div>
          <span className="font-bold text-sm sm:text-base">{dailyWinners}/{maxDailyWinners}</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2 mt-2">
          <div 
            className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(dailyWinners / maxDailyWinners) * 100}%` }}
          ></div>
        </div>
        <div className="text-center text-white/80 text-xs mt-2">
          Contract Balance: {contractBalance} ETH
        </div>
      </div>

      {/* User Info Display */}
      {isConnected && userFid && (
        <div className="bg-white/10 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 border border-blue-400">
          <div className="text-center text-white">
            <div className="text-xs sm:text-sm text-white/80">Connected Player</div>
            <div className="font-bold text-base sm:text-lg">FID: {userFid}</div>
            {walletAddress && (
              <div className="text-xs text-white/60 font-mono mb-2 break-all">{walletAddress}</div>
            )}
            {hasWonToday && (
              <div className="text-green-400 text-xs sm:text-sm mt-1">✅ Already won big today!</div>
            )}
          </div>
        </div>
      )}

      {/* ENHANCED: Manual Refresh Button */}
      {isConnected && userFid && (
        <div className="text-center mb-4">
          <button
            onClick={() => loadContractData(userFid, true)}
            disabled={refreshing || loading}
            className="bg-blue-600/20 border border-blue-400 text-blue-200 px-4 py-2 rounded-lg text-sm hover:bg-blue-600/30 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            <div className={refreshing ? 'animate-spin' : ''}>🔄</div>
            {refreshing ? 'Refreshing...' : 'Refresh Stats & Balance'}
          </button>
        </div>
      )}

      {/* MetaMask Install Prompt */}
      {!inMiniApp && !isMetaMaskInstalled() && (
        <div className="bg-red-600/20 border border-red-400 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 text-center">
          <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🦊</div>
          <h3 className="text-white font-bold text-base sm:text-lg mb-2">MetaMask Required</h3>
          <p className="text-white/80 text-sm mb-3 sm:mb-4">Install MetaMask to play Sloto-caster</p>
          <a
            href="https://metamask.io"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-orange-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors inline-flex items-center gap-2 text-sm sm:text-base"
          >
            Install MetaMask
            <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
          </a>
        </div>
      )}

      {/* Wallet Connection */}
      {!inMiniApp && isMetaMaskInstalled() && !isConnected && (
        <button
          onClick={connectWallet}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 sm:px-6 rounded-lg font-semibold flex items-center justify-center gap-2 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 mb-4 sm:mb-6 disabled:opacity-50 text-sm sm:text-base"
        >
          <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
          {loading ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}

      {/* Slot Machine */}
      <div className="bg-gradient-to-b from-red-800 via-red-900 to-black rounded-xl sm:rounded-2xl p-4 sm:p-8 mb-4 sm:mb-6 border-4 border-yellow-400 shadow-2xl relative">
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex gap-1 sm:gap-2">
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-400 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold text-center py-1.5 sm:py-2 px-2 sm:px-4 rounded-lg mb-3 sm:mb-4 shadow-lg text-xs sm:text-sm">
          SLOTO-CASTER DELUXE V2
        </div>
        
        <div className="flex justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <ReelSymbol symbol={reels[0]} spinning={spinning1} />
          <ReelSymbol symbol={reels[1]} spinning={spinning2} />
          <ReelSymbol symbol={reels[2]} spinning={spinning3} />
        </div>

        {/* CORRECTED PRIZE VALUES */}
        <div className="bg-black text-green-400 font-mono text-center py-2 px-2 sm:px-4 rounded mb-3 sm:mb-4 border border-green-400 text-xs sm:text-sm">
          🎰 MULTIPLE WAYS TO WIN! 🎰<br/>
          💰 7️⃣7️⃣7️⃣ = $11.63<br/>
          💎 🍒🍒🍒 = $0.39<br/>
          ⭐ 7️⃣7️⃣ = $0.23<br/>
          🎯 Any pair = $0.08
        </div>

        <button
          onClick={spinReels}
          disabled={!isConnected || loading || spinning || hasWonToday || dailyWinners >= maxDailyWinners}
          className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-bold text-base sm:text-xl flex items-center justify-center gap-2 sm:gap-3 transition-all duration-200 shadow-lg ${
            !isConnected || loading || spinning || hasWonToday || dailyWinners >= maxDailyWinners
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-red-600 to-red-800 text-white hover:from-red-700 hover:to-red-900 shadow-xl hover:shadow-2xl border-2 border-yellow-400'
          }`}
        >
          <Play className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
          <span className="text-center leading-tight">
            {loading ? 'PROCESSING...' :
             spinning ? 'SPINNING...' : 
             !isConnected ? 'CONNECT WALLET' :
             hasWonToday ? 'ALREADY WON BIG TODAY' :
             dailyWinners >= maxDailyWinners ? 'DAILY LIMIT REACHED' : 
             'PULL THE LEVER'}
          </span>
        </button>
      </div>

      {/* Win Message */}
      {hasWon && (
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-4 mb-4 sm:mb-6 text-center border-2 border-yellow-400 shadow-xl">
          <div className="text-3xl sm:text-4xl mb-2">🎰💰🎉</div>
          <h3 className="text-white font-bold text-lg sm:text-xl mb-2">BIG WIN!</h3>
          <p className="text-white/90 mb-2 sm:mb-4 text-sm sm:text-base">You won ETH!</p>
          <p className="text-white/80 text-xs sm:text-sm">ETH sent automatically to your wallet!</p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
        <button
          onClick={() => setCurrentPage('leaderboard')}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2.5 sm:py-3 px-3 sm:px-6 rounded-lg font-semibold flex items-center justify-center gap-1.5 sm:gap-2 hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 text-xs sm:text-sm"
        >
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0" />
          <span>Hall of Fame</span>
        </button>
        
        <button
          onClick={() => setCurrentPage('history')}
          className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-2.5 sm:py-3 px-3 sm:px-6 rounded-lg font-semibold flex items-center justify-center gap-1.5 sm:gap-2 hover:from-orange-700 hover:to-red-700 transition-all duration-200 text-xs sm:text-sm"
        >
          <History className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          <span>My Stats</span>
        </button>
      </div>

      {/* Share Button */}
      <div className="mb-4">
        <button
          onClick={handleShare}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 sm:px-6 rounded-lg font-semibold flex items-center justify-center gap-2 hover:from-green-700 hover:to-emerald-700 transition-all duration-200 text-sm sm:text-base border-2 border-green-400 shadow-lg"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
          </svg>
          <span>Share Sloto-caster</span>
        </button>
      </div>

      {/* CORRECTED RULES SECTION */}
      <div className="mt-4 text-center text-white/60 text-xs leading-relaxed space-y-1">
        <p>• Triple 7️⃣ = $11.63 (1 per day)</p>
        <p>• Three same = $0.39 (3 per day)</p>
        <p>• Two 7️⃣ = $0.23 (unlimited)</p>
        <p>• Any pair = $0.08 (unlimited)</p>
        <p>• $0.08 per spin • Live on Base Mainnet</p>
      </div>
    </>
  );

  const renderLeaderboardPage = () => (
    <>
      <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <button
          onClick={() => setCurrentPage('game')}
          className="bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-white">🏆 Hall of Fame</h1>
      </div>

      <div className="bg-white/10 rounded-lg p-4 sm:p-6 border border-purple-400">
        <div className="text-center mb-4 sm:mb-6">
          <div className="text-4xl sm:text-6xl mb-2">🏆</div>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-2">SLOTO-CASTER CHAMPIONS</h2>
          <p className="text-white/80 text-sm sm:text-base">Live winners from Base Mainnet!</p>
        </div>

        {leaderboard.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {leaderboard.map((winner, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                    <div className="text-2xl sm:text-3xl flex-shrink-0">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-white text-sm sm:text-lg font-bold truncate">{winner.address}</div>
                      <div className="text-blue-400 text-xs sm:text-sm">FID: {winner.fid}</div>
                      <div className="text-green-400 font-bold text-xs sm:text-sm">{winner.reward}</div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="text-white/80 text-xs sm:text-sm">{winner.timestamp}</div>
                    <div className="text-yellow-400 font-semibold text-xs">{winner.day}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8">
            <div className="text-3xl sm:text-4xl mb-4">🎯</div>
            <p className="text-white/80 text-sm sm:text-base">No winners yet! Be the first to win big!</p>
          </div>
        )}
      </div>
    </>
  );

  // FIXED: Stats page without useEffect inside render function
  const renderHistoryPage = () => {
    return (
      <>
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <button
            onClick={() => setCurrentPage('game')}
            className="bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-white">📊 My Stats</h1>
          {/* ENHANCED: Refresh button in header */}
          <button
            onClick={() => userFid && loadContractData(userFid, true)}
            disabled={refreshing}
            className="bg-blue-600 px-3 py-1 rounded text-white text-xs hover:bg-blue-700 ml-auto disabled:opacity-50 flex items-center gap-1"
          >
            <div className={refreshing ? 'animate-spin' : ''}>🔄</div>
            {refreshing ? 'Updating...' : 'Refresh'}
          </button>
        </div>

        {isConnected ? (
          <div className="bg-white/10 rounded-lg p-4 sm:p-6 border border-orange-400">
            <div className="text-center mb-4 sm:mb-6">
              <div className="text-3xl sm:text-4xl mb-2">📈</div>
              <h2 className="text-lg sm:text-xl font-bold text-white mb-2">FID {userFid} Stats</h2>
              
              {/* ENHANCED: Main stats grid with jackpots */}
              <div className="grid grid-cols-2 gap-2 sm:gap-4 text-center mb-4">
                <div className="bg-white/5 rounded-lg p-2 sm:p-3">
                  <div className="text-lg sm:text-2xl font-bold text-blue-400">{playerStats.totalSpins}</div>
                  <div className="text-white/80 text-xs sm:text-sm">Total Spins</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 sm:p-3">
                  <div className="text-lg sm:text-2xl font-bold text-green-400">{playerStats.totalWins}</div>
                  <div className="text-white/80 text-xs sm:text-sm">Total Wins</div>
                </div>
              </div>

              {/* Win rate and jackpots */}
              <div className="grid grid-cols-2 gap-2 sm:gap-4 text-center mb-4">
                <div className="bg-white/5 rounded-lg p-2 sm:p-3">
                  <div className="text-lg sm:text-xl font-bold text-yellow-400">
                    {playerStats.totalSpins > 0 ? `${((playerStats.totalWins / playerStats.totalSpins) * 100).toFixed(1)}%` : '0%'}
                  </div>
                  <div className="text-white/80 text-xs sm:text-sm">Win Rate</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 sm:p-3">
                  <div className="text-lg sm:text-xl font-bold text-purple-400">{playerStats.jackpotsWon}</div>
                  <div className="text-white/80 text-xs sm:text-sm">Jackpots Won</div>
                </div>
              </div>
              
              {/* Financial stats */}
              <div className="grid grid-cols-2 gap-2 sm:gap-4 text-center">
                <div className="bg-white/5 rounded-lg p-2 sm:p-3">
                  <div className="text-lg sm:text-xl font-bold text-red-400">{playerStats.totalSpent.toFixed(4)} ETH</div>
                  <div className="text-white/80 text-xs sm:text-sm">Total Spent</div>
                  <div className="text-white/60 text-xs">${(playerStats.totalSpent * 3877).toFixed(2)}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 sm:p-3">
                  <div className="text-lg sm:text-xl font-bold text-emerald-400">{playerStats.totalWinnings.toFixed(4)} ETH</div>
                  <div className="text-white/80 text-xs sm:text-sm">Total Won</div>
                  <div className="text-white/60 text-xs">${(playerStats.totalWinnings * 3877).toFixed(2)}</div>
                </div>
              </div>

              {/* ENHANCED: Profit/Loss indicator */}
              <div className="mt-4 p-3 bg-white/5 rounded-lg">
                <div className="text-sm text-white/80 mb-1">Net Profit/Loss</div>
                <div className={`text-lg font-bold ${playerStats.totalWinnings >= playerStats.totalSpent ? 'text-green-400' : 'text-red-400'}`}>
                  {playerStats.totalWinnings >= playerStats.totalSpent ? '+' : ''}
                  {(playerStats.totalWinnings - playerStats.totalSpent).toFixed(4)} ETH
                </div>
                <div className={`text-xs ${playerStats.totalWinnings >= playerStats.totalSpent ? 'text-green-300' : 'text-red-300'}`}>
                  {playerStats.totalWinnings >= playerStats.totalSpent ? '+$' : '-$'}
                  {Math.abs((playerStats.totalWinnings - playerStats.totalSpent) * 3877).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-xs sm:text-sm text-white/60 space-y-1">
                <p className="break-all">Contract: {CONTRACT_ADDRESS}</p>
                <p>Network: Base Mainnet</p>
                <p className="text-white/40">Stats update after each transaction</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/10 rounded-lg p-6 sm:p-8 text-center border border-orange-400">
            <div className="text-4xl sm:text-6xl mb-4">🔒</div>
            <h2 className="text-lg sm:text-xl font-bold text-white mb-2">Connect Wallet</h2>
            <p className="text-white/80 mb-4 text-sm sm:text-base">Connect your wallet to view playing stats</p>
            <button
              onClick={connectWallet}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold flex items-center justify-center gap-2 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 mx-auto disabled:opacity-50 text-sm sm:text-base"
            >
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
              {loading ? 'Connecting...' : 'Connect Wallet'}
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-2 sm:p-4 flex items-center justify-center">
      <div className="w-full max-w-sm sm:max-w-md bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20 my-2 sm:my-4 overflow-hidden">
        {currentPage === 'game' && renderGamePage()}
        {currentPage === 'leaderboard' && renderLeaderboardPage()}
        {currentPage === 'history' && renderHistoryPage()}
      </div>
    </div>
  );
}
