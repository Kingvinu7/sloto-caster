const { ethers } = require("hardhat");

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    console.error("❌ Please set CONTRACT_ADDRESS environment variable");
    console.error("Usage: CONTRACT_ADDRESS=0x... npm run status");
    process.exit(1);
  }

  const SlotoCaster = await ethers.getContractFactory("SlotoCaster");
  const slotoCaster = SlotoCaster.attach(contractAddress);

  console.log("📊 SlotoCaster Status Report");
  console.log("=" .repeat(40));
  
  const balance = await ethers.provider.getBalance(contractAddress);
  const dailyWinners = await slotoCaster.getDailyWinnersCount();
  const maxDailyWinners = await slotoCaster.MAX_DAILY_WINNERS();
  const rewardAmount = await slotoCaster.REWARD_AMOUNT();
  const totalWinners = await slotoCaster.getTotalWinners();

  console.log("🏠 Contract:", contractAddress);
  console.log("💰 Balance:", ethers.formatEther(balance), "ETH");
  console.log("🎯 Today's winners:", dailyWinners.toString() + "/" + maxDailyWinners.toString());
  console.log("🏆 Total winners:", totalWinners.toString());
  console.log("💵 Reward per win:", ethers.formatEther(rewardAmount), "ETH");
  
  const remainingRewards = balance / rewardAmount;
  console.log("🎁 Rewards remaining:", Math.floor(Number(remainingRewards)).toString());
  
  const hasEnough = await slotoCaster.hasEnoughBalance();
  console.log("✅ Sufficient balance:", hasEnough ? "Yes" : "No");
  
  if (totalWinners > 0) {
    console.log("\n🏆 Latest Winners:");
    const latestWinners = await slotoCaster.getLatestWinners(5);
    for (let i = 0; i < latestWinners.length; i++) {
      const winner = latestWinners[i];
      const date = new Date(Number(winner.timestamp) * 1000);
      console.log(`${i + 1}. FID ${winner.fid} - ${winner.wallet} - ${date.toLocaleString()}`);
    }
  }
}

main().catch(console.error);
