import { useState, useCallback, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { DTOOLS_TOKEN_ADDRESS, STAKING_CONTRACT_ADDRESS } from '../config/contracts.js';
import { TOKEN_DECIMALS, POLL_INTERVAL } from '../config/constants.js';
import { getDefaultProvider, getTokenContract } from '../utils/web3.js';

export function useToken(account, signer) {
  const [balance, setBalance] = useState(null);
  const [allowance, setAllowance] = useState(null);
  const [symbol, setSymbol] = useState('DTOOLS');
  const [isLoading, setIsLoading] = useState(false);
  const [txStatus, setTxStatus] = useState(null); // { type, hash, message }
  const pollRef = useRef(null);

  const fetchBalance = useCallback(async (addr) => {
    try {
      const provider = getDefaultProvider();
      const contract = getTokenContract(provider);
      const bal = await contract.balanceOf(addr || account);
      setBalance(bal);
      return bal;
    } catch (err) {
      console.error('Error fetching balance:', err);
      return null;
    }
  }, [account]);

  const fetchAllowance = useCallback(async (addr) => {
    if (!addr && !account) return;
    try {
      const provider = getDefaultProvider();
      const contract = getTokenContract(provider);
      const allow = await contract.allowance(addr || account, STAKING_CONTRACT_ADDRESS);
      setAllowance(allow);
      return allow;
    } catch (err) {
      console.error('Error fetching allowance:', err);
      return null;
    }
  }, [account]);

  const fetchSymbol = useCallback(async () => {
    try {
      const provider = getDefaultProvider();
      const contract = getTokenContract(provider);
      const sym = await contract.symbol();
      setSymbol(sym);
    } catch {
      // Default to DTOOLS
    }
  }, []);

  const approve = useCallback(async (amount) => {
    if (!signer) return;
    setIsLoading(true);
    setTxStatus({ type: 'pending', message: 'Awaiting approval in wallet...' });
    try {
      const contract = getTokenContract(signer);
      const tx = await contract.approve(STAKING_CONTRACT_ADDRESS, amount);
      setTxStatus({ type: 'submitted', hash: tx.hash, message: 'Approval transaction submitted...' });
      await tx.wait();
      setTxStatus({ type: 'confirmed', hash: tx.hash, message: 'Approval confirmed!' });
      await fetchAllowance();
    } catch (err) {
      setTxStatus({ type: 'error', message: err.reason || err.message || 'Approval failed' });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [signer, fetchAllowance]);

  const approveMax = useCallback(async () => {
    return approve(ethers.MaxUint256);
  }, [approve]);

  const refresh = useCallback(async () => {
    const addr = account;
    if (addr) {
      await Promise.all([fetchBalance(addr), fetchAllowance(addr)]);
    }
  }, [account, fetchBalance, fetchAllowance]);

  // Initial fetch and polling
  useEffect(() => {
    fetchSymbol();
    if (account) {
      refresh();
      pollRef.current = setInterval(() => {
        refresh();
      }, POLL_INTERVAL);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [account, refresh, fetchSymbol]);

  const needsApproval = (amountWei) => {
    if (!allowance || !amountWei) return true;
    return allowance < amountWei;
  };

  return {
    balance,
    allowance,
    symbol,
    isLoading,
    txStatus,
    setTxStatus,
    fetchBalance,
    fetchAllowance,
    approve,
    approveMax,
    refresh,
    needsApproval,
  };
}
