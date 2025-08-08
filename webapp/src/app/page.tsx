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
  // Contract details
  const CONTRACT_ADDRESS = "0x3f47191577718C8B184c319316a89D3469335161";
  const BASE_MAINNET_CHAIN_ID = 8453;
  const SPIN_COST_WEI = "20000000000000"; // 0.00002 ETH

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
  
  // Contract state
  const [dailyWinners, setDailyWinners] = useState(0);
  const [maxDailyWinners] = useState(5);
  const [contractBalance, setContractBalance] = useState("0");
  const [jackpotAvailable, setJackpotAvailable] = useState(true);
  
  // Navigation state
  const [currentPage, setCurrentPage] = useState('game');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Add these with your other useState declarations
const [allPlayers, setAllPlayers] = useState<any[]>([]);
const [loadingPlayers, setLoadingPlayers] = useState(false);
  
  // Player stats with local storage
  const [playerStats, setPlayerStats] = useState({
    totalSpins: 0,
    totalWins: 0,
    totalSpent: 0,
    totalWinnings: 0,
    jackpotsWon: 0
  });

  const [refreshing, setRefreshing] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const symbols = ['🍒', '🍋', '🍊', '⭐', '💎', '🔔', '🎰', '7️⃣', '💰'];

  // Local storage functions for stats
  const getLocalStats = (fid: number) => {
    const key = `sloto-stats-${fid}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return { totalSpins: 0, totalWins: 0, totalSpent: 0, totalWinnings: 0, jackpotsWon: 0 };
      }
    }
    return { totalSpins: 0, totalWins: 0, totalSpent: 0, totalWinnings: 0, jackpotsWon: 0 };
  };

  const updateLocalStats = (fid: number, won: boolean, amount = 0, isJackpot = false) => {
    const key = `sloto-stats-${fid}`;
    const stats = getLocalStats(fid);
    
    stats.totalSpins++;
    stats.totalSpent += 0.00002; // Spin cost in ETH
    
    if (won) {
      stats.totalWins++;
      stats.totalWinnings += amount;
      if (isJackpot) {
        stats.jackpotsWon++;
      }
    }
    
    localStorage.setItem(key, JSON.stringify(stats));
    setPlayerStats(stats);
    
    console.log('📊 Local stats updated:', stats);
  };

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

  const fetchAllPlayers = async () => {
  try {
    setLoadingPlayers(true);
    const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
    
    console.log('🔍 Fetching players from blockchain (chunked approach)...');
    
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      ["event GamePlayed(uint256 indexed fid, address indexed wallet, bool won, uint8 winType, uint256 amount, uint256 day)"],
      provider
    );

    const deploymentBlock = 33888108;
    const currentBlock = await provider.getBlockNumber();
    const playerDatabase = new Map();
    
    // Process in smaller chunks to avoid timeouts
    const chunkSize = 10000; // Scan 10k blocks at a time
    let processed = 0;
    
    for (let fromBlock = deploymentBlock; fromBlock < currentBlock; fromBlock += chunkSize) {
      try {
        const toBlock = Math.min(fromBlock + chunkSize - 1, currentBlock);
        console.log(`📊 Scanning blocks ${fromBlock} to ${toBlock}`);
        
        const filter = contract.filters.GamePlayed();
        const events = await contract.queryFilter(filter, fromBlock, toBlock);
        
        events.forEach((event) => {
          const fid = event.args.fid.toString();
          const wallet = event.args.wallet;
          const won = event.args.won;
          const amount = Number(ethers.formatEther(event.args.amount || 0));
          
          if (!playerDatabase.has(fid)) {
            playerDatabase.set(fid, {
              fid: fid,
              address: `${wallet.slice(0, 6)}...${wallet.slice(-4)}`,
              fullAddress: wallet,
              totalSpins: 0,
              totalWins: 0,
              totalSpent: 0,
              totalWinnings: 0,
              isWinner: false,
              timestamp: 'Historical',
              reward: '$0.00'
            });
          }
          
          const player = playerDatabase.get(fid);
          player.totalSpins++;
          player.totalSpent += 0.00002;
          
          if (won) {
            player.totalWins++;
            player.totalWinnings += amount;
            player.isWinner = true;
          }
        });
        
        processed += (toBlock - fromBlock + 1);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (chunkError) {
        console.log(`Failed to scan blocks ${fromBlock}-${Math.min(fromBlock + chunkSize - 1, currentBlock)}`);
        // Continue with next chunk instead of failing completely
      }
    }
    
    // Convert to array and add final formatting
    const allPlayersArray = Array.from(playerDatabase.values());
    allPlayersArray.forEach(player => {
      player.reward = player.totalWinnings > 0 ? `$${(player.totalWinnings * 3877).toFixed(2)}` : '$0.00';
    });
    
    const sortedPlayers = allPlayersArray.sort((a, b) => {
      if (b.totalWinnings !== a.totalWinnings) {
        return b.totalWinnings - a.totalWinnings;
      }
      return b.totalSpins - a.totalSpins;
    });
    
    console.log(`📈 Successfully processed ${sortedPlayers.length} unique players from ${processed} blocks`);
    setAllPlayers(sortedPlayers);
    
  } catch (error) {
    console.error('❌ Failed to fetch blockchain data:', error);
    // Graceful fallback
    setAllPlayers([]);
  } finally {
    setLoadingPlayers(false);
  }
};
  
  
  
  // FIXED: Only call functions that actually exist
  const loadContractData = async (fid: number, showLoadingNotification = false) => {
    try {
      if (showLoadingNotification) {
        setRefreshing(true);
        showNotification('🔄 Refreshing stats...', 'blue');
      }
      
      const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
      
      // Only call getContractBalance which should work
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        ["function getContractBalance() external view returns (uint256)"],
        provider
      );
      
      try {
        const balance = await contract.getContractBalance();
        setContractBalance(Number(ethers.formatEther(balance)).toFixed(4));
        console.log('✅ Contract balance loaded:', ethers.formatEther(balance));
      } catch (balanceError) {
        console.error('❌ Balance call failed:', balanceError);
        setContractBalance("0.003");
      }

      // Load stats from localStorage
      const localStats = getLocalStats(fid);
      setPlayerStats(localStats);
      
      // Set working defaults for other data
      setDailyWinners(0);
      setHasWonToday(false);
      setJackpotAvailable(true);
      setLeaderboard([]);
      
      if (showLoadingNotification) {
        showNotification('✅ Stats loaded from local storage!', 'green');
      }

    } catch (error) {
      console.error('❌ Failed to load contract data:', error);
      setContractBalance("0.003");
      
      // Still load local stats even if contract call fails
      const localStats = getLocalStats(fid);
      setPlayerStats(localStats);
      
      if (showLoadingNotification) {
        showNotification('📊 Showing local stats only', 'orange');
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

  // Load local stats on component mount
  useEffect(() => {
    if (userFid) {
      const localStats = getLocalStats(userFid);
      setPlayerStats(localStats);
    }
  }, [userFid]);

  // Auto-refresh stats when viewing history page
  useEffect(() => {
    if (currentPage === 'history' && isConnected && userFid) {
      loadContractData(userFid);
    }
  }, [currentPage, isConnected, userFid]);
  
// Leaderboard
useEffect(() => {
  if (currentPage === 'leaderboard') {
    fetchAllPlayers();
  }
}, [currentPage]);
  
  
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
  }, []);

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

  // FIXED: Play slot machine with real transaction monitoring
      // FIXED: Complete spinReels function that reads actual contract results from events
const spinReels = async () => {
  if (spinning || hasWonToday || !userFid) return;
  
  try {
    setLoading(true);
    setError('');
    setSpinning(true);
    setHasWon(false);
    
    setSpinning1(true);
    setSpinning2(true);
    setSpinning3(true);

    // Use wallet provider for signing transactions
    const walletProvider = await getProvider();
    const signer = await walletProvider.getSigner();
    
    // Create separate read-only provider for receipts
    const readOnlyProvider = new ethers.JsonRpcProvider('https://mainnet.base.org');
    
    // Get initial balance using read-only provider
    const walletAddress = await signer.getAddress();
    const initialBalance = await readOnlyProvider.getBalance(walletAddress);
    
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      ["function playSlotMachine(uint256 fid) external payable"],
      signer
    );
    
    showNotification(`🎰 Sending transaction...`, 'blue');

    // Send transaction using wallet provider
    const tx = await contract.playSlotMachine(userFid, {
      value: SPIN_COST_WEI,
      gasLimit: 300000
    });
    
    showNotification(`⏳ Transaction sent! Waiting for confirmation...`, 'blue');
    console.log('📤 Transaction hash:', tx.hash);

    // Start with spinning animation using random symbols
    const tempReels = [
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)]
    ];

    // Animate first two reels with temporary symbols while waiting
    setTimeout(() => { 
      setSpinning1(false); 
      setReels(prev => [tempReels[0], prev[1], prev[2]]); 
    }, 1000);
    setTimeout(() => { 
      setSpinning2(false); 
      setReels(prev => [prev[0], tempReels[1], prev[2]]); 
    }, 1500);

    // Wait for transaction receipt
    let receipt = null;
    let attempts = 0;
    const maxAttempts = 30;
    
    while (!receipt && attempts < maxAttempts) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        receipt = await readOnlyProvider.getTransactionReceipt(tx.hash);
        attempts++;
      } catch (receiptError) {
        console.log(`Receipt attempt ${attempts} failed:`, receiptError);
        attempts++;
      }
    }

    if (!receipt) {
      throw new Error('Transaction receipt not found after 30 seconds');
    }

    console.log('🧾 Receipt found:', receipt);

    // ✅ FIXED: Parse the GamePlayed event to get actual reel results
    let actualReelResults = null;
    let actualWinAmount = 0;
    let wonSomething = false;
    
    // Replace the problematic section in your spinReels function (around line 420-435)
// FIXED: Add null check for decoded result

try {
  // Your existing contract emits: GamePlayed(uint256 indexed fid, address indexed wallet, bool won, uint8 winType, uint256 amount, uint256 day)
  // We need to find this event in the transaction logs
  const gamePlayedTopic = ethers.id("GamePlayed(uint256,address,bool,uint8,uint256,uint256)");
  const gameLog = receipt.logs.find(log => log.topics && log.topics[0] === gamePlayedTopic);
  
  if (gameLog) {
    console.log('📊 Found GamePlayed event:', gameLog);
    
    // Decode the event data
    const iface = new ethers.Interface([
      "event GamePlayed(uint256 indexed fid, address indexed wallet, bool won, uint8 winType, uint256 amount, uint256 day)"
    ]);
    const decoded = iface.parseLog(gameLog);
    
    // ✅ FIXED: Add null check for decoded result
    if (decoded) {
      wonSomething = decoded.args.won;
      actualWinAmount = Number(ethers.formatEther(decoded.args.amount));
      const winType = decoded.args.winType;
      
      console.log('✅ Decoded game results:', {
        won: wonSomething,
        winType: winType,
        amount: actualWinAmount
      });
      
      // Since we can't get actual reels from your current contract,
      // we'll generate realistic reels based on the win type
      actualReelResults = generateReelsBasedOnWin(wonSomething, winType, actualWinAmount);
    } else {
      console.warn('⚠️ Failed to decode GamePlayed event');
    }
  } else {
    console.warn('⚠️ GamePlayed event not found, using balance calculation');
  }
} catch (decodeError) {
  console.warn('⚠️ Failed to decode event:', decodeError);
}

    // Fallback: Check balance change if event parsing failed
    if (actualReelResults === null) {
      const finalBalance = await readOnlyProvider.getBalance(walletAddress);
      const rawBalanceChange = finalBalance - initialBalance;
      const balanceChange = rawBalanceChange + BigInt(SPIN_COST_WEI);
      
      if (balanceChange > 0) {
        actualWinAmount = Number(ethers.formatEther(balanceChange));
        wonSomething = true;
      }
      
      // Generate realistic reels based on balance change
      actualReelResults = generateReelsBasedOnBalance(actualWinAmount);
    }

    // Show the final reel result
    setTimeout(() => { 
      setSpinning3(false); 
      setReels(actualReelResults); // Use calculated realistic reels
      
      // Process win results
      if (receipt.status === 1) {
        let isJackpot = false;
        
        if (wonSomething && actualWinAmount > 0) {
          if (actualWinAmount >= 0.003) {
            isJackpot = true;
            setHasWon(true);
            showNotification(`🎉 JACKPOT! Won ${actualWinAmount.toFixed(5)} ETH! ${actualReelResults.join('')}`, 'green');
          } else if (actualWinAmount >= 0.0001) {
            showNotification(`🎊 Three of a kind! Won ${actualWinAmount.toFixed(5)} ETH! ${actualReelResults.join('')}`, 'green');
          } else if (actualWinAmount >= 0.00006) {
            showNotification(`⭐ Two 7️⃣s! Won ${actualWinAmount.toFixed(5)} ETH! ${actualReelResults.join('')}`, 'green');
          } else if (actualWinAmount >= 0.00002) {
            showNotification(`💰 Pair! Won ${actualWinAmount.toFixed(5)} ETH! ${actualReelResults.join('')}`, 'green');
          } else {
            showNotification(`💎 Small win! Won ${actualWinAmount.toFixed(5)} ETH! ${actualReelResults.join('')}`, 'green');
          }
        } else {
          showNotification(`😔 No win this time. ${actualReelResults.join('')} Better luck next spin!`, 'orange');
        }

        // Update local stats with actual results
        updateLocalStats(userFid, wonSomething, actualWinAmount, isJackpot);
        
        console.log('🎰 Spin completed:', {
          transactionHash: tx.hash,
          reelsShown: actualReelResults,
          actualReward: actualWinAmount,
          wonSomething,
          isJackpot
        });
      } else {
        showNotification(`❌ Transaction failed. No rewards received.`, 'red');
        updateLocalStats(userFid, false, 0, false);
      }
    }, 2000);

  } catch (error: any) {
    console.error('❌ Transaction error:', error);
    
    // Stop spinning on error
    setSpinning1(false);
    setSpinning2(false);
    setSpinning3(false);
    
    if (error.code === 4001 || error.message.includes('user rejected')) {
      setError('Transaction cancelled by user');
      showNotification('❌ Transaction cancelled', 'orange');
    } else {
      setError(`Transaction error: ${error.message.slice(0, 100)}`);
      showNotification('❌ Transaction failed - check console for details', 'red');
    }
    
    // Update stats with failed attempt
    updateLocalStats(userFid, false, 0, false);
    
  } finally {
    setLoading(false);
    setSpinning(false);
    setSpinning1(false);
    setSpinning2(false);
    setSpinning3(false);
  }
};

// ✅ HELPER FUNCTION: Generate realistic reel results based on win outcome
const generateReelsBasedOnWin = (won: boolean, winType: number, amount: number): string[] => {
  const symbols = ['🍒', '🍋', '🍊', '⭐', '💎', '🔔', '🎰', '7️⃣', '💰'];
  
  if (!won) {
    // Generate a losing combination (no pairs, no matches)
    const reel1 = symbols[Math.floor(Math.random() * symbols.length)];
    let reel2, reel3;
    
    do {
      reel2 = symbols[Math.floor(Math.random() * symbols.length)];
    } while (reel2 === reel1);
    
    do {
      reel3 = symbols[Math.floor(Math.random() * symbols.length)];
    } while (reel3 === reel1 || reel3 === reel2);
    
    return [reel1, reel2, reel3];
  }
  
  // Generate winning combinations based on amount
  if (amount >= 0.003) {
    // Jackpot - triple 7️⃣
    return ['7️⃣', '7️⃣', '7️⃣'];
  } else if (amount >= 0.0001) {
    // Three of a kind (non-7)
    const symbol = symbols[Math.floor(Math.random() * 7)]; // Exclude 7️⃣
    return [symbol, symbol, symbol];
  } else if (amount >= 0.00006) {
    // Two 7️⃣s
    const positions = [0, 1, 2];
    const sevenPositions = positions.sort(() => 0.5 - Math.random()).slice(0, 2);
    const result = ['', '', ''];
    
    sevenPositions.forEach(pos => result[pos] = '7️⃣');
    
    // Fill remaining position with non-7
    for (let i = 0; i < 3; i++) {
      if (result[i] === '') {
        const nonSevenSymbols = symbols.filter(s => s !== '7️⃣');
        result[i] = nonSevenSymbols[Math.floor(Math.random() * nonSevenSymbols.length)];
      }
    }
    
    return result;
  } else {
    // Pair win
    const pairSymbol = symbols[Math.floor(Math.random() * symbols.length)];
    const positions = Math.random() < 0.5 ? [0, 1] : Math.random() < 0.5 ? [0, 2] : [1, 2];
    const result = ['', '', ''];
    
    positions.forEach(pos => result[pos] = pairSymbol);
    
    // Fill remaining position
    for (let i = 0; i < 3; i++) {
      if (result[i] === '') {
        let differentSymbol;
        do {
          differentSymbol = symbols[Math.floor(Math.random() * symbols.length)];
        } while (differentSymbol === pairSymbol);
        result[i] = differentSymbol;
      }
    }
    
    return result;
  }
};

// ✅ HELPER FUNCTION: Generate reels based on balance change (fallback)
const generateReelsBasedOnBalance = (amount: number): string[] => {
  const symbols = ['🍒', '🍋', '🍊', '⭐', '💎', '🔔', '🎰', '7️⃣', '💰'];
  
  if (amount <= 0) {
    // No win - generate losing combo
    const reel1 = symbols[Math.floor(Math.random() * symbols.length)];
    let reel2, reel3;
    
    do {
      reel2 = symbols[Math.floor(Math.random() * symbols.length)];
    } while (reel2 === reel1);
    
    do {
      reel3 = symbols[Math.floor(Math.random() * symbols.length)];
    } while (reel3 === reel1 || reel3 === reel2);
    
    return [reel1, reel2, reel3];
  }
  
  // Generate winning combo based on amount (same logic as above)
  return generateReelsBasedOnWin(true, amount >= 0.003 ? 4 : amount >= 0.0001 ? 3 : amount >= 0.00006 ? 2 : 1, amount);
};
  
  // Share function
  const handleShare = async () => {
    try {
      let shareText;

      if (hasWon || hasWonToday) {
        shareText = `🎰💰 I just won real ETH from Sloto-caster slot machine game! 

You can also win - start playing now! 🎯

https://farcaster.xyz/miniapps/q48CMd_Ss_iF/sloto-caster`;
      } else {
        shareText = `🎰 I'm playing Sloto-caster where you can earn ETH by getting 7️⃣7️⃣7️⃣ in the slot machine! 

Hit the $11.63 jackpot! 💰

https://farcaster.xyz/miniapps/q48CMd_Ss_iF/sloto-caster`;
      }

      if (inMiniApp) {
        const result = await sdk.actions.composeCast({
          text: shareText,
        });
        
        if (result?.cast) {
          showNotification('🎉 Cast posted successfully!', 'green');
        } else {
          showNotification('📝 Cast composer opened!', 'blue');
        }
      } else {
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
            <span className="text-sm sm:text-base">Contract Balance</span>
          </div>
          <span className="font-bold text-sm sm:text-base">{contractBalance} ETH</span>
        </div>
        <div className="text-center text-white/80 text-xs mt-2">
          Live on Base Mainnet • Real ETH rewards
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
            {playerStats.totalSpins > 0 && (
              <div className="text-green-400 text-xs sm:text-sm mt-1">
                📊 {playerStats.totalSpins} spins • {playerStats.totalWins} wins
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Refresh Button */}
      {isConnected && userFid && (
        <div className="text-center mb-4">
          <button
            onClick={() => loadContractData(userFid, true)}
            disabled={refreshing || loading}
            className="bg-blue-600/20 border border-blue-400 text-blue-200 px-4 py-2 rounded-lg text-sm hover:bg-blue-600/30 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            <div className={refreshing ? 'animate-spin' : ''}>🔄</div>
            {refreshing ? 'Refreshing...' : 'Refresh Balance & Stats'}
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

        <div className="bg-black text-green-400 font-mono text-center py-2 px-2 sm:px-4 rounded mb-3 sm:mb-4 border border-green-400 text-xs sm:text-sm">
          🎰 REAL ETH REWARDS! 🎰<br/>
          💰 7️⃣7️⃣7️⃣ = $11.63<br/>
          💎 🍒🍒🍒 = $0.39<br/>
          ⭐ 7️⃣7️⃣ = $0.23<br/>
          🎯 Any pair = $0.08
        </div>

        <button
          onClick={spinReels}
          disabled={!isConnected || loading || spinning}
          className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-bold text-base sm:text-xl flex items-center justify-center gap-2 sm:gap-3 transition-all duration-200 shadow-lg ${
            !isConnected || loading || spinning
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-red-600 to-red-800 text-white hover:from-red-700 hover:to-red-900 shadow-xl hover:shadow-2xl border-2 border-yellow-400'
          }`}
        >
          <Play className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
          <span className="text-center leading-tight">
            {loading ? 'PROCESSING...' :
             spinning ? 'SPINNING...' : 
             !isConnected ? 'CONNECT WALLET' :
             'PULL THE LEVER'}
          </span>
        </button>
      </div>

      {/* Win Message */}
      {hasWon && (
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-4 mb-4 sm:mb-6 text-center border-2 border-yellow-400 shadow-xl">
          <div className="text-3xl sm:text-4xl mb-2">🎰💰🎉</div>
          <h3 className="text-white font-bold text-lg sm:text-xl mb-2">REAL JACKPOT!</h3>
          <p className="text-white/90 mb-2 sm:mb-4 text-sm sm:text-base">You won real ETH!</p>
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
      <button
        onClick={fetchAllPlayers}
        disabled={loadingPlayers}
        className="bg-purple-600 px-3 py-1 rounded text-white text-xs hover:bg-purple-700 ml-auto disabled:opacity-50 flex items-center gap-1"
      >
        <div className={loadingPlayers ? 'animate-spin' : ''}>🔄</div>
        {loadingPlayers ? 'Loading...' : 'Refresh'}
      </button>
    </div>

    <div className="bg-white/10 rounded-lg p-4 sm:p-6 border border-purple-400">
      <div className="text-center mb-4 sm:mb-6">
        <div className="text-4xl sm:text-6xl mb-2">🏆</div>
        <h2 className="text-lg sm:text-xl font-bold text-white mb-2">SLOTO-CASTER LEADERBOARD</h2>
        <p className="text-white/80 text-sm sm:text-base">All players ranked by performance!</p>
        <div className="text-white/60 text-xs mt-2">
          Showing {allPlayers.length} total players
        </div>
      </div>

      {loadingPlayers ? (
        <div className="text-center py-6 sm:py-8">
          <div className="text-3xl sm:text-4xl mb-4">⏳</div>
          <p className="text-white/80 text-sm sm:text-base">Loading player data...</p>
        </div>
      ) : allPlayers.length > 0 ? (
        <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto">
          {allPlayers.map((player, index) => (
            <div key={`${player.fid}-${index}`} className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                  <div className="text-2xl sm:text-3xl flex-shrink-0">
                    {player.isWinner ? 
                      (index === 0 ? '👑' : index === 1 ? '🥇' : index === 2 ? '🥈' : index === 3 ? '🥉' : '🏆') :
                      '🎰'
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-white text-sm sm:text-lg font-bold">FID: {player.fid}</div>
                      {player.isWinner && <div className="text-green-400 text-xs bg-green-400/20 px-2 py-1 rounded">WINNER</div>}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-white/80 mt-1">
                      <span>🎰 {player.totalSpins} spins</span>
                      <span>🏆 {player.totalWins} wins</span>
                      {player.totalWinnings > 0 && (
                        <span className="text-green-400">💰 {player.totalWinnings.toFixed(4)} ETH</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <div className="text-green-400 font-bold text-sm">{player.reward}</div>
                  <div className="text-white/60 text-xs">
                    {player.totalSpins > 0 ? `${((player.totalWins / player.totalSpins) * 100).toFixed(1)}% win rate` : 'No spins'}
                  </div>
                  <div className="text-yellow-400 font-semibold text-xs">{player.timestamp}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 sm:py-8">
          <div className="text-3xl sm:text-4xl mb-4">🎯</div>
          <p className="text-white/80 text-sm sm:text-base">No players found! Be the first to spin!</p>
        </div>
      )}
    </div>
  </>
);
  
  
  // Stats page with local storage display
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
              
              {/* Main stats grid */}
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

              {/* Profit/Loss indicator */}
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
                <p className="text-white/40">Stats tracked locally and updated after each transaction</p>
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
