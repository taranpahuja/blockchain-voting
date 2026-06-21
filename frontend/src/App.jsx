import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contractConfig";

function App() {
  const [account, setAccount] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  // 1. Listen for MetaMask account changes instantly
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setHasVoted(false); // Reset the voting status for the new account
        } else {
          setAccount(null);
        }
      });
    }
  }, []);

  // 2. Watch for account or contract changes to verify if the user already voted
  useEffect(() => {
    if (contract && account) {
      checkIfUserVoted(contract, account);
    }
  }, [contract, account]);

  const checkIfUserVoted = async (votingContract, userAddress) => {
    try {
      const voted = await votingContract.voters(userAddress);
      setHasVoted(voted);
    } catch (error) {
      console.error("Error checking vote status:", error);
    }
  };

  const connectWallet = async () => {
    if (window.ethereum == null) {
      alert("MetaMask not installed; using read-only defaults");
      return;
    }
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(accounts[0]);

      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(browserProvider);

      const signer = await browserProvider.getSigner();
      const votingContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );
      setContract(votingContract);

      fetchCandidates(votingContract);
      checkIfUserVoted(votingContract, accounts[0]);
    } catch (error) {
      console.error("Connection error:", error);
    }
  };

  const fetchCandidates = async (votingContract) => {
    try {
      const candidateList = [];
      for (let i = 1; i <= 3; i++) {
        const candidate = await votingContract.getCandidate(i);
        candidateList.push({
          id: candidate.id.toString(),
          name: candidate.name,
          voteCount: candidate.voteCount.toString(),
        });
      }
      setCandidates(candidateList);
    } catch (error) {
      console.error("Error fetching candidates:", error);
    }
  };

  const castVote = async (candidateId) => {
    if (!contract) return;
    setLoading(true);
    try {
      const tx = await contract.vote(candidateId);
      await tx.wait();
      alert("Vote successfully cast!");

      fetchCandidates(contract);
      setHasVoted(true); // Instantly update the UI to block further voting
    } catch (error) {
      console.error("Voting failed:", error);
      alert("Voting failed! Have you already voted?");
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        padding: "40px",
        color: "#e2e8f0",
        backgroundColor: "#0f172a",
        minHeight: "100vh",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
          Web3 Voting System
        </h1>

        {!account ? (
          <button
            onClick={connectWallet}
            style={{
              padding: "12px 24px",
              fontSize: "16px",
              cursor: "pointer",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
            }}
          >
            Connect MetaMask
          </button>
        ) : (
          <p
            style={{
              background: "#1e293b",
              padding: "12px 20px",
              borderRadius: "8px",
              display: "inline-block",
              border: "1px solid #334155",
            }}
          >
            Connected Wallet:{" "}
            <strong style={{ color: "#38bdf8" }}>
              {account.slice(0, 6)}...{account.slice(-4)}
            </strong>
          </p>
        )}

        {hasVoted && (
          <div
            style={{
              marginTop: "20px",
              padding: "15px",
              backgroundColor: "#064e3b",
              color: "#34d399",
              borderRadius: "8px",
              border: "1px solid #047857",
            }}
          >
            ✅ You have securely cast your ballot in this election.
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "20px",
            justifyContent: "center",
            marginTop: "40px",
          }}
        >
          {candidates.length === 0 ? (
            <p>Waiting for contract connection...</p>
          ) : (
            candidates.map((candidate) => (
              <div
                key={candidate.id}
                style={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "12px",
                  padding: "30px",
                  flex: "1",
                  minWidth: "200px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              >
                <h2 style={{ margin: "0 0 10px 0", fontSize: "1.5rem" }}>
                  {candidate.name}
                </h2>
                <p
                  style={{
                    fontSize: "2rem",
                    fontWeight: "bold",
                    margin: "10px 0 20px 0",
                    color: "#f8fafc",
                  }}
                >
                  {candidate.voteCount}{" "}
                  <span
                    style={{
                      fontSize: "1rem",
                      fontWeight: "normal",
                      color: "#94a3b8",
                    }}
                  >
                    votes
                  </span>
                </p>

                <button
                  onClick={() => castVote(candidate.id)}
                  disabled={loading || !account || hasVoted}
                  style={{
                    padding: "12px",
                    width: "100%",
                    fontSize: "1rem",
                    fontWeight: "bold",
                    cursor:
                      loading || !account || hasVoted
                        ? "not-allowed"
                        : "pointer",
                    backgroundColor:
                      loading || !account || hasVoted ? "#475569" : "#3b82f6",
                    color:
                      loading || !account || hasVoted ? "#94a3b8" : "white",
                    border: "none",
                    borderRadius: "6px",
                    transition: "all 0.2s",
                  }}
                >
                  {loading
                    ? "Processing..."
                    : hasVoted
                    ? "Locked"
                    : `Vote for ${candidate.name}`}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
