# DTOOLS Staking dApp — Production Readiness Audit Report

**Date:** 2026-05-08  
**Auditor:** Automated Code Audit  
**Version:** 1.0.0  
**Verdict:** ✅ **PASS — Production Ready**

---

## 1. Executive Summary

The DTOOLS Staking dApp has been audited for production readiness on Dogechain mainnet. Every source file in the project was read and analyzed against the verified on-chain contract ABI. The codebase is well-structured, correctly implements all contract interactions, handles edge cases appropriately, and builds with zero errors.

**Overall Status:** ✅ PASS  
**Blocking Issues:** 0  
**Issues Found & Fixed:** 1 (minor)  
**Observations (non-blocking):** 2

---

## 2. Contract Integrity Verification

### 2.1 Contract Addresses

| Item | Expected | Actual | Status |
|------|----------|--------|--------|
| Staking Contract | `0x7cc5fb5a99e51b2748a3ee2313e18f4f65b62416` | `0x7cc5fb5a99e51b2748a3ee2313e18f4f65b62416` | ✅ Match |
| Token Contract | `0xB9fcAa7590916578087842e017078D7797Fa18D0` | `0xB9fcAa7590916578087842e017078D7797Fa18D0` | ✅ Match |

### 2.2 ABI Verification (`src/config/contracts.js`)

| Function | Expected Signature | ABI Entry | Status |
|----------|-------------------|-----------|--------|
| `apy()` | `() → uint256` | ✅ Present | ✅ |
| `calculateNewRewards()` | `() → uint256` | ✅ Present (extra read fn) | ✅ |
| `deposit(uint256)` | `(uint256 _amount) → void` | ✅ Present | ✅ |
| `emergencyWithdraw()` | `() → void` | ✅ Present | ✅ |
| `exitPenaltyPerc()` | `() → uint256` | ✅ Correct name (NOT `exitPenalty`) | ✅ |
| `holderUnlockTime(address)` | `(address) → uint256` | ✅ Present | ✅ |
| `lockDuration()` | `() → uint256` | ✅ Correct name (NOT `lockPeriod`) | ✅ |
| `owner()` | `() → address` | ✅ Present | ✅ |
| `pendingReward(address)` | `(address _user) → uint256` | ✅ Present | ✅ |
| `rewardToken()` | `() → address` | ✅ Present | ✅ |
| `rewardsRemaining()` | `() → uint256` | ✅ Present | ✅ |
| `stakingToken()` | `() → address` | ✅ Present | ✅ |
| `totalStaked()` | `() → uint256` | ✅ Present | ✅ |
| `userInfo(address)` | `(address _user) → (uint256 amount, uint256 rewardDebt)` | ✅ 2 return values (not 3) | ✅ |
| `withdraw()` | `() → void` | ✅ Present | ✅ |

**Duplicates:** None found  
**Missing functions:** None  
**Extra functions:** `calculateNewRewards()` — harmless read-only function  
**Function name correctness:** `exitPenaltyPerc` ✅, `lockDuration` ✅

### 2.3 Token ABI Verification

| Function | Status |
|----------|--------|
| `balanceOf(address)` | ✅ |
| `approve(address, uint256)` | ✅ |
| `allowance(address, address)` | ✅ |
| `symbol()` | ✅ |
| `decimals()` | ✅ |
| `totalSupply()` | ✅ |
| `name()` | ✅ |

### 2.4 Constants Verification (`src/config/constants.js`)

| Constant | Value | Status |
|----------|-------|--------|
| CHAIN_ID | 2000 | ✅ |
| CHAIN_ID_HEX | 0x7d0 | ✅ |
| NETWORK_NAME | Dogechain | ✅ |
| RPC_URL | https://rpc.dogechain.dog/ | ✅ |
| BLOCK_EXPLORER | https://explorer.dogechain.dog/ | ✅ |
| TOKEN_DECIMALS | 18 | ✅ |
| POLL_INTERVAL | 15000 (15s) | ✅ |
| TRANSFER_TAX_PERCENT | 3 | ✅ |
| EXIT_PENALTY_PERCENT | 10 | ✅ |

---

## 3. Web3 Interactions

### 3.1 useWallet.js

| Check | Status | Notes |
|-------|--------|-------|
| Detects `window.ethereum` | ✅ | Checks before all operations |
| Handles chain switching to Dogechain | ✅ | `wallet_switchEthereumChain` + fallback `wallet_addEthereumChain` |
| Listens for `accountsChanged` | ✅ | Re-creates signer on account change |
| Listens for `chainChanged` | ✅ | Re-creates provider + signer |
| Handles wallet disconnection | ✅ | Sets account/signer/chainId/provider to null |
| Provider/signer setup for ethers.js v6 | ✅ | Uses `ethers.BrowserProvider` |
| Auto-connect on page load | ✅ | Uses `eth_accounts` to check existing session |
| Unmount safety | ✅ | `mountedRef` prevents state updates after unmount |

### 3.2 useStaking.js

| Check | Status | Notes |
|-------|--------|-------|
| `fetchUserInfo()` destructures 2 values | ✅ | `info.amount`, `info.rewardDebt` |
| `fetchContractData()` uses correct names | ✅ | `exitPenaltyPerc()`, `lockDuration()` |
| `stake(amount)` calls `deposit(amount)` | ✅ | Passes wei amount correctly |
| `withdraw()` calls `contract.withdraw()` | ✅ | No arguments (withdraws all) |
| `emergencyWithdraw()` wired correctly | ✅ | Calls `contract.emergencyWithdraw()` |
| `claimRewards()` calls `withdraw()` | ✅ | Correct — no standalone claim exists |
| Error handling on all calls | ✅ | try/catch with `err.reason \|\| err.message` |
| Loading states managed | ✅ | `isLoading` + `txStatus` per operation |
| Data refresh after transactions | ✅ | `Promise.all` refreshes all data |
| Polling interval | ✅ | 15-second auto-refresh |

### 3.3 useToken.js

| Check | Status | Notes |
|-------|--------|-------|
| `balanceOf()` works correctly | ✅ | Uses default provider for reads |
| `approve()` targets staking contract | ✅ | `approve(STAKING_CONTRACT_ADDRESS, amount)` |
| `allowance()` checks staking contract | ✅ | `allowance(account, STAKING_CONTRACT_ADDRESS)` |
| Uses `MaxUint256` for approval | ✅ | `approveMax()` calls `approve(ethers.MaxUint256)` |
| Error handling for approval failures | ✅ | try/catch with status updates |
| `needsApproval()` helper | ✅ | Compares allowance < amountWei |

---

## 4. Component Verification

### 4.1 StakePanel.jsx

| Feature | Status | Notes |
|---------|--------|-------|
| Stake tab: amount input + MAX button | ✅ | Number input with MAX button |
| Approve flow before stake | ✅ | Shows "Approve DTOOLS" when allowance insufficient |
| Deposit call on stake | ✅ | `handleStake()` → `onStake(amountWei)` |
| Unstake tab: staked balance display | ✅ | Shows `formatTokenAmount(stakedAmount)` |
| Withdraw button | ✅ | Calls `onWithdraw()` |
| Penalty warning with net amount | ✅ | Shows `exitPenaltyNum%` + calculated net amount |
| Emergency withdraw with confirmation | ✅ | Two-step: reveal button → confirm/cancel |
| Lock time display | ✅ | Shows unlock date + time remaining when locked |
| 3% transfer tax warning | ✅ | Amber warning box in stake tab |
| Transaction status feedback | ✅ | Button text changes: "Awaiting..." → "Confirming..." |
| Input validation | ✅ | `amount > 0` and `amount <= balance` checks |
| Wallet not connected state | ✅ | Shows "Connect your wallet" message |
| Wrong network state | ✅ | Shows "Please switch to Dogechain" message |

### 4.2 RewardsPanel.jsx

| Feature | Status | Notes |
|---------|--------|-------|
| Displays pending rewards | ✅ | Large emerald display with `formatTokenAmount` |
| "Claim Rewards" button | ✅ | Calls `onClaimRewards()` |
| Warning about full position withdrawal | ✅ | "Claiming rewards withdraws your entire staked position" |
| Loading state during claim | ✅ | Button disabled + "Confirming..." text |
| Accumulating indicator | ✅ | Green pulse dot + "Accumulating" badge |

### 4.3 Dashboard.jsx + StatsCard.jsx

| Feature | Status | Notes |
|---------|--------|-------|
| 8 stats cards display | ✅ | Balance, Staked, Rewards, TVL, APY, Rewards Remaining, Exit Penalty, Network |
| Values properly formatted | ✅ | `formatTokenAmount`, `formatNumber` utilities |
| Loading/empty states | ✅ | Shows "—" when data is null/undefined |
| Responsive grid | ✅ | 2 cols on mobile, 4 on desktop |

### 4.4 Header.jsx

| Feature | Status | Notes |
|---------|--------|-------|
| Connect/Disconnect wallet button | ✅ | Toggles based on `account` state |
| Network indicator | ✅ | Green "Dogechain" or red "Wrong Network" |
| Truncated wallet address | ✅ | `formatAddress()` shows `0x1234...5678` |
| Chain ID check | ✅ | `isCorrectChain` prop |
| MetaMask not installed | ✅ | Shows "Install MetaMask" button (disabled) |

### 4.5 InfoSection.jsx

| Feature | Status | Notes |
|---------|--------|-------|
| Community-built notice banner | ✅ | Amber banner at top with DBOT link |
| 4 DBOT FAQ items at top | ✅ | "Is this official?", "Why created?", "Is it safe?", "Who is DBOT?" |
| Original FAQ items intact | ✅ | 6 additional FAQ items below |
| All links open in new tab | ✅ | `target="_blank" rel="noopener noreferrer"` |
| Contract addresses with explorer links | ✅ | Clickable links to Blockscout |
| Quick Stats section | ✅ | Network, Token, Tax, Penalty, Lock Period |

### 4.6 TransactionToast.jsx

| Feature | Status | Notes |
|---------|--------|-------|
| Toast for all tx states | ✅ | pending (blue), submitted (amber), confirmed (green), error (red) |
| Explorer links in toast | ✅ | Truncated TX hash links to explorer |
| Auto-dismiss after success | ✅ | 5-second timer for confirmed/error |
| Manual dismiss button | ✅ | ✕ button on toast |
| Enter/exit animations | ✅ | slideInRight / slideOutRight |

### 4.7 App.jsx

| Feature | Status | Notes |
|---------|--------|-------|
| Hook integration | ✅ | `useWallet`, `useToken`, `useStaking` properly composed |
| Prop wiring to components | ✅ | All props correctly passed |
| Combined loading state | ✅ | `token.isLoading \|\| staking.isLoading` |
| TX status merge logic | ✅ | `lastTxSource` tracks which hook's TX to display |
| Post-tx data refresh | ✅ | `token.refresh()` called after staking operations |
| Wallet error display | ✅ | Red banner for wallet errors |
| DBOT footer | ✅ | "Brought to you by DBOT on Dogechain \| https://www.dbot.dog/" |
| Footer links open in new tab | ✅ | Explorer + Contract + DBOT links |

---

## 5. Error Handling & Edge Cases

| Scenario | Status | Implementation |
|----------|--------|----------------|
| Wallet not installed | ✅ | Header shows "Install MetaMask" (disabled button) |
| Wallet disconnected mid-session | ✅ | `accountsChanged` handler calls `disconnect()` |
| Wrong network | ✅ | Red "Wrong Network" indicator + "Switch Network" button |
| Insufficient token balance | ✅ | Stake button disabled when `stakeAmountFloat > balanceFloat` |
| Insufficient gas | ✅ | Caught by try/catch, shows error in toast |
| Transaction rejected by user | ✅ | Caught by try/catch, shows error message (not crash) |
| Contract call reverts | ✅ | Shows `err.reason \|\| err.message` in toast |
| RPC endpoint down | ✅ | Caught by try/catch in fetch functions, logged to console |
| Zero staked balance | ✅ | `formatTokenAmount(0n)` returns "0", withdraw disabled |
| Zero pending rewards | ✅ | `formatTokenAmount(null)` returns "0", claim disabled |
| Very large numbers | ✅ | `formatTokenAmount` handles millions with "M" suffix |
| Null/undefined values | ✅ | Dashboard shows "—" for null values |

---

## 6. UI/UX Consistency

| Check | Status | Notes |
|-------|--------|-------|
| Dark theme consistent | ✅ | `bg-slate-950` base, all components use slate palette |
| Amber/gold accent for primary actions | ✅ | `from-amber-500 to-amber-600` gradient buttons |
| Responsive layout | ✅ | Grid breakpoints: 1 col → 2 col → 3/4 col |
| Loading states | ✅ | Button text changes + disabled state |
| Consistent button styling | ✅ | Gradient primary, slate secondary, proper hover/disabled |
| DBOT footer present | ✅ | Two-row footer with links and DBOT credit |
| Footer links open in new tab | ✅ | All footer links use `target="_blank"` |
| Custom scrollbar | ✅ | Dark theme scrollbar via CSS |
| Toast animations | ✅ | slideInRight / slideOutRight keyframes |
| Pulse animation on rewards | ✅ | Green glow pulse on RewardsPanel |

---

## 7. Issues Found & Fixed

| # | Severity | File | Issue | Fix Applied |
|---|----------|------|-------|-------------|
| 1 | Minor | `src/hooks/useWallet.js:74` | `disconnect()` function reset `account`, `signer`, and `chainId` to null but did not reset `provider` to null, leaving a stale provider reference | Added `setProvider(null)` to the `disconnect` callback |

### Observations (Non-blocking, No Fix Required)

| # | Severity | File | Observation |
|---|----------|------|-------------|
| 1 | Info | `src/components/StakePanel.jsx:70` | `handleMaxUnstake` function is defined but not wired to any UI element in the unstake tab (dead code). Not a bug — withdraw always withdraws all. |
| 2 | Info | `src/components/StakePanel.jsx:16` | `lockDuration` prop is received but unused in the component. Lock status is correctly shown via `holderUnlockTime` instead. |

---

## 8. Production Build

```
$ npx vite build

vite v6.4.2 building for production...
transforming...
✓ 188 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.63 kB │ gzip:   0.40 kB
dist/assets/index-DV9llX3p.css   38.99 kB │ gzip:   6.73 kB
dist/assets/index-DZCfKbY0.js   456.79 kB │ gzip: 155.66 kB
✓ built in 1.53s
```

**Build Status:** ✅ Success (exit code 0)  
**Errors:** 0  
**Warnings:** 0  

### Bundle Analysis

| Asset | Size | Gzipped | Assessment |
|-------|------|---------|------------|
| index.html | 0.63 kB | 0.40 kB | ✅ Minimal |
| CSS | 38.99 kB | 6.73 kB | ✅ Reasonable (Tailwind CSS) |
| JavaScript | 456.79 kB | 155.66 kB | ✅ Expected (ethers.js v6 is ~400 kB) |

The JS bundle size is dominated by ethers.js v6, which is a large library. The 155.66 kB gzipped size is acceptable for a production dApp. No unexpected bloat detected.

---

## 9. Final Verdict

### ✅ PRODUCTION READY

The DTOOLS Staking dApp passes all production readiness checks:

1. **Contract Integrity:** All addresses, ABIs, and function signatures verified against the on-chain contract ✅
2. **Web3 Interactions:** All stake/unstake/claim/approve flows correctly implemented ✅
3. **Error Handling:** Comprehensive coverage of edge cases (wallet, network, transaction errors) ✅
4. **UI/UX Consistency:** Dark theme, responsive layout, proper feedback mechanisms ✅
5. **Production Build:** Zero errors, zero warnings, reasonable bundle size ✅

**Blocking Issues:** None  
**Recommended Next Steps:** Deploy to production hosting (Vercel, Netlify, or IPFS)

---

*Audit completed on 2026-05-08. All source files were read and verified.*
