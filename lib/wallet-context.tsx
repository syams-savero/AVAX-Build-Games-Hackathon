"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { ACTIVE_NETWORK, shortenAddress } from "./kite-config";

interface WalletContextType {
  address: string | null;
  shortAddress: string;
  balance: string;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  isCorrectChain: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToActiveNetwork: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  shortAddress: "",
  balance: "0",
  chainId: null,
  isConnected: false,
  isConnecting: false,
  isCorrectChain: false,
  connect: async () => { },
  disconnect: () => { },
  switchToActiveNetwork: async () => { },
});

export function useWallet() {
  return useContext(WalletContext);
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState("0");
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const isConnected = !!address;
  const isCorrectChain = chainId === ACTIVE_NETWORK.chainId;
  const shortAddress = address ? shortenAddress(address) : "";

  const fetchBalance = useCallback(async (addr: string) => {
    if (!window.ethereum) return;
    try {
      const rawBalance = (await window.ethereum.request({
        method: "eth_getBalance",
        params: [addr, "latest"],
      })) as string;

      // Use BigInt for better precision
      const balanceBigInt = BigInt(rawBalance);
      const balanceInEth = Number(balanceBigInt) / 1e18;

      // If balance is very small but not zero, show more decimals
      const formattedBalance = balanceInEth === 0 ? "0" :
        balanceInEth < 0.0001 ? balanceInEth.toFixed(6) :
          balanceInEth.toFixed(4);

      setBalance(formattedBalance);
      console.log("Fetched balance for", addr, ":", formattedBalance);
    } catch (err) {
      console.error("Error fetching balance:", err);
      setBalance("0");
    }
  }, []);

  const switchToActiveNetwork = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ACTIVE_NETWORK.chainIdHex }],
      });
    } catch (switchError: unknown) {
      const err = switchError as { code?: number };
      if (err.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: ACTIVE_NETWORK.chainIdHex,
              chainName: ACTIVE_NETWORK.chainName,
              rpcUrls: [ACTIVE_NETWORK.rpcUrl],
              blockExplorerUrls: [ACTIVE_NETWORK.blockExplorerUrl],
              nativeCurrency: ACTIVE_NETWORK.nativeCurrency,
            },
          ],
        });
      }
    }
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      window.open("https://metamask.io/download/", "_blank");
      return;
    }
    setIsConnecting(true);
    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        await fetchBalance(accounts[0]);
      }
      const chainIdHex = (await window.ethereum.request({
        method: "eth_chainId",
      })) as string;
      setChainId(parseInt(chainIdHex, 16));
    } catch {
      // user rejected
    } finally {
      setIsConnecting(false);
    }
  }, [fetchBalance]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setBalance("0");
    setChainId(null);
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAddress(accounts[0]);
        fetchBalance(accounts[0]);
      }
    };

    const handleChainChanged = (...args: unknown[]) => {
      const newChainId = args[0] as string;
      setChainId(parseInt(newChainId, 16));
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    // Check if already connected
    window.ethereum
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        const accs = accounts as string[];
        if (accs.length > 0) {
          setAddress(accs[0]);
          fetchBalance(accs[0]);
        }
      })
      .catch(() => { });

    window.ethereum
      .request({ method: "eth_chainId" })
      .then((id) => {
        setChainId(parseInt(id as string, 16));
      })
      .catch(() => { });

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [disconnect, fetchBalance]);

  return (
    <WalletContext.Provider
      value={{
        address,
        shortAddress,
        balance,
        chainId,
        isConnected,
        isConnecting,
        isCorrectChain,
        connect,
        disconnect,
        switchToActiveNetwork,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
