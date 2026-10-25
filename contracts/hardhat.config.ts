import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Sepolia JSON-RPC endpoint used for deployment and verification runs.
 */
const sepoliaRpcUrl =
  process.env.SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com";

/**
 * Hardhat configuration for the Vane protocol contracts.
 */
const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      // UltraHonk Solidity verifiers rely on EIP-1153 transient storage opcodes.
      evmVersion: "cancun",
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    sepolia: {
      url: sepoliaRpcUrl,
      chainId: 11155111,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  etherscan: {
    // Single Etherscan V2 key. Hardhat-verify deprecated network-scoped V1 keys.
    apiKey: process.env.ETHERSCAN_API_KEY ?? "",
  },
  mocha: {
    timeout: 240000,
  },
};

export default config;
