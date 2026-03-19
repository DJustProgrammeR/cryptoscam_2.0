import { network } from "hardhat";
const { ethers } = await network.connect();

async function main() {
  console.log("Deploying...");

  if (!ethers) {
    throw new Error("ethers is NOT loaded. Plugin missing.");
  }

  const [deployer] = await ethers.getSigners();

  console.log("Deployer:", deployer.address);

  const Token = await ethers.getContractFactory("Cryptoscam_2_1");
  const token = await Token.deploy("Cryptoscam_2_1", "SCM");
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("Token:", tokenAddress);

const Timelock = await ethers.getContractFactory(
  "TimelockController"
);
  const minDelay = 10;
  const proposers: string[] = [];
  const executors: string[] = [];

  const timelock = await Timelock.deploy(
    minDelay,
    proposers,
    executors,
    deployer.address
  );

  await timelock.waitForDeployment();
  const timelockAddress = await timelock.getAddress();
  console.log("Timelock:", timelockAddress);

  const Governor = await ethers.getContractFactory("ScamGovernor");

  const governor = await Governor.deploy(
    tokenAddress,
    timelockAddress,
    "ScamGovernor"
  );

  await governor.waitForDeployment();
  const governorAddress = await governor.getAddress();
  console.log("Governor:", governorAddress);

  const proposerRole = await timelock.PROPOSER_ROLE();
  const executorRole = await timelock.EXECUTOR_ROLE();

  await timelock.grantRole(proposerRole, governorAddress);
  await timelock.grantRole(executorRole, governorAddress);

  //  const adminRole = await timelock.DEFAULT_ADMIN_ROLE();
  //  await timelock.revokeRole(adminRole, await hre.ethers.provider.getSigner().getAddress());


  console.log("Done!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});