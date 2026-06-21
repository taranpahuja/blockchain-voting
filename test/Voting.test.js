import { expect } from "chai";
import hre from "hardhat";

describe("Voting Smart Contract", function () {
  let Voting;
  let votingContract;
  let admin;
  let voter1;
  let voter2;
  let ethers;

  beforeEach(async function () {
    // 1. In Hardhat 3, we explicitly create the network connection first
    ({ ethers } = await hre.network.create());

    // 2. Get fake local accounts
    [admin, voter1, voter2] = await ethers.getSigners();

    // 3. Deploy the contract
    Voting = await ethers.getContractFactory("Voting");
    votingContract = await Voting.deploy(["Alice", "Bob"]);
    await votingContract.waitForDeployment();
  });

  it("Should initialize candidates correctly", async function () {
    const candidate1 = await votingContract.getCandidate(1);
    expect(candidate1.name).to.equal("Alice");

    // Ethers v6 (used in HH3) uses BigInts (0n) instead of normal numbers for large integers
    expect(candidate1.voteCount).to.equal(0n);
  });

  it("Should allow a user to cast a vote", async function () {
    await votingContract.connect(voter1).vote(1);
    const candidate1 = await votingContract.getCandidate(1);
    expect(candidate1.voteCount).to.equal(1n);

    const hasVoted = await votingContract.voters(voter1.address);
    expect(hasVoted).to.be.true;
  });

  it("Should reject a transaction if a user tries to vote twice", async function () {
    await votingContract.connect(voter1).vote(1);
    await expect(votingContract.connect(voter1).vote(2)).to.be.revertedWith(
      "Error: You have already cast your vote."
    );
  });
});
