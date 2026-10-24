import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { SEPOLIA_RPC_URL } from "./contracts";

/**
 * Shared read only Sepolia client used by browser hooks and server routes.
 */
export const sepoliaPublicClient = createPublicClient({
  chain: sepolia,
  transport: http(SEPOLIA_RPC_URL),
});
