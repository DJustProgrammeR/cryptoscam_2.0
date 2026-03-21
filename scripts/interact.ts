import { network } from "hardhat";
const { ethers } = await network.connect();

async function main() {
const [user] = await ethers.getSigners();

  const governor = await ethers.getContractAt(
    "ScamGovernor",
    "0xCaB5aF8713c3dF02c6a3cfb285B483EfB774F475"
  );

const token = await ethers.getContractAt(
    "Cryptoscam_2_1",
    "0x052EA31b8cFC29baC68A797e9596725d266Ec6a1"
  );

  console.log("Delegating...");
  await (await token.delegate(user.address)).wait();

  const description = "Test proposal";

  const targets = [user.address];
  const values = [0];
  const calldatas = ["0x"];

  console.log("Creating proposal...");
  const tx = await governor.propose(
    targets,
    values,
    calldatas,
    description
  );

  const receipt = await tx.wait();

  const proposalId = receipt.logs[0].args.proposalId;
  console.log("Proposal ID:", proposalId.toString());

  console.log("Waiting for voting delay...");
  await new Promise(r => setTimeout(r, 11000));

  console.log("Voting...");
  await (await governor.castVote(proposalId, 1)).wait();

  console.log("Waiting voting period...");
  await new Promise(r => setTimeout(r, 310000));

  const descriptionHash = ethers.id(description);

  console.log("Queue...");
  await (
    await governor.queue(
      targets,
      values,
      calldatas,
      descriptionHash
    )
  ).wait();

  console.log("Waiting timelock...");
  await new Promise(r => setTimeout(r, 11000));

  console.log("Execute...");
  await (
    await governor.execute(
      targets,
      values,
      calldatas,
      descriptionHash
    )
  ).wait();

  console.log("DONE");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});