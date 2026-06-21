import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// Define the initial candidates for our election
const CANDIDATES = ["Alice", "Bob", "Charlie"];

const VotingModule = buildModule("VotingModule", (m) => {
  // Deploy the 'Voting' contract and pass the candidates array to the constructor
  const voting = m.contract("Voting", [CANDIDATES]);

  return { voting };
});

export default VotingModule;
