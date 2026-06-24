import { defineConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// This ensures your .env variables are loaded properly from the root folder
dotenv.config({ path: resolve(__dirname, ".env") });

const HOLESKY_RPC_URL = process.env.HOLESKY_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers],
  solidity: "0.8.20",
  networks: {
    localhost: {
      type: "http",
      url: "http://127.0.0.1:8545",
    },
    holesky: {
      type: "http",
      url: HOLESKY_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
});
