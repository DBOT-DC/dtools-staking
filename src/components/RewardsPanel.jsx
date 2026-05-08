import { ethers } from 'ethers';
import { formatTokenAmount } from '../utils/format.js';
import { TOKEN_DECIMALS } from '../config/constants.js';

export default function RewardsPanel({
  account,
  isCorrectChain,
  pendingReward,
  symbol,
  isLoading,
  onClaimRewards,
}) {
  const rewardFloat = pendingReward ? parseFloat(ethers.formatUnits(pendingReward, TOKEN_DECIMALS)) : 0;

  if (!account || !isCorrectChain) return null;

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2">
        <span className="w-1 h-5 bg-emerald-500 rounded-full" />
        Rewards
      </h2>

      <div className="rounded-xl bg-gradient-to-br from-emerald-500/5 to-emerald-600/5 border border-emerald-500/20 p-5 sm:p-6 pulse-rewards">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400 mb-1">Pending Rewards</p>
            <p className="text-3xl sm:text-4xl font-bold text-emerald-400">
              {formatTokenAmount(pendingReward, 18, 6)} <span className="text-lg text-emerald-400/70">{symbol}</span>
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">Accumulating</span>
            </div>
          </div>
        </div>

        {/* Claim Rewards Button */}
        <div className="mt-4 pt-4 border-t border-emerald-500/10">
          <button
            onClick={onClaimRewards}
            disabled={isLoading || rewardFloat <= 0}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? 'Confirming...' : `Claim Rewards (${formatTokenAmount(pendingReward, 18, 4)} ${symbol})`}
          </button>
          <p className="text-xs text-slate-500 mt-2 text-center">
            ⚠️ Claiming rewards withdraws your entire staked position (contract limitation). Your staked tokens will be returned minus the exit penalty.
          </p>
        </div>
      </div>
    </section>
  );
}
