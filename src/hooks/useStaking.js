import { useState, useCallback, useEffect, useRef } from 'react';
import { POLL_INTERVAL } from '../config/constants.js';
import { getDefaultProvider, getStakingContract } from '../utils/web3.js';

export function useStaking(account, signer) {
  const [userInfo, setUserInfo] = useState({ amount: null, rewardDebt: null });
  const [pendingReward, setPendingReward] = useState(null);
  const [totalStaked, setTotalStaked] = useState(null);
  const [apy, setApy] = useState(null);
  const [rewardsRemaining, setRewardsRemaining] = useState(null);
  const [exitPenalty, setExitPenalty] = useState(null);
  const [lockDuration, setLockDuration] = useState(null);
  const [holderUnlockTime, setHolderUnlockTime] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [txStatus, setTxStatus] = useState(null);
  const pollRef = useRef(null);

  const fetchUserInfo = useCallback(async (addr) => {
    if (!addr && !account) return;
    try {
      const provider = getDefaultProvider();
      const contract = getStakingContract(provider);
      const info = await contract.userInfo(addr || account);
      setUserInfo({
        amount: info.amount,
        rewardDebt: info.rewardDebt,
      });
      return info;
    } catch (err) {
      console.error('Error fetching user info:', err);
      return null;
    }
  }, [account]);

  const fetchPendingReward = useCallback(async (addr) => {
    if (!addr && !account) return;
    try {
      const provider = getDefaultProvider();
      const contract = getStakingContract(provider);
      const reward = await contract.pendingReward(addr || account);
      setPendingReward(reward);
      return reward;
    } catch (err) {
      console.error('Error fetching pending reward:', err);
      return null;
    }
  }, [account]);

  const fetchHolderUnlockTime = useCallback(async (addr) => {
    if (!addr && !account) return;
    try {
      const provider = getDefaultProvider();
      const contract = getStakingContract(provider);
      const unlockTime = await contract.holderUnlockTime(addr || account);
      setHolderUnlockTime(unlockTime);
      return unlockTime;
    } catch (err) {
      console.error('Error fetching holder unlock time:', err);
      return null;
    }
  }, [account]);

  const fetchContractData = useCallback(async () => {
    try {
      const provider = getDefaultProvider();
      const contract = getStakingContract(provider);
      const [ts, apyVal, rr, ep, ld] = await Promise.all([
        contract.totalStaked(),
        contract.apy(),
        contract.rewardsRemaining(),
        contract.exitPenaltyPerc(),
        contract.lockDuration(),
      ]);
      setTotalStaked(ts);
      setApy(apyVal);
      setRewardsRemaining(rr);
      setExitPenalty(ep);
      setLockDuration(ld);
    } catch (err) {
      console.error('Error fetching contract data:', err);
    }
  }, []);

  const stake = useCallback(async (amount) => {
    if (!signer) return;
    setIsLoading(true);
    setTxStatus({ type: 'pending', message: 'Awaiting stake confirmation in wallet...' });
    try {
      const contract = getStakingContract(signer);
      const tx = await contract.deposit(amount);
      setTxStatus({ type: 'submitted', hash: tx.hash, message: 'Stake transaction submitted...' });
      await tx.wait();
      setTxStatus({ type: 'confirmed', hash: tx.hash, message: 'Stake confirmed!' });
      // Refresh data
      await Promise.all([fetchUserInfo(), fetchPendingReward(), fetchHolderUnlockTime(), fetchContractData()]);
    } catch (err) {
      setTxStatus({ type: 'error', message: err.reason || err.message || 'Stake failed' });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [signer, fetchUserInfo, fetchPendingReward, fetchHolderUnlockTime, fetchContractData]);

  const withdraw = useCallback(async () => {
    if (!signer) return;
    setIsLoading(true);
    setTxStatus({ type: 'pending', message: 'Awaiting withdraw confirmation in wallet...' });
    try {
      const contract = getStakingContract(signer);
      const tx = await contract.withdraw();
      setTxStatus({ type: 'submitted', hash: tx.hash, message: 'Withdraw transaction submitted...' });
      await tx.wait();
      setTxStatus({ type: 'confirmed', hash: tx.hash, message: 'Withdraw confirmed! Staked tokens and rewards claimed.' });
      await Promise.all([fetchUserInfo(), fetchPendingReward(), fetchHolderUnlockTime(), fetchContractData()]);
    } catch (err) {
      setTxStatus({ type: 'error', message: err.reason || err.message || 'Withdraw failed' });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [signer, fetchUserInfo, fetchPendingReward, fetchHolderUnlockTime, fetchContractData]);

  // claimRewards uses withdraw() since the contract auto-claims rewards on withdraw
  // There is no standalone claimRewards function in the contract
  const claimRewards = useCallback(async () => {
    if (!signer) return;
    setIsLoading(true);
    setTxStatus({ type: 'pending', message: 'Awaiting claim confirmation in wallet...' });
    try {
      const contract = getStakingContract(signer);
      const tx = await contract.withdraw();
      setTxStatus({ type: 'submitted', hash: tx.hash, message: 'Claim (withdraw) transaction submitted...' });
      await tx.wait();
      setTxStatus({ type: 'confirmed', hash: tx.hash, message: 'Rewards claimed! Your staked tokens and rewards have been withdrawn.' });
      await Promise.all([fetchUserInfo(), fetchPendingReward(), fetchHolderUnlockTime(), fetchContractData()]);
    } catch (err) {
      setTxStatus({ type: 'error', message: err.reason || err.message || 'Claim rewards failed' });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [signer, fetchUserInfo, fetchPendingReward, fetchHolderUnlockTime, fetchContractData]);

  const emergencyWithdraw = useCallback(async () => {
    if (!signer) return;
    setIsLoading(true);
    setTxStatus({ type: 'pending', message: 'Awaiting emergency withdraw confirmation...' });
    try {
      const contract = getStakingContract(signer);
      const tx = await contract.emergencyWithdraw();
      setTxStatus({ type: 'submitted', hash: tx.hash, message: 'Emergency withdraw submitted...' });
      await tx.wait();
      setTxStatus({ type: 'confirmed', hash: tx.hash, message: 'Emergency withdraw confirmed!' });
      await Promise.all([fetchUserInfo(), fetchPendingReward(), fetchHolderUnlockTime(), fetchContractData()]);
    } catch (err) {
      setTxStatus({ type: 'error', message: err.reason || err.message || 'Emergency withdraw failed' });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [signer, fetchUserInfo, fetchPendingReward, fetchHolderUnlockTime, fetchContractData]);

  const refresh = useCallback(async () => {
    const addr = account;
    if (addr) {
      await Promise.all([fetchUserInfo(addr), fetchPendingReward(addr), fetchHolderUnlockTime(addr)]);
    }
    await fetchContractData();
  }, [account, fetchUserInfo, fetchPendingReward, fetchHolderUnlockTime, fetchContractData]);

  // Initial fetch and polling
  useEffect(() => {
    refresh();
    pollRef.current = setInterval(() => {
      refresh();
    }, POLL_INTERVAL);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [refresh]);

  return {
    userInfo,
    pendingReward,
    totalStaked,
    apy,
    rewardsRemaining,
    exitPenalty,
    lockDuration,
    holderUnlockTime,
    isLoading,
    txStatus,
    setTxStatus,
    stake,
    withdraw,
    claimRewards,
    emergencyWithdraw,
    refresh,
    fetchUserInfo,
    fetchPendingReward,
  };
}
