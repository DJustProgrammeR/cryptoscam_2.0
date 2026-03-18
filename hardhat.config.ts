import { defineConfig } from "hardhat/config";
import hardhatVerify from "@nomicfoundation/hardhat-verify";

import * as dotenv from "dotenv";
dotenv.config();


export default defineConfig({
  plugins: [
    hardhatVerify,
  ],
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
      type: "http"
    }
  },
  verify: {
    etherscan: {
      apiKey: process.env.ETHERSCAN_API_KEY || ""
    }
  }
});