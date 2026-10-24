import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";
import { SEPOLIA_RPC_URL } from "./contracts";

/**
 * WalletConnect project identifier supplied through the public environment.
 */
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";

/**
 * Connectors offered inside the wallet connection modal.
 *
 * WalletConnect is only registered when a project identifier is configured so the modal never
 * offers a connector that cannot complete a handshake.
 */
const connectors = walletConnectProjectId
  ? [injected(), walletConnect({ projectId: walletConnectProjectId, showQrModal: true })]
  : [injected()];

/**
 * Wagmi configuration for the Vane console.
 *
 * Storage uses cookies only. The application never writes to local storage or session storage.
 */
export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors,
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  transports: {
    [sepolia.id]: http(SEPOLIA_RPC_URL),
  },
});

/**
 * Wagmi configuration used by server components so they can read the connected account.
 */
export const ssrConfig = wagmiConfig;
