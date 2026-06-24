import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const VotingModule = buildModule("VotingModule", (m) => {
  const candidates = ["Alice", "Bob", "Charlie"];
  const durationInMinutes = 120; // Election runs for 2 hours

  // Deploy with both arguments
  const voting = m.contract("Voting", [candidates, durationInMinutes]);

  return { voting };
});

export default VotingModule;
