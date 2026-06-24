import { useState, useEffect } from "react";
import { ethers } from "ethers";
import toast, { Toaster } from "react-hot-toast";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contractConfig";

// Beautiful colors for our pie chart slices
const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];

function App() {
  const [account, setAccount] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votingActive, setVotingActive] = useState(true);

  const [contractOwner, setContractOwner] = useState(null);
  const [newCandidateName, setNewCandidateName] = useState("");
  const [isAddingCandidate, setIsAddingCandidate] = useState(false);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          if (contract) checkIfUserVoted(contract, accounts[0]);
        } else {
          setAccount(null);
        }
      });
      window.ethereum.on("chainChanged", () => window.location.reload());
    }
  }, [contract]);

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
      toast.error("MetaMask not installed!");
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

      await fetchContractData(votingContract);
      setupEventListeners(votingContract);

      toast.success("Wallet connected!");
    } catch (error) {
      console.error("Connection error:", error);
      toast.error("Failed to connect wallet.");
    }
  };

  const fetchContractData = async (votingContract) => {
    try {
      const isActive = await votingContract.getVotingStatus();
      setVotingActive(isActive);

      const ownerAddress = await votingContract.owner();
      setContractOwner(ownerAddress);

      const count = await votingContract.candidatesCount();
      const candidateList = [];
      for (let i = 1; i <= Number(count); i++) {
        const candidate = await votingContract.getCandidate(i);
        candidateList.push({
          id: candidate.id.toString(),
          name: candidate.name,
          voteCount: Number(candidate.voteCount), // Convert to Number for the chart
        });
      }
      setCandidates(candidateList);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const setupEventListeners = (votingContract) => {
    votingContract.on("VoteCast", () => fetchContractData(votingContract));
    votingContract.on("CandidateAdded", () =>
      fetchContractData(votingContract)
    );
  };

  const castVote = async (candidateId) => {
    if (!contract) return;
    setLoadingId(candidateId);
    const loadingToast = toast.loading("Confirming transaction...");

    try {
      const tx = await contract.vote(candidateId);
      toast.loading(`Mining block...`, { id: loadingToast });
      await tx.wait();
      toast.success("Vote successfully cast!", { id: loadingToast });
      setHasVoted(true);
    } catch (error) {
      toast.error("Voting failed.", { id: loadingToast });
    }
    setLoadingId(null);
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    if (!newCandidateName.trim()) return toast.error("Please enter a name.");

    setIsAddingCandidate(true);
    const loadingToast = toast.loading("Adding candidate...");

    try {
      const tx = await contract.addCandidate(newCandidateName);
      await tx.wait();
      toast.success(`${newCandidateName} added!`, { id: loadingToast });
      setNewCandidateName("");
    } catch (error) {
      toast.error("Failed to add candidate.", { id: loadingToast });
    }
    setIsAddingCandidate(false);
  };

  const isAdmin =
    account &&
    contractOwner &&
    account.toLowerCase() === contractOwner.toLowerCase();

  // Prepare data for Recharts (filter out candidates with 0 votes to keep chart clean)
  const chartData = candidates
    .filter((c) => c.voteCount > 0)
    .map((c) => ({ name: c.name, value: c.voteCount }));

  const totalVotes = candidates.reduce((acc, curr) => acc + curr.voteCount, 0);

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
      <Toaster
        position="top-right"
        toastOptions={{ style: { background: "#1e293b", color: "#fff" } }}
      />

      <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
          Secure Web3 Voting
        </h1>

        <div style={{ marginBottom: "2rem" }}>
          {!votingActive && (
            <span
              style={{
                background: "#ef4444",
                padding: "6px 14px",
                borderRadius: "12px",
                fontSize: "0.875rem",
                fontWeight: "bold",
              }}
            >
              🔴 Election Closed
            </span>
          )}
          {votingActive && contract && (
            <span
              style={{
                background: "#10b981",
                padding: "6px 14px",
                borderRadius: "12px",
                fontSize: "0.875rem",
                fontWeight: "bold",
              }}
            >
              🟢 Election Live
            </span>
          )}
        </div>

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

        {isAdmin && (
          <div
            style={{
              marginTop: "30px",
              padding: "20px",
              backgroundColor: "#1e293b",
              border: "1px solid #c084fc",
              borderRadius: "12px",
              textAlign: "left",
            }}
          >
            <h3 style={{ margin: "0 0 15px 0", color: "#c084fc" }}>
              👑 Admin Dashboard
            </h3>
            <form
              onSubmit={handleAddCandidate}
              style={{ display: "flex", gap: "10px" }}
            >
              <input
                type="text"
                placeholder="New Candidate Name..."
                value={newCandidateName}
                onChange={(e) => setNewCandidateName(e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #475569",
                  backgroundColor: "#0f172a",
                  color: "white",
                }}
              />
              <button
                type="submit"
                disabled={isAddingCandidate}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#9333ea",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: isAddingCandidate ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                }}
              >
                {isAddingCandidate ? "Adding..." : "+ Add Candidate"}
              </button>
            </form>
          </div>
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

        {/* --- THE VOTING CARDS --- */}
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
            <p style={{ color: "#94a3b8" }}>
              {contract
                ? "Loading candidates..."
                : "Waiting for contract connection..."}
            </p>
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
                  disabled={
                    loadingId !== null || !account || hasVoted || !votingActive
                  }
                  style={{
                    padding: "12px",
                    width: "100%",
                    fontSize: "1rem",
                    fontWeight: "bold",
                    cursor:
                      loadingId !== null ||
                      !account ||
                      hasVoted ||
                      !votingActive
                        ? "not-allowed"
                        : "pointer",
                    backgroundColor:
                      loadingId !== null ||
                      !account ||
                      hasVoted ||
                      !votingActive
                        ? "#475569"
                        : "#3b82f6",
                    color:
                      loadingId !== null ||
                      !account ||
                      hasVoted ||
                      !votingActive
                        ? "#94a3b8"
                        : "white",
                    border: "none",
                    borderRadius: "6px",
                    transition: "all 0.2s",
                  }}
                >
                  {loadingId === candidate.id
                    ? "Processing..."
                    : hasVoted
                    ? "Locked"
                    : !votingActive
                    ? "Closed"
                    : `Vote for ${candidate.name}`}
                </button>
              </div>
            ))
          )}
        </div>

        {/* --- NEW: LIVE ANALYTICS DASHBOARD --- */}
        {contract && candidates.length > 0 && (
          <div
            style={{
              marginTop: "50px",
              padding: "30px",
              backgroundColor: "#1e293b",
              borderRadius: "12px",
              border: "1px solid #334155",
            }}
          >
            <h2 style={{ margin: "0 0 5px 0" }}>Live Election Results</h2>
            <p style={{ color: "#94a3b8", marginBottom: "20px" }}>
              Total Votes Cast: <strong>{totalVotes}</strong>
            </p>

            {totalVotes === 0 ? (
              <p style={{ color: "#64748b", padding: "40px" }}>
                No votes have been cast yet. Be the first!
              </p>
            ) : (
              <div style={{ width: "100%", height: "350px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                      }}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
