'use client';

import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Users,
  Play,
  Wallet,
  ArrowLeft,
  History,
  ShoppingCart,
  ExternalLink,
} from 'lucide-react';
import { sdk } from '@farcaster/miniapp-sdk';
import { ethers } from 'ethers';

/* ───────── constants ───────── */
const CONTRACT_ADDRESS = '0x8e04a35502aa7915b2834774Eb33d9e3e4cE29c7';
const BASE_SEPOLIA_CHAIN_ID = 84_532;
const PUBLIC_RPC = 'https://sepolia.base.org';
const SPIN_PACK_COST = '30000000000000'; // 0.00003 ETH (wei)
const symbols = ['🍒', '🍋', '🍊', '⭐', '💎', '🔔', '7️⃣', '🎰', '💰'];

export default function SlotoCaster() {
  /* ───────── state ───────── */
  const [reels, setReels] = useState(['🍒', '🍋', '🍊']);
  const [spinning, setSpinning] = useState(false);
  const [spin1, setSpin1] = useState(false);
  const [spin2, setSpin2] = useState(false);
  const [spin3, setSpin3] = useState(false);
  const [hasWon, setHasWon] = useState(false);

  const [isConnected, setIsConnected] = useState(false);
  const [inMiniApp, setInMiniApp] = useState(false);
  const [userFid, setUserFid] = useState<number | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const [remainingSpins, setRemainingSpins] = useState(0);
  const [hasWonToday, setHasWonToday] = useState(false);

  const [dailyWinners, setDailyWinners] = useState(0);
  const maxDailyWinners = 5;
  const [contractBalance, setContractBalance] = useState('0');

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState<'game' | 'leaderboard' | 'history'>('game');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* ───────── helpers ───────── */
  const isMetaMaskInstalled = () =>
    typeof window !== 'undefined' && (window as any).ethereum !== undefined;

  const showNotification = (msg: string, c: 'green' | 'blue' | 'orange' | 'red' = 'blue') => {
    const map = {
      green: 'bg-green-600 border-green-400',
      blue: 'bg-blue-600 border-blue-400',
      orange: 'bg-orange-600 border-orange-400',
      red: 'bg-red-600 border-red-400',
    } as const;
    const div = document.createElement('div');
    div.className = `fixed top-4 left-1/2 -translate-x-1/2 ${map[c]} text-white px-4 py-2 rounded-lg font-bold z-50 shadow-xl border-2 text-sm`;
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 4_000);
  };

  /* choose the right provider (fcast > ethereum) */
  const getProvider = () => {
    if (inMiniApp && (window as any).fcast) {
      return new ethers.BrowserProvider((window as any).fcast);
    }
    if ((window as any).ethereum) {
      return new ethers.BrowserProvider((window as any).ethereum);
    }
    throw new Error('No wallet provider found');
  };

  /* ───────── load on-chain state ───────── */
  const loadContractData = async (fid: number) => {
    try {
      const provider = new ethers.JsonRpcProvider(PUBLIC_RPC);
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        [
          'function getRemainingSpins(uint256) view returns (uint256)',
          'function getDailyWinnersCount() view returns (uint256)',
          'function getContractBalance() view returns (uint256)',
          'function getTotalWinners() view returns (uint256)',
          'function hasFidWonToday(uint256) view returns (bool)',
          'function getLatestWinners(uint256) view returns (tuple(uint256 fid,address wallet,uint256 timestamp,uint256 day)[])',
        ],
        provider,
      );

      const [spins, dailyCnt, bal, totalWinners, wonToday] = await Promise.all([
        contract.getRemainingSpins(fid),
        contract.getDailyWinnersCount(),
        contract.getContractBalance(),
        contract.getTotalWinners(),
        contract.hasFidWonToday(fid),
      ]);

      setRemainingSpins(Number(spins));
      setDailyWinners(Number(dailyCnt));
      setContractBalance(Number(ethers.formatEther(bal)).toFixed(4));
      setHasWonToday(wonToday);

      if (Number(totalWinners) > 0) {
        const winners = await contract.getLatestWinners(10);
        setLeaderboard(
          winners.map((w: any) => ({
            address: `${w.wallet.slice(0, 6)}…${w.wallet.slice(-4)}`,
            fid: w.fid.toString(),
            timestamp: new Date(Number(w.timestamp) * 1_000).toLocaleString(),
            day: 'On-chain',
            reward: '$1.00',
          })),
        );
      }
    } catch (e) {
      console.error(e);
      setError('Failed to load contract data');
    }
  };

  /* ───────── Farcaster auto-connect ───────── */
  useEffect(() => {
    (async () => {
      try {
        await sdk.actions.ready();
        const ctx = await sdk.context;

        setInMiniApp(true);
        setUserFid(ctx.user.fid);
        setWalletAddress(ctx.user.address);
        setIsConnected(true);

        await loadContractData(ctx.user.fid);
        showNotification('🎉 Connected via Farcaster!', 'green');
      } catch {
        setInMiniApp(false); // not in mini-app → fallback to MetaMask
      }
    })();
  }, []);

  /* ───────── MetaMask connect (fallback) ───────── */
  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is required! Please install MetaMask.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const eth = (window as any).ethereum;
      const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' });
      if (!accounts.length) throw new Error('No account');

      const chainHex: string = await eth.request({ method: 'eth_chainId' });
      if (parseInt(chainHex, 16) !== BASE_SEPOLIA_CHAIN_ID) {
        await eth.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${BASE_SEPOLIA_CHAIN_ID.toString(16)}` }],
        });
      }

      const randomFid = Math.floor(Math.random() * 100_000) + 10_000;
      setWalletAddress(accounts[0]);
      setUserFid(randomFid);
      setIsConnected(true);

      await loadContractData(randomFid);
      showNotification(`✅ Connected (FID ${randomFid})`, 'green');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  /* ───────── purchase spins ───────── */
  const purchaseSpins = async () => {
    if (!userFid) return;
    setLoading(true);
    try {
      const signer = await getProvider().getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        ['function purchaseSpins(uint256) payable'],
        signer,
      );
      const tx = await contract.purchaseSpins(userFid, { value: SPIN_PACK_COST, gasLimit: 200_000 });
      showNotification('🛒 Waiting for confirmation…', 'blue');
      await tx.wait();
      await loadContractData(userFid);
      showNotification('🎉 10 spins purchased!', 'green');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  /* ───────── main game action ───────── */
  const spinReels = async () => {
    if (
      spinning ||
      remainingSpins <= 0 ||
      hasWonToday ||
      !userFid ||
      loading ||
      dailyWinners >= maxDailyWinners
    )
      return;

    setLoading(true);
    setSpinning(true);
    setHasWon(false);
    setSpin1(true);
    setSpin2(true);
    setSpin3(true);

    try {
      const signer = await getProvider().getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        [
          'function playSlotMachine(uint256)',
          'event GamePlayed(uint256 indexed fid,address indexed wallet,bool won,uint256 spinsRemaining)',
        ],
        signer,
      );

      const tx = await contract.playSlotMachine(userFid, { gasLimit: 300_000 });
      const receipt = await tx.wait();

      let won = false;
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed && parsed.name === 'GamePlayed') {
            won = parsed.args.won;
            break;
          }
        } catch {
          /* ignore */
        }
      }

      const newSymbols = won
        ? ['7️⃣', '7️⃣', '7️⃣']
        : Array.from({ length: 3 }, () => symbols[Math.floor(Math.random() * symbols.length)]);

      setTimeout(() => {
        setSpin1(false);
        setReels((p) => [newSymbols[0], p[1], p[2]]);
      }, 1_000);
      setTimeout(() => {
        setSpin2(false);
        setReels((p) => [p[0], newSymbols[1], p[2]]);
      }, 1_500);
      setTimeout(async () => {
        setSpin3(false);
        setReels((p) => [p[0], p[1], newSymbols[2]]);
        setSpinning(false);

        if (won) {
          setHasWon(true);
          setHasWonToday(true);
          setDailyWinners((d) => d + 1);
          showNotification('🎉 JACKPOT! $1 Base ETH sent!', 'green');
        } else {
          showNotification('😔 Try again!', 'orange');
        }

        await loadContractData(userFid);
      }, 2_000);
    } catch (e: any) {
      setError(e.message);
      setSpinning(false);
      setSpin1(false);
      setSpin2(false);
      setSpin3(false);
    } finally {
      setLoading(false);
    }
  };

  /* ───────── UI bits ───────── */
  const Reel = ({ symbol, spinning }: { symbol: string; spinning: boolean }) => (
    <div
      className={`w-16 h-20 bg-gradient-to-b from-gray-100 via-white to-gray-100 rounded-lg flex items-center justify-center text-2xl shadow-lg border-2 border-gray-300 ${
        spinning ? 'animate-pulse' : ''
      }`}
    >
      {spinning ? <div className="animate-spin text-3xl">🎰</div> : <div>{symbol}</div>}
    </div>
  );

  const metaMaskButton =
    !inMiniApp &&
    !isConnected &&
    isMetaMaskInstalled() && (
      <button
        onClick={connectWallet}
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:from-blue-700 hover:to-purple-700 mb-4 disabled:opacity-50"
      >
        <Wallet className="w-4 h-4" />
        {loading ? 'Connecting…' : 'Connect Wallet'}
      </button>
    );

  /* ───────── page renders ───────── */
  const Game = () => (
    <>
      {/* header */}
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold text-white mb-1">🎰 Sloto-caster</h1>
        <p className="text-sm text-white/80">Hit 7️⃣7️⃣7️⃣ to win $1-$5 Base ETH!</p>
        <div className="text-xs text-white/60 mt-1">
          <a
            href={`https://sepolia.basescan.org/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-white"
          >
            {CONTRACT_ADDRESS.slice(0, 6)}…{CONTRACT_ADDRESS.slice(-4)}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* errors */}
      {error && (
        <div className="bg-red-600/20 border border-red-400 rounded-lg p-3 mb-4 text-center">
          <p className="text-red-200 text-xs">{error}</p>
          <button onClick={() => setError('')} className="text-red-300 text-xs mt-1">
            Dismiss
          </button>
        </div>
      )}

      {/* stats */}
      <div className="bg-white/10 rounded-lg p-3 mb-4">
        <div className="flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="text-sm">Today’s winners</span>
          </div>
          <span className="font-bold text-sm">
            {dailyWinners}/{maxDailyWinners}
          </span>
        </div>
        <div className="w-full bg-white/20 h-2 mt-2 rounded-full">
          <div
            className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
            style={{ width: `${(dailyWinners / maxDailyWinners) * 100}%` }}
          />
        </div>
        <div className="text-center text-white/80 text-xs mt-1">
          Balance {contractBalance} ETH
        </div>
      </div>

      {/* meta-mask button / mini-app banner */}
      {inMiniApp && (
        <div className="bg-green-600/20 border border-green-400 rounded-lg p-2 mb-4 text-center">
          <p className="text-green-200 text-xs">🎉 Connected via Farcaster mini-app</p>
        </div>
      )}
      {metaMaskButton}

      {/* buy spins */}
      {isConnected && remainingSpins <= 2 && (
        <button
          onClick={purchaseSpins}
          disabled={loading}
          className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:from-green-700 hover:to-teal-700 mb-4 disabled:opacity-50"
        >
          <ShoppingCart className="w-4 h-4" />
          {loading ? 'Processing…' : 'Buy 10 Spins – $0.10'}
        </button>
      )}

      {/* slot machine */}
      <div className="bg-gradient-to-b from-red-800 via-red-900 to-black rounded-xl p-4 mb-4 border-4 border-yellow-400 shadow-2xl">
        <div className="flex justify-center gap-2 mb-4">
          <Reel symbol={reels[0]} spinning={spin1} />
          <Reel symbol={reels[1]} spinning={spin2} />
          <Reel symbol={reels[2]} spinning={spin3} />
        </div>
        <button
          onClick={spinReels}
          disabled={
            !isConnected ||
            loading ||
            spinning ||
            remainingSpins <= 0 ||
            hasWonToday ||
            dailyWinners >= maxDailyWinners
          }
          className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 ${
            !isConnected ||
            loading ||
            spinning ||
            remainingSpins <= 0 ||
            hasWonToday ||
            dailyWinners >= maxDailyWinners
              ? 'bg-gray-600 text-gray-400'
              : 'bg-gradient-to-r from-red-600 to-red-800 text-white hover:from-red-700 hover:to-red-900 border-2 border-yellow-400'
          }`}
        >
          <Play className="w-5 h-5" />
          {loading
            ? 'PROCESSING…'
            : spinning
            ? 'SPINNING…'
            : !isConnected
            ? 'CONNECT WALLET'
            : remainingSpins <= 0
            ? 'BUY SPINS'
            : hasWonToday
            ? 'ALREADY WON'
            : dailyWinners >= maxDailyWinners
            ? 'DAILY LIMIT'
            : 'PULL THE LEVER!'}
        </button>
      </div>

      {/* win banner */}
      {hasWon && (
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-4 mb-4 text-center border-2 border-yellow-400 shadow-xl">
          <div className="text-3xl mb-1">🎰💰🎉</div>
          <p className="text-white font-bold">JACKPOT! 7️⃣7️⃣7️⃣</p>
          <p className="text-white/90 text-sm">You won $1 Base ETH</p>
        </div>
      )}

      {/* nav */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={() => setCurrentPage('leaderboard')}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-1"
        >
          <Trophy className="w-4 h-4" />
          Hall of Fame
        </button>
        <button
          onClick={() => setCurrentPage('history')}
          className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-1"
        >
          <History className="w-4 h-4" />
          My Stats
        </button>
      </div>
    </>
  );

  const Leaderboard = () => (
    <>
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setCurrentPage('game')}
          className="bg-white/10 p-2 rounded-lg hover:bg-white/20"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-xl font-bold text-white">🏆 Hall of Fame</h1>
      </div>

      <div className="bg-white/10 rounded-lg p-4 border border-purple-400">
        {leaderboard.length ? (
          leaderboard.map((w, i) => (
            <div key={i} className="bg-white/5 rounded-lg p-3 mb-2">
              <div className="flex justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="text-2xl">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🏅'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-mono text-white truncate">{w.address}</div>
                    <div className="text-blue-400 text-xs">FID: {w.fid}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-white/80">{w.timestamp}</div>
                  <div className="text-yellow-400 text-xs">{w.reward}</div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-white/80 py-6">No winners yet!</p>
        )}
      </div>
    </>
  );

  const History = () => (
    <>
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setCurrentPage('game')}
          className="bg-white/10 p-2 rounded-lg hover:bg-white/20"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-xl font-bold text-white">📊 My Stats</h1>
      </div>
      <p className="text-center text-white/60">Coming soon…</p>
    </>
  );

  /* ───────── main render ───────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
        {currentPage === 'game' && Game()}
        {currentPage === 'leaderboard' && Leaderboard()}
        {currentPage === 'history' && History()}
      </div>
    </div>
  );
}
