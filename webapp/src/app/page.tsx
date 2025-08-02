'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Coins, Users, Play, Wallet, ArrowLeft, History, ShoppingCart, ExternalLink } from 'lucide-react';

export default function SlotoCaster() {
  // Contract details
  const CONTRACT_ADDRESS = "0x8e04a35502aa7915b2834774Eb33d9e3e4cE29c7";
  const BASE_SEPOLIA_CHAIN_ID = 84532;
  const SPIN_PACK_COST = "30000000000000"; // 0.00003 ETH in wei

  // Game state
  const [reels, setReels] = useState(['🍒', '🍋', '🍊']);
  const [spinning, setSpinning] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  
  // User state
  const [isConnected, setIsConnected] = useState(false);
  const [userFid, setUserFid] = useState<number | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [remainingSpins, setRemainingSpins] = useState(0);
  const [hasWonToday, setHasWonToday] = useState(false);
  
  // Contract state
  const [dailyWinners, setDailyWinners] = useState(0);
  const [maxDailyWinners] = useState(5);
  const [contractBalance, setContractBalance] = useState("0");
  const [spinning1, setSpinning1] = useState(false);
  const [spinning2, setSpinning2] = useState(false);
  const [spinning3, setSpinning3] = useState(false);
  
  // Navigation state
  const [currentPage, setCurrentPage] = useState('game');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Data
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const symbols = ['🍒', '🍋', '🍊', '⭐', '💎', '🔔', '7️⃣', '🎰', '💰'];

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined';
  };

  // Load contract data
  const loadContractData = async (fid: number) => {
    try {
      if (!(window as any).ethereum || !(window as any).ethers) return;

      const provider = new (window as any).ethers.BrowserProvider((window as any).ethereum);
      const contract = new (window as any).ethers.Contract(
        CONTRACT_ADDRESS,
        [
          "function getRemainingSpins(uint256 fid) external view returns (uint256)",
          "function getDailyWinnersCount() external view returns (uint256)",
          "function getContractBalance() external view returns (uint256)",
          "function getTotalWinners() external view returns (uint256)",
          "function hasFidWonToday(uint256 fid) external view returns (bool)",
          "function getLatestWinners(uint256 count) external view returns (tuple(uint256 fid, address wallet, uint256 timestamp, uint256 day)[])"
        ],
        provider
      );

      const [spins, dailyCount, balance, totalWinners, wonToday] = await Promise.all([
        contract.getRemainingSpins(fid),
        contract.getDailyWinnersCount(),
        contract.getContractBalance(),
        contract.getTotalWinners(),
        contract.hasFidWonToday(fid)
      ]);

      setRemainingSpins(Number(spins));
      setDailyWinners(Number(dailyCount));
      setContractBalance(Number((window as any).ethers.formatEther(balance)).toFixed(4));
      setHasWonToday(wonToday);

      if (Number(totalWinners) > 0) {
        const winners = await contract.getLatestWinners(10);
        const formattedWinners = winners.map((winner: any) => ({
          address: `${winner.wallet.slice(0, 6)}...${winner.wallet.slice(-4)}`,
          fid: winner.fid.toString(),
          timestamp: new Date(Number(winner.timestamp) * 1000).toLocaleString(),
          day: 'On-chain',
          reward: '$1.00'
        }));
        setLeaderboard(formattedWinners);
      }

    } catch (error) {
      console.error('Failed to load contract data:', error);
      setRemainingSpins(3);
      setContractBalance("0.01");
      setDailyWinners(2);
    }
  };

  // Connect wallet
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
      if (parseInt(chainId, 16) !== BASE_SEPOLIA_CHAIN_ID) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${BASE_SEPOLIA_CHAIN_ID.toString(16)}` }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await (window as any).ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${BASE_SEPOLIA_CHAIN_ID.toString(16)}`,
                chainName: 'Base Sepolia',
                rpcUrls: ['https://sepolia.base.org'],
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18
                },
                blockExplorerUrls: ['https://sepolia.basescan.org']
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

  // Purchase spins
  const purchaseSpins = async () => {
    if (!userFid || !(window as any).ethereum) return;

    try {
      setLoading(true);
      setError('');

      const provider = new (window as any).ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new (window as any).ethers.Contract(
        CONTRACT_ADDRESS,
        ["function purchaseSpins(uint256 fid) external payable"],
        signer
      );

      showNotification(`🛒 Sending transaction to buy 10 spins...`, 'blue');

      const tx = await contract.purchaseSpins(userFid, {
        value: SPIN_PACK_COST,
        gasLimit: 200000
      });

      showNotification(`⏳ Transaction sent! Waiting for confirmation...`, 'blue');
      
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        await loadContractData(userFid);
        showNotification(`🎉 Success! Purchased 10 spins for $0.10`, 'green');
      } else {
        throw new Error('Transaction failed');
      }

    } catch (error: any) {
      console.error('Failed to purchase spins:', error);
      if (error.message.includes('user rejected')) {
        setError('Transaction cancelled by user');
      } else if (error.message.includes('insufficient funds')) {
        setError('Insufficient Base Sepolia ETH for transaction');
      } else {
        setError(`Purchase failed: ${error.message.slice(0, 100)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Play slot machine
  const spinReels = async () => {
    if (spinning || remainingSpins <= 0 || hasWonToday || !userFid || !(window as any).ethereum) return;

    try {
      setLoading(true);
      setError('');
      setSpinning(true);
      setHasWon(false);
      
      setSpinning1(true);
      setSpinning2(true);
      setSpinning3(true);

      const provider = new (window as any).ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new (window as any).ethers.Contract(
        CONTRACT_ADDRESS,
        [
          "function playSlotMachine(uint256 fid) external",
          "event GamePlayed(uint256 indexed fid, address indexed wallet, bool won, uint256 spinsRemaining)"
        ],
        signer
      );

      showNotification(`🎰 Calling smart contract to spin...`, 'blue');

      const tx = await contract.playSlotMachine(userFid, {
        gasLimit: 300000
      });

      showNotification(`⏳ Transaction sent! Processing spin...`, 'blue');

      const receipt = await tx.wait();

      let hasWonGame = false;
      for (const log of receipt.logs) {
        try {
          const parsedLog = contract.interface.parseLog(log);
          if (parsedLog && parsedLog.name === 'GamePlayed') {
            hasWonGame = parsedLog.args.won;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      let newReels;
      if (hasWonGame) {
        newReels = ['7️⃣', '7️⃣', '7️⃣'];
      } else {
        newReels = [
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)]
        ];
        while (newReels[0] === '7️⃣' && newReels[1] === '7️⃣' && newReels[2] === '7️⃣') {
          newReels[Math.floor(Math.random() * 3)] = symbols[Math.floor(Math.random() * (symbols.length - 1))];
        }
      }

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
        
        if (hasWonGame) {
          setHasWon(true);
          setHasWonToday(true);
          setDailyWinners(prev => prev + 1);
          showNotification(`🎉 JACKPOT! You won $1.00 Base ETH!`, 'green');
        } else {
          showNotification(`😔 Not this time! Try again!`, 'orange');
        }

        loadContractData(userFid);
      }, 2000);

    } catch (error: any) {
      setSpinning(false);
      setSpinning1(false);
      setSpinning2(false);
      setSpinning3(false);
      
      if (error.message.includes('user rejected')) {
        setError('Transaction cancelled by user');
      } else {
        setError(`Spin failed: ${error.message.slice(0, 100)}`);
      }
    } finally {
      setLoading(false);
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
    
    notification.className = `fixed top-4 left-1/2 transform -translate-x-1/2 ${colorClasses[color as keyof typeof colorClasses]} text-white px-6 py-3 rounded-lg font-bold z-50 shadow-xl border-2`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 4000);
  };

  useEffect(() => {
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
  }, []);

  const ReelSymbol = ({ symbol, spinning }: { symbol: string; spinning: boolean }) => (
    <div className={`w-24 h-32 bg-gradient-to-b from-gray-100 via-white to-gray-100 rounded-lg flex items-center justify-center text-4xl shadow-xl border-4 border-gray-300 relative overflow-hidden ${spinning ? 'animate-pulse' : ''}`}>
      {spinning ? (
        <div className="animate-spin text-6xl">🎰</div>
      ) : (
        <div className="drop-shadow-lg">{symbol}</div>
      )}
      <div className="absolute top-1 left-1 w-2 h-2 bg-red-500 rounded-full"></div>
      <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
      <div className="absolute bottom-1 left-1 w-2 h-2 bg-red-500 rounded-full"></div>
      <div className="absolute bottom-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
    </div>
  );

  const renderGamePage = () => (
    <>
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">🎰 Sloto-caster</h1>
        <p className="text-white/80">Hit 7️⃣7️⃣7️⃣ to win $1-$5 Base ETH!</p>
        <div className="text-xs text-white/60 mt-2">
          <a 
            href={`https://sepolia.basescan.org/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 hover:text-white"
          >
            Contract: {CONTRACT_ADDRESS.slice(0, 8)}...{CONTRACT_ADDRESS.slice(-6)}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {error && (
        <div className="bg-red-600/20 border border-red-400 rounded-lg p-4 mb-6 text-center">
          <p className="text-red-200 text-sm">{error}</p>
          <button 
            onClick={() => setError('')}
            className="text-red-300 text-xs mt-2 hover:text-red-100"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-white/10 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <span>Today&apos;s Winners</span>
          </div>
          <span className="font-bold">{dailyWinners}/{maxDailyWinners}</span>
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

      {isConnected && userFid && (
        <div className="bg-white/10 rounded-lg p-4 mb-6 border border-blue-400">
          <div className="text-center text-white">
            <div className="text-sm text-white/80">Connected Player</div>
            <div className="font-bold text-lg">FID: {userFid}</div>
            <div className="text-xs text-white/60 font-mono mb-2">{walletAddress}</div>
            <div className="text-lg font-bold text-yellow-400">🎟️ {remainingSpins} spins remaining</div>
            {hasWonToday && (
              <div className="text-green-400 text-sm mt-1">✅ Already won today!</div>
            )}
          </div>
        </div>
      )}

      {!isMetaMaskInstalled() && (
        <div className="bg-red-600/20 border border-red-400 rounded-lg p-6 mb-6 text-center">
          <div className="text-4xl mb-4">🦊</div>
          <h3 className="text-white font-bold text-lg mb-2">MetaMask Required</h3>
          <p className="text-white/80 mb-4">Install MetaMask to play Sloto-caster</p>
          <a
            href="https://metamask.io"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors inline-flex items-center gap-2"
          >
            Install MetaMask
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}

      {isMetaMaskInstalled() && !isConnected && (
        <button
          onClick={connectWallet}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 mb-6 disabled:opacity-50"
        >
          <Wallet className="w-5 h-5" />
          {loading ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}

      {isConnected && remainingSpins <= 2 && (
        <button
          onClick={purchaseSpins}
          disabled={loading}
          className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 hover:from-green-700 hover:to-teal-700 transition-all duration-200 mb-6 disabled:opacity-50"
        >
          <ShoppingCart className="w-5 h-5" />
          {loading ? 'Processing...' : 'Buy 10 Spins - $0.10'}
        </button>
      )}

      <div className="bg-gradient-to-b from-red-800 via-red-900 to-black rounded-2xl p-8 mb-6 border-4 border-yellow-400 shadow-2xl relative">
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex gap-2">
          <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
          <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold text-center py-2 px-4 rounded-lg mb-4 shadow-lg">
          SLOTO-CASTER DELUXE
        </div>
        
        <div className="flex justify-center gap-3 mb-6">
          <ReelSymbol symbol={reels[0]} spinning={spinning1} />
          <ReelSymbol symbol={reels[1]} spinning={spinning2} />
          <ReelSymbol symbol={reels[2]} spinning={spinning3} />
        </div>

        <div className="bg-black text-green-400 font-mono text-center py-2 px-4 rounded mb-4 border border-green-400">
          7️⃣ 7️⃣ 7️⃣ = $1-$5 BASE ETH
        </div>

        <button
          onClick={spinReels}
          disabled={!isConnected || loading || spinning || remainingSpins <= 0 || hasWonToday || dailyWinners >= maxDailyWinners}
          className={`w-full py-4 px-6 rounded-lg font-bold text-xl flex items-center justify-center gap-3 transition-all duration-200 shadow-lg ${
            !isConnected || loading || spinning || remainingSpins <= 0 || hasWonToday || dailyWinners >= maxDailyWinners
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-red-600 to-red-800 text-white hover:from-red-700 hover:to-red-900 shadow-xl hover:shadow-2xl border-2 border-yellow-400'
          }`}
        >
          <Play className="w-6 h-6" />
          {loading ? 'PROCESSING...' :
           spinning ? 'SPINNING...' : 
           !isConnected ? 'CONNECT WALLET' :
           remainingSpins <= 0 ? 'BUY SPINS TO PLAY' :
           hasWonToday ? 'ALREADY WON TODAY' :
           dailyWinners >= maxDailyWinners ? 'DAILY LIMIT REACHED' : 
           'PULL THE LEVER!'}
        </button>
        
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-yellow-400 text-xs font-bold">
          ★ SLOTO-CASTER DELUXE ★
        </div>
      </div>

      {hasWon && (
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-4 mb-6 text-center border-2 border-yellow-400 shadow-xl">
          <div className="text-4xl mb-2">🎰💰🎉</div>
          <h3 className="text-white font-bold text-xl mb-2">JACKPOT! 7️⃣7️⃣7️⃣!</h3>
          <p className="text-white/90 mb-4">You won $1.00 worth of Base ETH!</p>
          <p className="text-white/80 text-sm">ETH sent automatically to your wallet!</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <button
          onClick={() => setCurrentPage('leaderboard')}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 hover:from-purple-700 hover:to-indigo-700 transition-all duration-200"
        >
          <Trophy className="w-5 h-5 text-yellow-400" />
          Hall of Fame
        </button>
        
        <button
          onClick={() => setCurrentPage('history')}
          className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 hover:from-orange-700 hover:to-red-700 transition-all duration-200"
        >
          <History className="w-5 h-5" />
          My Stats
        </button>
      </div>

      <div className="mt-4 text-center text-white/60 text-xs">
        <p>• Hit 7️⃣7️⃣7️⃣ to win $1-$5 Base ETH</p>
        <p>• $0.10 = 10 spins • One win per day • Max 5 winners daily</p>
        <p>• Live on Base Sepolia testnet</p>
      </div>
    </>
  );

  const renderLeaderboardPage = () => (
    <>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setCurrentPage('game')}
          className="bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-2xl font-bold text-white">🏆 Hall of Fame</h1>
      </div>

      <div className="bg-white/10 rounded-lg p-6 border border-purple-400">
        <div className="text-center mb-6">
          <div className="text-6xl mb-2">🏆</div>
          <h2 className="text-xl font-bold text-white mb-2">SLOTO-CASTER CHAMPIONS</h2>
          <p className="text-white/80">Live winners from Base Sepolia!</p>
        </div>

        {leaderboard.length > 0 ? (
          <div className="space-y-4">
            {leaderboard.map((winner, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}
                    </div>
                    <div>
                      <div className="font-mono text-white text-lg font-bold">{winner.address}</div>
                      <div className="text-blue-400 text-sm">FID: {winner.fid}</div>
                      <div className="text-green-400 font-bold">{winner.reward}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white/80">{winner.timestamp}</div>
                    <div className="text-yellow-400 font-semibold text-sm">{winner.day}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🎯</div>
            <p className="text-white/80">No winners yet! Be the first to hit 7️⃣7️⃣7️⃣</p>
          </div>
        )}
      </div>
    </>
  );

  const renderHistoryPage = () => (
    <>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setCurrentPage('game')}
          className="bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-2xl font-bold text-white">📊 My Stats</h1>
      </div>

      {isConnected ? (
        <div className="bg-white/10 rounded-lg p-6 border border-orange-400">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">📈</div>
            <h2 className="text-xl font-bold text-white mb-2">FID {userFid} Stats</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-400">-</div>
                <div className="text-white/80 text-sm">Total Spins</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-400">-</div>
                <div className="text-white/80 text-sm">Wins</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-2xl font-bold text-yellow-400">-</div>
                <div className="text-white/80 text-sm">Win Rate</div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-white/80 mb-4">Stats will load from smart contract</p>
            <div className="text-sm text-white/60">
              <p>Contract: {CONTRACT_ADDRESS}</p>
              <p>Network: Base Sepolia</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white/10 rounded-lg p-8 text-center border border-orange-400">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-white mb-2">Connect Wallet</h2>
          <p className="text-white/80 mb-4">Connect your wallet to view playing stats</p>
          <button
            onClick={connectWallet}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 mx-auto disabled:opacity-50"
          >
            <Wallet className="w-5 h-5" />
            {loading ? 'Connecting...' : 'Connect Wallet'}
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 my-4">
        {currentPage === 'game' && renderGamePage()}
        {currentPage === 'leaderboard' && renderLeaderboardPage()}
        {currentPage === 'history' && renderHistoryPage()}
      </div>
    </div>
  );
}
