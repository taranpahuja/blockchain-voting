// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Voting {
    // A structure representing a single candidate
    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    // A mapping acts like a dictionary or hash map.
    // It maps an Ethereum address (voter) to a boolean (true/false) to track if they voted.
    mapping(address => bool) public voters;

    // An array to store all the candidates running in this election
    Candidate[] public candidates;

    // A counter to assign unique IDs to candidates
    uint256 public candidatesCount;

    // The owner/administrator of the election (the person who deploys the contract)
    address public admin;

    // Events allow external applications (like our frontend) to listen for actions on the blockchain
    event Voted(uint256 indexed candidateId, address indexed voter);

    // The constructor runs exactly ONCE when the contract is deployed
    constructor(string[] memory _candidateNames) {
        admin = msg.sender; // The person deploying the contract becomes the admin

        // Loop through the provided names array and add them as candidates
        for (uint256 i = 0; i < _candidateNames.length; i++) {
            addCandidate(_candidateNames[i]);
        }
    }

    // An internal helper function to register a candidate
    function addCandidate(string memory _name) internal {
        candidatesCount++;
        candidates.push(Candidate(candidatesCount, _name, 0));
    }

    // The primary function for casting a vote
    function vote(uint256 _candidateId) public {
        // 1. REQUIRE that the voter has not voted before
        require(!voters[msg.sender], "Error: You have already cast your vote.");

        // 2. REQUIRE that the candidate ID is valid
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Error: Invalid candidate selected.");

        // 3. Record that the voter has now voted
        voters[msg.sender] = true;

        // 4. Update the candidate's vote count
        // Arrays are 0-indexed, so Candidate ID 1 is at index 0
        candidates[_candidateId - 1].voteCount++;

        // 5. Trigger the event notification
        emit Voted(_candidateId, msg.sender);
    }

    // A helper function to fetch a specific candidate's details
    function getCandidate(uint256 _candidateId) public view returns (Candidate memory) {
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate ID.");
        return candidates[_candidateId - 1];
    }
}
