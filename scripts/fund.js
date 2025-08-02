const { ethers } = require("hardhat");

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    console.error("❌ Please set CONTRACT_ADDRESS environment variable");
    console.error("Usage: CONTRACT_ADDRESS=0x... npm run fund");
    process.exit(1);
  }

  const [owner] = await ethers.getSigners();
  const SlotoCaster = await ethers.getContractFactory("SlotoCaster");
  const slotoCaster = SlotoCaster.attach(contractAddress);

  const fundAmount = ethers.parseEther("0.005");
  console.log("💰 Funding contract with", ethers.formatEther(fundAmount), "ETH");

  const tx = await slotoCaster.fundContract({ value: fundAmount });
  await tx.wait();

  console.log("✅ Contract funded successfully!");
  
  const balance = await ethers.provider.getBalance(contractAddress);
  console.log("📊 New contract balance:", ethers.formatEther(balance), "ETH");
}

main().catch(console.error);
