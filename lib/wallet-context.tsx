"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { KITE_TESTNET, shortenAddress } from "./kite-config";

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
  switchToKiteTestnet: () => Promise<void>;
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
  switchToKiteTestnet: async () => { },
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
  const isCorrectChain = chainId === KITE_TESTNET.chainId;
  const shortAddress = address ? shortenAddress(address) : "";

  const fetchBalance = useCallback(async (addr: string) => {
    if (!window.ethereum) return;
    try {
      const rawBalance = (await window.ethereum.request({
        method: "eth_getBalance",
        params: [addr, "latest"],
      })) as string;
      const balanceInEth = parseInt(rawBalance, 16) / 1e18;
      setBalance(balanceInEth.toFixed(4));
    } catch {
      setBalance("0");
    }
  }, []);

  const switchToKiteTestnet = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: KITE_TESTNET.chainIdHex }],
      });
    } catch (switchError: unknown) {
      const err = switchError as { code?: number };
      if (err.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: KITE_TESTNET.chainIdHex,
              chainName: KITE_TESTNET.chainName,
              rpcUrls: [KITE_TESTNET.rpcUrl],
              blockExplorerUrls: [KITE_TESTNET.blockExplorerUrl],
              nativeCurrency: KITE_TESTNET.nativeCurrency,
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
        switchToKiteTestnet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
