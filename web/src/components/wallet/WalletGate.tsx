"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Value exposed by the wallet gate provider.
 */
interface WalletGateValue {
  /** Opens the wallet connection modal. */
  openWallet: () => void;
  /** True when a wallet session is active. */
  isConnected: boolean;
  /** Connected wallet address when available. */
  address: `0x${string}` | undefined;
}

const WalletGateContext = createContext<WalletGateValue>({
  openWallet: () => undefined,
  isConnected: false,
  address: undefined,
});

/**
 * Provides wallet gate actions to landing page sections.
 *
 * @param props Provider values and children.
 * @returns The context provider.
 */
export function WalletGateProvider({
  openWallet,
  isConnected,
  address,
  children,
}: WalletGateValue & { children: ReactNode }) {
  return (
    <WalletGateContext.Provider value={{ openWallet, isConnected, address }}>
      {children}
    </WalletGateContext.Provider>
  );
}

/**
 * Reads the wallet gate context.
 *
 * @returns The current wallet gate value.
 */
export function useWalletGate(): WalletGateValue {
  return useContext(WalletGateContext);
}
