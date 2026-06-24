// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Voting {
    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    address public owner;
    uint256 public votingStart;
    uint256 public votingEnd;

    mapping(uint256 => Candidate) public candidates;
    mapping(address => bool) public voters;
    uint256 public candidatesCount;

    // Events allow our React frontend to update in real-time
    event VoteCast(address indexed voter, uint256 candidateId);
    event CandidateAdded(uint256 candidateId, string name);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    modifier votingActive() {
        require(
            block.timestamp >= votingStart && block.timestamp <= votingEnd,
            "Voting is not currently active"
        );
        _;
    }

    // Constructor now takes candidates AND how long the election lasts (in minutes)
    constructor(string[] memory _candidateNames, uint256 _durationInMinutes) {
        owner = msg.sender;
        votingStart = block.timestamp;
        votingEnd = block.timestamp + (_durationInMinutes * 1 minutes);

        for (uint256 i = 0; i < _candidateNames.length; i++) {
            addCandidate(_candidateNames[i]);
        }
    }

    function addCandidate(string memory _name) public onlyOwner {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
        emit CandidateAdded(candidatesCount, _name);
    }

    function vote(uint256 _candidateId) public votingActive {
        require(!voters[msg.sender], "You have already voted.");
        require(
            _candidateId > 0 && _candidateId <= candidatesCount,
            "Invalid candidate ID."
        );

        voters[msg.sender] = true;
        candidates[_candidateId].voteCount++;

        // Broadcast the vote to the network
        emit VoteCast(msg.sender, _candidateId);
    }

    function getCandidate(
        uint256 _candidateId
    ) public view returns (Candidate memory) {
        return candidates[_candidateId];
    }

    function getVotingStatus() public view returns (bool) {
        return (block.timestamp >= votingStart && block.timestamp <= votingEnd);
    }
}
