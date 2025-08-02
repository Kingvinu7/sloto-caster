const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("🚀 Deploying SlotoCaster contract...");
  console.log("📍 Network:", hre.network.name);
  console.log("👤 Deployer address:", deployer.address);
  console.log("💰 Deployer balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");
  
  console.log("\n📦 Deploying contract...");
  const SlotoCaster = await ethers.getContractFactory("SlotoCaster");
  const slotoCaster = await SlotoCaster.deploy();
  
  await slotoCaster.waitForDeployment();
  const contractAddress = await slotoCaster.getAddress();
  
  console.log("✅ SlotoCaster deployed to:", contractAddress);
  
  const fundAmount = ethers.parseEther("0.01");
  console.log("\n💵 Funding contract with initial rewards...");
  console.log("💰 Funding amount:", ethers.formatEther(fundAmount), "ETH");
  
  const fundTx = await slotoCaster.fundContract({ value: fundAmount });
  await fundTx.wait();
  
  console.log("✅ Contract funded successfully!");
  
  const contractBalance = await ethers.provider.getBalance(contractAddress);
  console.log("📊 Contract balance:", ethers.formatEther(contractBalance), "ETH");
  
  const rewardAmount = await slotoCaster.REWARD_AMOUNT();
  const maxRewards = contractBalance / rewardAmount;
  console.log("🎁 Can pay", maxRewards.toString(), "rewards");
  
  const maxDailyWinners = await slotoCaster.MAX_DAILY_WINNERS();
  const spinPackCost = await slotoCaster.SPIN_PACK_COST();
  const spinsPerPack = await slotoCaster.SPINS_PER_PACK();
  
  console.log("\n📋 Contract Configuration:");
  console.log("🎯 Max daily winners:", maxDailyWinners.toString());
  console.log("💰 Reward amount:", ethers.formatEther(rewardAmount), "ETH");
  console.log("🎟️ Spin pack cost:", ethers.formatEther(spinPackCost), "ETH");
  console.log("🔄 Spins per pack:", spinsPerPack.toString());
  
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    initialFunding: ethers.formatEther(fundAmount),
    configuration: {
      maxDailyWinners: maxDailyWinners.toString(),
      rewardAmount: ethers.formatEther(rewardAmount),
      spinPackCost: ethers.formatEther(spinPackCost),
      spinsPerPack: spinsPerPack.toString()
    }
  };
  
  console.log("\n💾 Deployment completed!");
  console.log("📄 Save this info for frontend integration:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  if (hre.network.name !== "hardhat") {
    console.log("\n🔍 Verify contract with:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${contractAddress}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
