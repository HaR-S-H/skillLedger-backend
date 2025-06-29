import hardhat from "hardhat";
const { ethers } = hardhat;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  const Credentials = await ethers.getContractFactory("Credentials");
  const credentials = await Credentials.deploy();
  await credentials.waitForDeployment();

  console.log("Credentials contract deployed to:", await credentials.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
