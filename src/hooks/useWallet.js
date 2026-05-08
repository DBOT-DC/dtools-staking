import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { CHAIN_ID, CHAIN_ID_HEX, NETWORK_NAME, RPC_URL } from '../config/constants.js';

export function useWallet() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const isCorrectChain = chainId === CHAIN_ID;

  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CHAIN_ID_HEX }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: CHAIN_ID_HEX,
              chainName: NETWORK_NAME,
              nativeCurrency: { name: 'DOGE', symbol: 'DOGE', decimals: 18 },
              rpcUrls: [RPC_URL],
              blockExplorerUrls: ['https://explorer.dogechain.dog/'],
            }],
          });
        } catch (addError) {
          setError('Failed to add Dogechain network');
        }
      } else {
        setError('Failed to switch to Dogechain');
      }
    }
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('MetaMask not detected. Please install MetaMask.');
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      if (accounts.length > 0 && mountedRef.current) {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const userSigner = await browserProvider.getSigner();
        const network = await browserProvider.getNetwork();
        setAccount(accounts[0]);
        setProvider(browserProvider);
        setSigner(userSigner);
        setChainId(Number(network.chainId));
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message || 'Failed to connect wallet');
      }
    } finally {
      if (mountedRef.current) setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    if (window.ethereum) {
      // Try to auto-connect if already authorized
      const tryAutoConnect = async () => {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0 && mountedRef.current) {
            const browserProvider = new ethers.BrowserProvider(window.ethereum);
            const userSigner = await browserProvider.getSigner();
            const network = await browserProvider.getNetwork();
            setAccount(accounts[0]);
            setProvider(browserProvider);
            setSigner(userSigner);
            setChainId(Number(network.chainId));
          }
        } catch {
          // Not connected, that's fine
        }
      };
      tryAutoConnect();

      const handleAccountsChanged = (accounts) => {
        if (!mountedRef.current) return;
        if (accounts.length === 0) {
          disconnect();
        } else {
          setAccount(accounts[0]);
          // Re-create signer
          const browserProvider = new ethers.BrowserProvider(window.ethereum);
          browserProvider.getSigner().then(s => {
            if (mountedRef.current) setSigner(s);
          });
        }
      };

      const handleChainChanged = (newChainId) => {
        if (!mountedRef.current) return;
        setChainId(parseInt(newChainId, 16));
        // Re-create provider and signer
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(browserProvider);
        browserProvider.getSigner().then(s => {
          if (mountedRef.current) setSigner(s);
        });
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        mountedRef.current = false;
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }

    return () => { mountedRef.current = false; };
  }, [disconnect]);

  return {
    account,
    provider,
    signer,
    chainId,
    isCorrectChain,
    isConnecting,
    error,
    connect,
    disconnect,
    switchNetwork,
    hasMetaMask: !!window.ethereum,
  };
}
