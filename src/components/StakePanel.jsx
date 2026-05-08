import { useState, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { formatTokenAmount } from '../utils/format.js';
import { TOKEN_DECIMALS, TRANSFER_TAX_PERCENT } from '../config/constants.js';

export default function StakePanel({
  account,
  isCorrectChain,
  tokenBalance,
  stakedAmount,
  allowance,
  symbol,
  apy,
  exitPenalty,
  lockDuration,
  holderUnlockTime,
  isLoading,
  onApproveMax,
  onStake,
  onWithdraw,
  onEmergencyWithdraw,
  needsApproval,
}) {
  const [activeTab, setActiveTab] = useState('stake');
  const [stakeAmount, setStakeAmount] = useState('');
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);

  const balanceFloat = tokenBalance ? parseFloat(ethers.formatUnits(tokenBalance, TOKEN_DECIMALS)) : 0;
  const stakedFloat = stakedAmount ? parseFloat(ethers.formatUnits(stakedAmount, TOKEN_DECIMALS)) : 0;
  const stakeAmountFloat = parseFloat(stakeAmount) || 0;
  const exitPenaltyNum = exitPenalty ? Number(exitPenalty) : 10;

  // Estimated rewards calculation: amount * APY / 100 per year
  const apyNum = apy ? Number(apy) : 5;
  const estimatedYearlyReward = stakeAmountFloat * (apyNum / 100);
  const estimatedDailyReward = estimatedYearlyReward / 365;

  // Net amount after penalty for withdrawal
  const netWithdrawAmount = stakedFloat * (1 - exitPenaltyNum / 100);

  // Lock time calculation
  const lockInfo = useMemo(() => {
    if (!holderUnlockTime || !stakedAmount || stakedAmount === 0n) {
      return { isLocked: false, unlockDate: null, timeRemaining: null };
    }
    const unlockTimestamp = Number(holderUnlockTime);
    const now = Math.floor(Date.now() / 1000);
    const isLocked = unlockTimestamp > now;
    const unlockDate = new Date(unlockTimestamp * 1000);
    const timeRemaining = isLocked ? unlockTimestamp - now : 0;
    return { isLocked, unlockDate, timeRemaining };
  }, [holderUnlockTime, stakedAmount]);

  // Format time remaining as human-readable string
  const formatTimeRemaining = useCallback((seconds) => {
    if (!seconds || seconds <= 0) return null;
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  }, []);

  const handleMaxStake = useCallback(() => {
    if (!tokenBalance) return;
    setStakeAmount(ethers.formatUnits(tokenBalance, TOKEN_DECIMALS));
  }, [tokenBalance]);

  const handleMaxUnstake = useCallback(() => {
    if (!stakedAmount) return;
    setStakeAmount(ethers.formatUnits(stakedAmount, TOKEN_DECIMALS));
  }, [stakedAmount]);

  const handleStake = useCallback(async () => {
    if (!stakeAmount || stakeAmountFloat <= 0) return;
    const amountWei = ethers.parseUnits(stakeAmount, TOKEN_DECIMALS);
    await onStake(amountWei);
    setStakeAmount('');
  }, [stakeAmount, stakeAmountFloat, onStake]);

  const handleWithdraw = useCallback(async () => {
    await onWithdraw();
    setStakeAmount('');
  }, [onWithdraw]);

  const handleEmergencyWithdraw = useCallback(async () => {
    await onEmergencyWithdraw();
    setShowEmergencyConfirm(false);
    setStakeAmount('');
  }, [onEmergencyWithdraw]);

  const amountWei = stakeAmount ? ethers.parseUnits(stakeAmount, TOKEN_DECIMALS) : 0n;
  const needsApprove = activeTab === 'stake' && amountWei > 0n && needsApproval(amountWei);

  if (!account) {
    return (
      <section className="mb-8">
        <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-8 text-center">
          <p className="text-slate-400">Connect your wallet to stake and unstake {symbol} tokens</p>
        </div>
      </section>
    );
  }

  if (!isCorrectChain) {
    return (
      <section className="mb-8">
        <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-8 text-center">
          <p className="text-red-400">Please switch to Dogechain network to continue</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2">
        <span className="w-1 h-5 bg-amber-500 rounded-full" />
        Stake / Unstake
      </h2>

      <div className="rounded-xl bg-slate-900/50 border border-slate-800 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => { setActiveTab('stake'); setStakeAmount(''); }}
            className={`flex-1 py-3 text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'stake'
                ? 'text-amber-400 bg-amber-500/5 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Stake
          </button>
          <button
            onClick={() => { setActiveTab('unstake'); setStakeAmount(''); }}
            className={`flex-1 py-3 text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'unstake'
                ? 'text-amber-400 bg-amber-500/5 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Unstake
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {activeTab === 'stake' ? (
            /* ====== STAKE TAB ====== */
            <div>
              {/* Balance info */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Available to stake</span>
                <span className="text-xs text-slate-300 font-medium">
                  {formatTokenAmount(tokenBalance)} {symbol}
                </span>
              </div>

              {/* Amount input */}
              <div className="relative mb-3">
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="0.0"
                  min="0"
                  step="any"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 pr-20 text-white text-lg placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors"
                />
                <button
                  onClick={handleMaxStake}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold rounded-md transition-colors cursor-pointer"
                >
                  MAX
                </button>
              </div>

              {/* Transfer tax warning */}
              <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                <span className="text-amber-400 text-sm mt-0.5">⚠️</span>
                <p className="text-xs text-amber-300/80">
                  {symbol} has a {TRANSFER_TAX_PERCENT}% transfer tax. The staking contract will receive {100 - TRANSFER_TAX_PERCENT}% of the amount you send.
                </p>
              </div>

              {/* Estimated rewards */}
              {stakeAmountFloat > 0 && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <p className="text-xs text-slate-400 mb-1">Estimated Rewards (at {apyNum}% APY)</p>
                  <div className="flex justify-between">
                    <span className="text-sm text-emerald-400">Daily: ~{estimatedDailyReward.toFixed(4)} {symbol}</span>
                    <span className="text-sm text-emerald-400">Yearly: ~{estimatedYearlyReward.toFixed(2)} {symbol}</span>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-2">
                {needsApprove ? (
                  <button
                    onClick={onApproveMax}
                    disabled={isLoading || balanceFloat <= 0}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isLoading ? 'Awaiting Approval...' : `Approve ${symbol}`}
                  </button>
                ) : (
                  <button
                    onClick={handleStake}
                    disabled={isLoading || !stakeAmount || stakeAmountFloat <= 0 || stakeAmountFloat > balanceFloat}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isLoading ? 'Confirming...' : `Stake ${symbol}`}
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* ====== UNSTAKE TAB ====== */
            <div>
              {/* Staked balance info */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Your staked balance</span>
                <span className="text-xs text-slate-300 font-medium">
                  {formatTokenAmount(stakedAmount)} {symbol}
                </span>
              </div>

              {/* Lock time info */}
              {lockInfo.isLocked && stakedFloat > 0 && (
                <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                  <span className="text-blue-400 text-sm mt-0.5">🔒</span>
                  <div>
                    <p className="text-xs text-blue-300/80 font-medium">
                      Tokens are locked until {lockInfo.unlockDate?.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Time remaining: <span className="text-blue-400 font-medium">{formatTimeRemaining(lockInfo.timeRemaining)}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Penalty warning */}
              <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                <span className="text-orange-400 text-sm mt-0.5">⚠️</span>
                <div>
                  <p className="text-xs text-orange-300/80 font-medium">
                    {exitPenaltyNum}% exit penalty applies on withdrawal.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    You will receive approximately <span className="text-white font-medium">{netWithdrawAmount.toFixed(4)} {symbol}</span> after penalty.
                  </p>
                </div>
              </div>

              {/* Withdraw breakdown */}
              <div className="mb-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Staked amount:</span>
                  <span className="text-white">{stakedFloat.toFixed(4)} {symbol}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Penalty ({exitPenaltyNum}%):</span>
                  <span className="text-orange-400">-{(stakedFloat * exitPenaltyNum / 100).toFixed(4)} {symbol}</span>
                </div>
                <div className="border-t border-slate-700 mt-2 pt-2 flex justify-between text-sm">
                  <span className="text-slate-300 font-medium">You receive:</span>
                  <span className="text-emerald-400 font-bold">~{netWithdrawAmount.toFixed(4)} {symbol}</span>
                </div>
              </div>

              {/* Info about how withdraw works */}
              <div className="mb-4 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <p className="text-xs text-slate-400">
                  💡 <span className="text-emerald-400 font-medium">Withdrawal claims all staked tokens + accumulated rewards.</span> The contract does not have a separate claim function — rewards are automatically included when you withdraw.
                </p>
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleWithdraw}
                  disabled={isLoading || stakedFloat <= 0}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? 'Confirming...' : `Withdraw All (${formatTokenAmount(stakedAmount)} ${symbol})`}
                </button>

                {/* Emergency withdraw */}
                {!showEmergencyConfirm ? (
                  <button
                    onClick={() => setShowEmergencyConfirm(true)}
                    disabled={isLoading || stakedFloat <= 0}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-300 text-sm font-medium rounded-lg border border-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Emergency Withdraw
                  </button>
                ) : (
                  <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                    <p className="text-xs text-red-400 mb-2">
                      Are you sure? Emergency withdraw may forfeit pending rewards. This action cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleEmergencyWithdraw}
                        disabled={isLoading}
                        className="flex-1 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {isLoading ? 'Confirming...' : 'Confirm Emergency Withdraw'}
                      </button>
                      <button
                        onClick={() => setShowEmergencyConfirm(false)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-sm rounded-lg transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
