const hre = require("hardhat");

async function main() {
  console.log("Deploying...");
  
  const Token = await hre.ethers.getContractFactory("Cryptoscam_2_1");
  const token = await Token.deploy("Cryptoscam_2_1", "SCM");
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("Token address:", tokenAddress);

  const Timelock = await hre.ethers.getContractFactory("TimelockController");
  const minDelay = 10;
  const proposers = [];
  const executors = [];
  const admin = await hre.ethers.provider.getSigner().getAddress();
  
  const timelock = await Timelock.deploy(
    minDelay,
    proposers,
    executors,
    admin
  );
  await timelock.waitForDeployment();
  const timelockAddress = await timelock.getAddress();
  console.log("Timelock address:", timelockAddress);

  const Governor = await hre.ethers.getContractFactory("ScamGovernor");
  const governor = await Governor.deploy(
    tokenAddress,
    timelockAddress,
    "ScamGovernor"
  );
  await governor.waitForDeployment();
  const governorAddress = await governor.getAddress();
  console.log("Governor address:", governorAddress);

  const proposerRole = await timelock.PROPOSER_ROLE();
  const executorRole = await timelock.EXECUTOR_ROLE();

  await timelock.grantRole(proposerRole, governorAddress);
  await timelock.grantRole(executorRole, governorAddress);
  
//  const adminRole = await timelock.DEFAULT_ADMIN_ROLE();
//  await timelock.revokeRole(adminRole, await hre.ethers.provider.getSigner().getAddress());

  console.log("All done!");
  console.log("Token:", tokenAddress);
  console.log("Timelock:", timelockAddress);
  console.log("Governor:", governorAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});