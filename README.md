# 🎰 Sloto-caster

A Farcaster-based slot machine game on Base network where players can win $1 to $5 worth of Base ETH!

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MetaMask wallet
- Base Sepolia testnet ETH

### Setup
```bash
npm install
cp .env.example .env
# Edit .env with your private key and API keysDeploynpm run compile
npm run deploy:sepoliaCheck StatusCONTRACT_ADDRESS=<your_address> npm run status📊 Game EconomicsSpin Cost: $0.10 (10 spins)Reward: $1.00 per winWin Rate: 5%Daily Limit: 5 winners🔧 Contract FunctionspurchaseSpins(fid) - Buy 10 spinsplaySlotMachine(fid) - Play one spingetRemainingSpins(fid) - Check spins leftgetPlayerInfo(fid) - Get player status📞 SupportBuilt for Farcaster community with ❤️ 
