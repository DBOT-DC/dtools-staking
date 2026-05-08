import { useState, useCallback } from 'react';
import Header from './components/Header.jsx';
import Dashboard from './components/Dashboard.jsx';
import StakePanel from './components/StakePanel.jsx';
import RewardsPanel from './components/RewardsPanel.jsx';
import TransactionToast from './components/TransactionToast.jsx';
import InfoSection from './components/InfoSection.jsx';
import { useWallet } from './hooks/useWallet.js';
import { useToken } from './hooks/useToken.js';
import { useStaking } from './hooks/useStaking.js';
import { STAKING_CONTRACT_ADDRESS } from './config/contracts.js';

export default function App() {
  const wallet = useWallet();
  const token = useToken(wallet.account, wallet.signer);
  const staking = useStaking(wallet.account, wallet.signer);

  // Merge tx status from both hooks — show whichever is most recent
  const [lastTxSource, setLastTxSource] = useState(null);
  const activeTxStatus = lastTxSource === 'token' ? token.txStatus : staking.txStatus;

  const handleApproveMax = useCallback(async () => {
    setLastTxSource('token');
    try {
      await token.approveMax();
    } catch {
      // Error already handled in hook
    }
  }, [token]);

  const handleStake = useCallback(async (amount) => {
    setLastTxSource('staking');
    try {
      await staking.stake(amount);
      await token.refresh();
    } catch {
      // Error already handled in hook
    }
  }, [staking, token]);

  const handleWithdraw = useCallback(async () => {
    setLastTxSource('staking');
    try {
      await staking.withdraw();
      await token.refresh();
    } catch {
      // Error already handled in hook
    }
  }, [staking, token]);

  const handleClaimRewards = useCallback(async () => {
    setLastTxSource('staking');
    try {
      await staking.claimRewards();
      await token.refresh();
    } catch {
      // Error already handled in hook
    }
  }, [staking, token]);

  const handleEmergencyWithdraw = useCallback(async () => {
    setLastTxSource('staking');
    try {
      await staking.emergencyWithdraw();
      await token.refresh();
    } catch {
      // Error already handled in hook
    }
  }, [staking, token]);

  const handleDismissTx = useCallback(() => {
    token.setTxStatus(null);
    staking.setTxStatus(null);
  }, [token, staking]);

  return (
    <div className="min-h-screen bg-slate-950">
      <Header
        account={wallet.account}
        isConnecting={wallet.isConnecting}
        isCorrectChain={wallet.isCorrectChain}
        onConnect={wallet.connect}
        onDisconnect={wallet.disconnect}
        onSwitchNetwork={wallet.switchNetwork}
        hasMetaMask={wallet.hasMetaMask}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Wallet error */}
        {wallet.error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {wallet.error}
          </div>
        )}

        {/* Dashboard Stats */}
        <Dashboard
          account={wallet.account}
          tokenBalance={token.balance}
          stakedAmount={staking.userInfo?.amount}
          pendingReward={staking.pendingReward}
          totalStaked={staking.totalStaked}
          apy={staking.apy}
          rewardsRemaining={staking.rewardsRemaining}
          symbol={token.symbol}
        />

        {/* Two-column layout for panels on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <StakePanel
              account={wallet.account}
              isCorrectChain={wallet.isCorrectChain}
              tokenBalance={token.balance}
              stakedAmount={staking.userInfo?.amount}
              allowance={token.allowance}
              symbol={token.symbol}
              apy={staking.apy}
              lockDuration={staking.lockDuration}
              holderUnlockTime={staking.holderUnlockTime}
              isLoading={token.isLoading || staking.isLoading}
              onApproveMax={handleApproveMax}
              onStake={handleStake}
              onWithdraw={handleWithdraw}
              onEmergencyWithdraw={handleEmergencyWithdraw}
              needsApproval={token.needsApproval}
            />
          </div>
          <div>
            <RewardsPanel
              account={wallet.account}
              isCorrectChain={wallet.isCorrectChain}
              pendingReward={staking.pendingReward}
              symbol={token.symbol}
              isLoading={token.isLoading || staking.isLoading}
              onClaimRewards={handleClaimRewards}
            />
          </div>
        </div>

        {/* Info Section */}
        <InfoSection />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-600">
              DTOOLS Staking dApp — Built for the Dogechain community
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://explorer.dogechain.dog/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-500 hover:text-amber-400 transition-colors"
              >
                Explorer ↗
              </a>
              <span className="text-slate-800">|</span>
              <a
                href={`https://explorer.dogechain.dog/address/${STAKING_CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-500 hover:text-amber-400 transition-colors"
              >
                Contract ↗
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center">
            <p className="text-sm text-slate-500">
              Brought to you by{' '}
              <span className="text-slate-400 font-medium">DBOT</span>
              {' '}on Dogechain |{' '}
              <a
                href="https://www.dbot.dog/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 font-medium underline underline-offset-2 transition-colors"
              >
                https://www.dbot.dog/
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* Transaction Toast */}
      <TransactionToast txStatus={activeTxStatus} onDismiss={handleDismissTx} />
    </div>
  );
}
