# DTOOLS ($DTOOLS) Safe Contract Interaction & Asset Recovery Guide

## Dogechain Network — Staking Withdrawal & Asset Recovery Playbook

---

**Document Purpose:** Step-by-step guide to safely interact with DTOOLS smart contracts on Dogechain via MetaMask and other tools to recover staked tokens, LP tokens, and unclaimed rewards.

**Token Contract Address:** `0xB9fcAa7590916578087842e017078D7797Fa18D0`

**Network:** Dogechain (EVM-compatible, Chain ID: 2000)

**Block Explorer:** `https://explorer.dogechain.dog/`

**Status:** Front-end inaccessible — direct contract interaction required

---

> ⚠️ **CRITICAL SECURITY NOTICE:** This guide involves interacting with smart contracts that hold real financial value. Every state-changing transaction carries risk. Follow the safety checklist in Section 2 before executing any withdrawal. All read-only operations (Section 3) are safe and cost no gas.

---

## Table of Contents

1. [Network Configuration](#section-1-network-configuration)
2. [Pre-Interaction Safety Checklist](#section-2-pre-interaction-safety-checklist)
3. [Identifying Your Staked Positions](#section-3-identifying-your-staked-positions)
4. [Executing Withdrawal Functions](#section-4-executing-withdrawal-functions)
5. [Direct Contract Interaction Methods](#section-5-direct-contract-interaction-methods)
6. [Post-Recovery Actions](#section-6-post-recovery-actions)
7. [Troubleshooting Common Issues](#section-7-troubleshooting-common-issues)
8. [Emergency Scenarios](#section-8-emergency-scenarios)

---

## Section 1: Network Configuration

### 1.1 Add Dogechain to MetaMask

Dogechain is fully EVM-compatible, so all Ethereum tooling (MetaMask, Remix, Foundry, ethers.js) works identically. You must first configure MetaMask to connect to the Dogechain network.

#### Manual Configuration Steps

1. Open MetaMask and click the **network selector** (top-left, shows "Ethereum Mainnet" by default).
2. Click **"Add network"** → **"Add a network manually"**.
3. Fill in the following fields:

| Field | Value |
|-------|-------|
| **Network Name** | `Dogechain` |
| **New RPC URL** | `https://rpc.dogechain.dog` |
| **Chain ID** | `2000` |
| **Currency Symbol** | `DOGE` |
| **Block Explorer URL** | `https://explorer.dogechain.dog` |

4. Click **"Save"**.
5. MetaMask should automatically switch to the Dogechain network.

#### Alternative RPC Endpoints

If the primary RPC is unresponsive, try these alternatives:

| RPC URL | Provider |
|---------|----------|
| `https://rpc.dogechain.dog` | Dogechain Official (Primary) |
| `https://rpc01.dogechain.dog` | Dogechain Official (Backup 1) |
| `https://rpc02.dogechain.dog` | Dogechain Official (Backup 2) |
| `https://rpc03-sgp.dogechain.dog` | Dogechain Singapore Node |
| `https://dogechain.ankr.com` | Ankr Public RPC |

> ⚠️ **Note:** Public RPC endpoints can go offline. If none work, check the Dogechain community (Discord/Telegram) for current working RPC URLs.

### 1.2 Verify Network Connection

After adding the network, verify you are correctly connected:

1. **Check the network name** in MetaMask's top bar — it should display "Dogechain".
2. **Check your DOGE balance** — MetaMask should show your native DOGE balance (used for gas fees).
3. **Verify Chain ID** by opening MetaMask → Settings → Networks → Dogechain. Confirm Chain ID is `2000`.
4. **Test the RPC** by visiting the block explorer: `https://explorer.dogechain.dog/` — it should load and show recent blocks.

### 1.3 Ensure You Have Gas (DOGE)

> ⚠️ **You need native DOGE in your wallet to pay for gas on any withdrawal transaction.**

- Every state-changing transaction on Dogechain requires DOGE for gas fees.
- Check your DOGE balance in MetaMask.
- If your balance is 0 DOGE, you must send DOGE to your wallet address from an exchange or another wallet before you can execute any withdrawals.
- Typical gas costs for a withdrawal transaction: **0.01–0.1 DOGE** (Dogechain gas is very cheap). Always keep a buffer.

---

## Section 2: Pre-Interaction Safety Checklist

> ⚠️ **COMPLETE THIS CHECKLIST BEFORE EXECUTING ANY STATE-CHANGING TRANSACTION.** Skipping these steps could result in permanent loss of funds.

### 2.1 Verify the Contract Is Safe to Interact With

Before calling any function on a contract, perform these checks:

#### Step 1: Confirm the Contract Address

- ✅ The contract address should have been discovered through the investigation plan ([`audit-investigation-plan.md`](audit-investigation-plan.md)).
- ✅ Cross-reference the address using the block explorer — verify it was created by the DTOOLS deployer wallet.
- ✅ Check the contract's transaction history — it should show legitimate DTOOLS token interactions.
- ❌ **NEVER** interact with a contract address received from an unverified source (DM, random website, etc.).

#### Step 2: Check Contract Verification Status

1. Navigate to the contract on the block explorer:
   ```
   https://explorer.dogechain.dog/address/<CONTRACT_ADDRESS>
   ```
2. Click the **"Contract"** tab.
3. Check if source code is visible:
   - **Verified (Green checkmark):** ✅ Source code is visible — you can read and audit the logic.
   - **Unverified (No source code):** ⚠️ Only bytecode is shown — extra caution required. Consider decompiling with [Dedaub](https://library.dedaub.com/) or [Panoramix](https://panoramix.dedaub.com/).

#### Step 3: Review Contract Bytecode (If Unverified)

If the contract is unverified, examine the bytecode for known patterns:

1. Copy the bytecode from the explorer's Contract tab.
2. Search the bytecode hex string for these known function selectors:

| Hex Pattern | Function | Safety |
|-------------|----------|--------|
| `70a08231` | `balanceOf(address)` | ✅ Read-only |
| `2e1a7d4d` | `withdraw(uint256)` | ✅ Standard withdrawal |
| `3ccfd60b` | `withdraw()` | ✅ Standard withdrawal |
| `e9fad8ee` | `exit()` | ✅ Withdraw + claim |
| `5ae62c0b` | `emergencyWithdraw()` | ✅ Emergency withdrawal |
| `d9caed12` | `emergencyWithdraw(uint256)` | ✅ Emergency withdrawal |
| `a694fc3a` | `stake(uint256)` | ⚠️ State-changing (deposit) |
| `d0e30db0` | `deposit()` | ⚠️ State-changing (deposit) |
| `095ea7b3` | `approve(address,uint256)` | ⚠️ State-changing (approval) |
| `a9059cbb` | `transfer(address,uint256)` | ⚠️ State-changing |

3. **Red flags in bytecode:**
   - Presence of `selfdestruct` or `suicide` opcodes — the contract can be destroyed.
   - Presence of `delegatecall` to a user-controlled address — potential proxy exploit.
   - Very short bytecode (< 100 bytes) with no recognizable selectors — likely a proxy or minimal contract.

#### Step 4: Check for Honeypot Indicators

⚠️ **A honeypot is a contract that appears to allow withdrawals but silently reverts or redirects funds.**

Check for these warning signs:

1. **Call `paused()`** (if the function exists) — if it returns `true`, withdrawals are blocked.
2. **Call `owner()`** — if ownership is NOT renounced (`owner() != 0x000...000`), the owner may have the ability to:
   - Pause withdrawals via `pause()`
   - Drain the contract via `sweepFunds()`, `rescueTokens()`, or `withdrawTo()`
   - Blacklist addresses via `blacklist(address)`
3. **Check the contract's token balance** — call `balanceOf(<CONTRACT_ADDRESS>)` on the DTOOLS token contract. If the balance is 0, there are no tokens to recover.
4. **Look for withdrawal limits** — some contracts have `maxWithdrawal()` or `withdrawalFee()` functions that limit how much you can withdraw.

### 2.2 Understand Read-Only vs. State-Changing Operations

| Operation Type | RPC Method | Costs Gas? | Can Modify State? | Risk Level |
|---------------|-----------|-----------|-------------------|------------|
| **Read-only** (`eth_call`) | `eth_call` | ❌ No | ❌ No | 🟢 Safe |
| **State-changing** (`eth_sendTransaction`) | `eth_sendTransaction` | ✅ Yes | ✅ Yes | 🟡 Requires caution |

**Read-only functions** (safe to call anytime):
- `balanceOf(address)`, `totalSupply()`, `owner()`, `paused()`
- `userInfo(pid, address)`, `earned(address)`, `pendingRewards(address)`
- `poolInfo(pid)`, `poolLength()`, `stakingToken()`, `rewardsToken()`

**State-changing functions** (require gas, modify blockchain state):
- `withdraw(amount)`, `emergencyWithdraw(pid)`, `exit()`, `getReward()`
- `approve(spender, amount)`, `transfer(to, amount)`
- `unstake(amount)`, `claimRewards()`

> ⚠️ **Rule of thumb:** Always call read-only functions first to verify the state before executing any state-changing transaction.

### 2.3 Gas Estimation & Limits

Before sending any transaction:

1. **Use the block explorer's "Simulate" feature** (if available) to preview the transaction outcome.
2. **MetaMask will auto-estimate gas** — but you can manually review and adjust:
   - Click "Edit" next to the gas fee in MetaMask.
   - The estimated gas limit should be reasonable (typically 50,000–200,000 gas for a withdrawal).
   - If MetaMask estimates an extremely high gas limit (> 500,000), the transaction may revert — investigate before proceeding.
3. **Gas price on Dogechain** is typically very low — use the default suggested by MetaMask.

### 2.4 Test with Small Amounts First

> ⚠️ **Whenever possible, test withdrawals with a small amount before withdrawing your full balance.**

- If the contract allows partial withdrawals (e.g., `withdraw(amount)`), withdraw a small test amount first (e.g., 1 token).
- Verify the test withdrawal succeeds and tokens arrive in your wallet.
- Only then proceed with the full withdrawal.
- Some contracts only allow full withdrawals — in that case, proceed with caution after completing all safety checks.

### 2.5 Pre-Interaction Safety Checklist Summary

Before executing any withdrawal, confirm:

- [ ] ✅ Dogechain network is correctly configured in MetaMask
- [ ] ✅ You have sufficient DOGE for gas fees
- [ ] ✅ Contract address has been verified through investigation
- [ ] ✅ Contract verification status has been checked
- [ ] ✅ Contract is not paused (`paused()` returns `false` or doesn't exist)
- [ ] ✅ Contract holds sufficient tokens for your withdrawal
- [ ] ✅ Ownership status has been checked (`owner()`)
- [ ] ✅ No suspicious functions detected in bytecode
- [ ] ✅ You've called read-only functions to confirm your staked balance
- [ ] ✅ Gas estimation returns a reasonable value
- [ ] ✅ You understand which function you're calling and what it does

---

## Section 3: Identifying Your Staked Positions

> 🟢 **All operations in this section are READ-ONLY and cost no gas.** You can safely perform these queries without any risk.

### 3.1 Using the Block Explorer's "Read Contract" Tab

The easiest way to query contract state is through the Dogechain block explorer:

1. Navigate to the contract address:
   ```
   https://explorer.dogechain.dog/address/<CONTRACT_ADDRESS>
   ```
2. Click the **"Contract"** tab.
3. If the contract is verified, you'll see a **"Read Contract"** sub-tab — click it.
4. A list of all readable functions will appear with input fields.
5. Enter the required parameters and click **"Query"** to get results.

### 3.2 Key Functions to Call

#### 3.2.1 Check Your Wallet Token Balance

**Contract:** DTOOLS Token (`0xB9fcAa7590916578087842e017078D7797Fa18D0`)

**Function:** `balanceOf(address account)`

**ABI snippet:**
```json
[
  {
    "inputs": [{ "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
]
```

**How to call:** Enter your wallet address as the parameter. The result is the raw balance — divide by `10^18` (assuming 18 decimals) to get the human-readable amount.

**Example:** If the result is `5000000000000000000000`, your balance is `5000 DTOOLS`.

#### 3.2.2 Check Staked Balance (Direct Staking Pattern)

**Function:** `balanceOf(address account)` on the **staking contract** (not the token contract)

> **Important:** Staking contracts often implement their own `balanceOf()` which returns the staked amount, separate from the token contract's `balanceOf()`.

**Alternative functions to try:**
- `stakedBalance(address)` — returns staked amount for the address
- `deposits(address)` — returns deposit amount
- `stakes(address)` — returns staked amount

#### 3.2.3 Check Staked Balance (MasterChef Pattern)

**Function:** `userInfo(uint256 pid, address user)`

**ABI snippet:**
```json
[
  {
    "inputs": [
      { "name": "pid", "type": "uint256" },
      { "name": "user", "type": "address" }
    ],
    "name": "userInfo",
    "outputs": [
      { "name": "amount", "type": "uint256" },
      { "name": "rewardDebt", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]
```

**How to call:**
1. First, determine the pool ID (`pid`) — call `poolLength()` to see how many pools exist.
2. For each pool (pid = 0, 1, 2, ...), call `userInfo(pid, <YOUR_WALLET_ADDRESS>)`.
3. Check the `amount` field — if it's > 0, you have tokens staked in that pool.
4. The `rewardDebt` field is used internally for reward calculations.

#### 3.2.4 Check Pending Rewards

**Functions to try (depends on contract pattern):**

| Function | Pattern | Parameters |
|----------|---------|------------|
| `pendingRewards(address)` | Direct staking | Your wallet address |
| `pendingDtools(address)` | DTOOLS-specific | Your wallet address |
| `pendingSushi(uint256, address)` | MasterChef (SushiSwap fork) | Pool ID, your wallet address |
| `earned(address)` | Synthetix-style | Your wallet address |
| `claimable(address)` | Custom | Your wallet address |

**ABI snippet for `earned(address)`:**
```json
[
  {
    "inputs": [{ "name": "account", "type": "address" }],
    "name": "earned",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
]
```

#### 3.2.5 Check Contract Status Functions

Before any withdrawal, call these on the staking contract:

| Function | What to Check | Safe Value |
|----------|--------------|------------|
| `paused()` | Whether the contract is paused | Should return `false` |
| `owner()` | Who controls the contract | `0x000...000` = renounced (safest) |
| `totalSupply()` | Total tokens staked in contract | Should be > 0 |
| `stakingToken()` | Which token is being staked | Should match DTOOLS or LP token address |
| `rewardRate()` | Current reward distribution rate | Informational |

### 3.3 Manually Encoding Function Calls

If you need to call a function manually (e.g., via `eth_call` in a tool), you must encode the function call:

#### Function Selector Encoding

The function selector is the first 4 bytes of the keccak256 hash of the function signature:

| Function Signature | Selector (hex) |
|-------------------|----------------|
| `balanceOf(address)` | `0x70a08231` |
| `userInfo(uint256,address)` | `0x93f1a40b` |
| `earned(address)` | `0x008cc262` |
| `pendingRewards(address)` | `0x6cf6d7b8` |
| `owner()` | `0x8da5cb5b` |
| `paused()` | `0x5c975abb` |
| `poolLength()` | `0x081e3eda` |
| `totalSupply()` | `0x18160ddd` |

#### Parameter Encoding (address)

An address parameter is encoded as a 32-byte (64 hex characters) left-padded value.

**Example:** Encoding `balanceOf(0x1234...5678)`:
```
Selector: 70a08231
Address:  00000000000000000000000012345678901234567890123456789012345678
Full calldata: 0x70a0823100000000000000000000000012345678901234567890123456789012345678
```

#### Parameter Encoding (uint256)

A uint256 is encoded as a 32-byte (64 hex characters) value.

**Example:** Encoding `userInfo(0, 0x1234...5678)`:
```
Selector: 93f1a40b
pid (0):  0000000000000000000000000000000000000000000000000000000000000000
Address:  00000000000000000000000012345678901234567890123456789012345678
Full calldata: 0x93f1a40b000000000000000000000000000000000000000000000000000000000000000000000000000000000000000012345678901234567890123456789012345678
```

### 3.4 Using `cast` (Foundry) for Quick Read-Only Queries

If you have [Foundry](https://book.getfoundry.sh/) installed, you can query contracts from the command line:

```bash
# Check your DTOOLS token balance
cast call 0xB9fcAa7590916578087842e017078D7797Fa18D0 \
  "balanceOf(address)(uint256)" <YOUR_WALLET_ADDRESS> \
  --rpc-url https://rpc.dogechain.dog

# Check staking contract balance (replace with actual staking contract address)
cast call <STAKING_CONTRACT_ADDRESS> \
  "balanceOf(address)(uint256)" <YOUR_WALLET_ADDRESS> \
  --rpc-url https://rpc.dogechain.dog

# Check MasterChef user info
cast call <STAKING_CONTRACT_ADDRESS> \
  "userInfo(uint256,address)(uint256,uint256)" 0 <YOUR_WALLET_ADDRESS> \
  --rpc-url https://rpc.dogechain.dog

# Check pending rewards (Synthetix-style)
cast call <STAKING_CONTRACT_ADDRESS> \
  "earned(address)(uint256)" <YOUR_WALLET_ADDRESS> \
  --rpc-url https://rpc.dogechain.dog

# Check if contract is paused
cast call <STAKING_CONTRACT_ADDRESS> \
  "paused()(bool)" \
  --rpc-url https://rpc.dogechain.dog

# Check contract owner
cast call <STAKING_CONTRACT_ADDRESS> \
  "owner()(address)" \
  --rpc-url https://rpc.dogechain.dog
```

### 3.5 Recording Your Findings

Use this template to document your staked positions:

| Contract Address | Pattern | Function Called | Your Staked Balance | Pending Rewards | Contract Paused? | Owner Renounced? |
|-----------------|---------|----------------|--------------------| --------------- | ----------------- | ----------------- |
| `0x...` | Direct Staking | `balanceOf(addr)` | _______ DTOOLS | _______ DTOOLS | No | Yes |
| `0x...` | MasterChef | `userInfo(0, addr)` | _______ LP tokens | _______ DTOOLS | No | No |
| `0x...` | Synthetix | `earned(addr)` | _______ DTOOLS | _______ DTOOLS | No | Yes |

---

## Section 4: Executing Withdrawal Functions

> ⚠️ **All operations in this section are STATE-CHANGING and will cost gas.** Ensure you have completed the safety checklist in Section 2 before proceeding.

### 4.1 Pattern A: Direct Staking Withdrawal

**Used by:** Simple staking contracts where you deposit tokens and later withdraw them.

**Common function signatures:**
- `withdraw(uint256 amount)` — withdraw a specific amount
- `withdraw()` — withdraw everything
- `unstake(uint256 amount)` — same as withdraw

**ABI snippet:**
```json
[
  {
    "inputs": [{ "name": "amount", "type": "uint256" }],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "amount", "type": "uint256" }],
    "name": "unstake",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]
```

**Step-by-step execution:**

1. **Confirm your staked balance** (from Section 3).
2. **Convert the amount to raw units** — multiply by `10^18`. For example, `5000 DTOOLS` = `5000000000000000000000` (in wei).
3. **Choose your interaction method** (see Section 5 for detailed instructions for each tool).
4. **Call `withdraw(amount)`** with the raw amount.
5. **MetaMask will pop up** — review the transaction details:
   - The "To" address should be the staking contract.
   - The "Value" should be 0 DOGE (you're not sending DOGE, you're calling a function).
   - The "Data" field will contain the encoded function call.
6. **Click "Confirm"** in MetaMask.
7. **Wait for confirmation** — check the block explorer for the transaction receipt.

**Example using `cast` (Foundry):**
```bash
# Withdraw 5000 DTOOLS (raw: 5000 * 10^18)
cast send <STAKING_CONTRACT_ADDRESS> \
  "withdraw(uint256)" 5000000000000000000000 \
  --rpc-url https://rpc.dogechain.dog \
  --private-key <YOUR_PRIVATE_KEY>

# Or withdraw everything if the contract supports withdraw()
cast send <STAKING_CONTRACT_ADDRESS> \
  "withdraw()" \
  --rpc-url https://rpc.dogechain.dog \
  --private-key <YOUR_PRIVATE_KEY>
```

> ⚠️ **Note:** Never expose your private key in a terminal with command history. Use `cast send` with the `--interactive` flag or set up a hardware wallet integration.

### 4.2 Pattern B: MasterChef-style Withdrawal

**Used by:** PancakeSwap/SushiSwap-style farming contracts with multiple pools.

**Common function signatures:**
- `withdraw(uint256 pid, uint256 amount)` — withdraw from a specific pool
- `emergencyWithdraw(uint256 pid)` — withdraw without claiming rewards (emergency)

**ABI snippet:**
```json
[
  {
    "inputs": [
      { "name": "pid", "type": "uint256" },
      { "name": "amount", "type": "uint256" }
    ],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "pid", "type": "uint256" }
    ],
    "name": "emergencyWithdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]
```

#### Determining the Correct Pool ID (pid)

1. Call `poolLength()` on the MasterChef contract to get the total number of pools.
2. For each pool (pid = 0, 1, 2, ...), call `poolInfo(pid)` to see:
   - `lpToken` — the token address accepted by this pool
   - `allocPoint` — the weight of this pool
3. Call `userInfo(pid, <YOUR_WALLET_ADDRESS>)` for each pool where you might have a position.
4. The pool where `amount > 0` is your active pool — note its `pid`.

**Step-by-step execution:**

**Option 1: Normal Withdrawal (claims rewards + withdraws principal)**
```
withdraw(pid, amount)
```
- Use this when the contract has reward tokens available and you want both principal + rewards.
- Example: `withdraw(0, 5000000000000000000000)` — withdraw 5000 tokens from pool 0.

**Option 2: Emergency Withdrawal (withdraws principal only, forfeits rewards)**
```
emergencyWithdraw(pid)
```
- ⚠️ Use this when:
  - The reward token is worthless or the reward pool is depleted.
  - The normal `withdraw()` function reverts.
  - You want the fastest, safest path to recover your principal.
- This function bypasses reward calculations and directly returns your staked tokens.
- Example: `emergencyWithdraw(0)` — withdraw everything from pool 0.

**Example using `cast` (Foundry):**
```bash
# Check pool length first
cast call <MASTERCHEF_ADDRESS> \
  "poolLength()(uint256)" \
  --rpc-url https://rpc.dogechain.dog

# Check your position in pool 0
cast call <MASTERCHEF_ADDRESS> \
  "userInfo(uint256,address)(uint256,uint256)" 0 <YOUR_WALLET_ADDRESS> \
  --rpc-url https://rpc.dogechain.dog

# Normal withdrawal from pool 0
cast send <MASTERCHEF_ADDRESS> \
  "withdraw(uint256,uint256)" 0 5000000000000000000000 \
  --rpc-url https://rpc.dogechain.dog \
  --private-key <YOUR_PRIVATE_KEY>

# Emergency withdrawal from pool 0 (forfeits rewards)
cast send <MASTERCHEF_ADDRESS> \
  "emergencyWithdraw(uint256)" 0 \
  --rpc-url https://rpc.dogechain.dog \
  --private-key <YOUR_PRIVATE_KEY>
```

### 4.3 Pattern C: Synthetix-style Unstaking

**Used by:** Synthetix StakingRewards-style contracts (single-asset staking with reward distribution).

**Common function signatures:**
- `exit()` — unstake everything + claim all rewards in one transaction
- `unstake(uint256 amount)` — withdraw staked tokens
- `withdraw(uint256 amount)` — same as unstake
- `getReward()` — claim rewards without withdrawing principal

**ABI snippet:**
```json
[
  {
    "inputs": [],
    "name": "exit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "amount", "type": "uint256" }],
    "name": "unstake",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getReward",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]
```

**Recommended approach — use `exit()` for full recovery:**

`exit()` is the safest single-call recovery method. It:
1. Unstakes your entire staked balance.
2. Claims all pending rewards.
3. Transfers both to your wallet.

**Step-by-step:**
1. Call `balanceOf(<YOUR_WALLET_ADDRESS>)` on the staking contract to confirm your staked amount.
2. Call `earned(<YOUR_WALLET_ADDRESS>)` to see pending rewards.
3. Execute `exit()` — no parameters needed.

**Example using `cast` (Foundry):**
```bash
# Check staked balance
cast call <STAKING_CONTRACT_ADDRESS> \
  "balanceOf(address)(uint256)" <YOUR_WALLET_ADDRESS> \
  --rpc-url https://rpc.dogechain.dog

# Check earned rewards
cast call <STAKING_CONTRACT_ADDRESS> \
  "earned(address)(uint256)" <YOUR_WALLET_ADDRESS> \
  --rpc-url https://rpc.dogechain.dog

# Execute exit (unstake + claim all)
cast send <STAKING_CONTRACT_ADDRESS> \
  "exit()" \
  --rpc-url https://rpc.dogechain.dog \
  --private-key <YOUR_PRIVATE_KEY>
```

### 4.4 Pattern D: Time-Locked Staking

**Used by:** Contracts with minimum lock periods (e.g., TeamFinance, PinkLock-style lockers).

**Common function signatures:**
- `withdraw(uint256 positionId)` — withdraw a specific locked position
- `withdraw(address token)` — withdraw all unlocked positions for a token
- `emergencyWithdraw()` — bypass lock (if available)

**How to check if your position is still locked:**

1. Call `lockDuration()` or `lockPeriod()` — shows the total lock duration.
2. Call `withdrawalTime(address)` or `unlockTime(address)` — shows when your position unlocks.
3. Compare with the current time (use the block timestamp from the latest block).

**If still locked:**
- ⚠️ You **cannot** withdraw until the lock period expires. No workaround exists on-chain.
- Note the unlock date and set a reminder.

**If lock has expired:**
- Proceed with the `withdraw()` function as normal.

**ABI snippet:**
```json
[
  {
    "inputs": [{ "name": "positionId", "type": "uint256" }],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "token", "type": "address" }],
    "name": "withdrawableAmount",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
]
```

### 4.5 Pattern E: LP Token Withdrawal

**Used by:** Liquidity provision recovery — unstaking LP tokens and removing liquidity from a DEX.

This is a two-step process:

#### Step 1: Unstake LP Tokens from the Farm

If your LP tokens are staked in a farming contract, withdraw them first using Pattern A or Pattern B (depending on the farm type):

- **MasterChef farm:** `withdraw(pid, amount)` or `emergencyWithdraw(pid)`
- **Direct staking:** `withdraw(amount)` or `exit()`

After this step, LP tokens will be in your wallet.

#### Step 2: Remove Liquidity from the DEX Pair

Once LP tokens are in your wallet, remove liquidity to get back the underlying tokens (DTOOLS + WDOGE or other).

**You need the DEX Router contract address** (discover this from the investigation plan).

**Common function signatures on the router:**
- `removeLiquidity(address tokenA, address tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline)`
- `removeLiquidityETH(address token, uint256 liquidity, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline)`

**ABI snippet for `removeLiquidity`:**
```json
[
  {
    "inputs": [
      { "name": "tokenA", "type": "address" },
      { "name": "tokenB", "type": "address" },
      { "name": "liquidity", "type": "uint256" },
      { "name": "amountAMin", "type": "uint256" },
      { "name": "amountBMin", "type": "uint256" },
      { "name": "to", "type": "address" },
      { "name": "deadline", "type": "uint256" }
    ],
    "name": "removeLiquidity",
    "outputs": [
      { "name": "amountA", "type": "uint256" },
      { "name": "amountB", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]
```

**Step-by-step execution:**

1. **Check your LP token balance** — call `balanceOf(<YOUR_WALLET>)` on the LP pair contract.
2. **Approve the router** to spend your LP tokens:
   ```
   Call approve(<ROUTER_ADDRESS>, <LP_TOKEN_AMOUNT>) on the LP pair contract
   ```
   > ⚠️ This is a separate state-changing transaction that must be confirmed first.
3. **Call `removeLiquidity`** on the router contract:
   - `tokenA`: DTOOLS address (`0xB9fcAa7590916578087842e017078D7797Fa18D0`)
   - `tokenB`: The paired token address (e.g., WDOGE)
   - `liquidity`: Your full LP token balance (in raw units)
   - `amountAMin`: Minimum DTOOLS to receive (set to 0 for guaranteed execution, but risks slippage)
   - `amountBMin`: Minimum paired token to receive (set to 0 for guaranteed execution)
   - `to`: Your wallet address
   - `deadline`: A future timestamp (e.g., `9999999999` for far future)

4. **After confirmation**, you'll receive both DTOOLS and the paired token in your wallet.

**Example using `cast` (Foundry):**
```bash
# Step 1: Check LP token balance
cast call <LP_PAIR_ADDRESS> \
  "balanceOf(address)(uint256)" <YOUR_WALLET_ADDRESS> \
  --rpc-url https://rpc.dogechain.dog

# Step 2: Approve router to spend LP tokens
cast send <LP_PAIR_ADDRESS> \
  "approve(address,uint256)" <ROUTER_ADDRESS> 115792089237316195423570985008687907853269984665640564039457584007913129639935 \
  --rpc-url https://rpc.dogechain.dog \
  --private-key <YOUR_PRIVATE_KEY>

# Step 3: Remove liquidity
cast send <ROUTER_ADDRESS> \
  "removeLiquidity(address,address,uint256,uint256,uint256,address,uint256)" \
  0xB9fcAa7590916578087842e017078D7797Fa18D0 \
  <WDOGE_ADDRESS> \
  <LP_TOKEN_AMOUNT> \
  0 0 \
  <YOUR_WALLET_ADDRESS> \
  9999999999 \
  --rpc-url https://rpc.dogechain.dog \
  --private-key <YOUR_PRIVATE_KEY>
```

> ⚠️ **Note:** The `approve` step uses `uint256.max` (`115792089237316195423570985008687907853269984665640564039457584007913129639935`) to avoid needing multiple approvals. If you prefer minimal approval, use your exact LP token amount instead.

---

## Section 5: Direct Contract Interaction Methods

### 5.1 Method 1: Block Explorer "Write Contract" Tab

**Best for:** Simple one-off interactions. No additional tools needed.

#### Step-by-Step

1. **Connect your wallet to the explorer:**
   - Go to `https://explorer.dogechain.dog/`
   - Click **"Connect Wallet"** (usually in the top-right corner)
   - Select **MetaMask** and approve the connection
   - Confirm MetaMask is on the Dogechain network

2. **Navigate to the contract:**
   ```
   https://explorer.dogechain.dog/address/<CONTRACT_ADDRESS>
   ```

3. **Click the "Contract" tab**, then the **"Write Contract"** sub-tab.

4. **Find the withdrawal function** in the list (e.g., `withdraw`, `emergencyWithdraw`, `exit`).

5. **Fill in the parameters:**
   - For `withdraw(uint256 amount)`: Enter the raw amount (e.g., `5000000000000000000000` for 5000 tokens)
   - For `emergencyWithdraw(uint256 pid)`: Enter the pool ID (e.g., `0`)
   - For `exit()`: No parameters needed

6. **Click "Write"** — MetaMask will pop up with a transaction confirmation.

7. **Review the transaction in MetaMask:**
   - Verify the "To" address matches the staking contract
   - Verify the value is 0 DOGE (unless the function requires sending DOGE)
   - Check the gas estimate

8. **Click "Confirm"** in MetaMask.

9. **Wait for the transaction to be mined** — the explorer will show a success/failure status.

> ⚠️ **Important:** The "Write Contract" tab only appears for **verified contracts**. If the contract is unverified, you'll need to use Method 2, 3, or 4.

### 5.2 Method 2: Remix IDE

**Best for:** Unverified contracts, complex interactions, or when you need full control over the ABI.

#### Step-by-Step

1. **Open Remix IDE:** `https://remix.ethereum.org/`

2. **Create a new file** in the "File Explorer" panel (e.g., `DtoolsStaking.sol`).

3. **Paste a minimal interface** for the contract you want to interact with:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Minimal interface for DTOOLS staking interaction
interface IDtoolsStaking {

    // Read functions
    function balanceOf(address account) external view returns (uint256);
    function earned(address account) external view returns (uint256);
    function stakingToken() external view returns (address);
    function rewardsToken() external view returns (address);
    function totalSupply() external view returns (uint256);
    function owner() external view returns (address);
    function paused() external view returns (bool);

    // Write functions
    function withdraw(uint256 amount) external;
    function unstake(uint256 amount) external;
    function getReward() external;
    function exit() external;
}

// MasterChef-style interface
interface IMasterChef {
    function poolLength() external view returns (uint256);
    function poolInfo(uint256 pid) external view returns (
        address lpToken,
        uint256 allocPoint,
        uint256 lastRewardBlock,
        uint256 accRewardPerShare
    );
    function userInfo(uint256 pid, address user) external view returns (
        uint256 amount,
        uint256 rewardDebt
    );
    function pendingRewards(uint256 pid, address user) external view returns (uint256);
    function deposit(uint256 pid, uint256 amount) external;
    function withdraw(uint256 pid, uint256 amount) external;
    function emergencyWithdraw(uint256 pid) external;
}

// ERC-20 interface for approvals
interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
}
```

4. **Compile the file:**
   - Go to the "Solidity Compiler" tab (left sidebar).
   - Click **"Compile DtoolsStaking.sol"**.

5. **Deploy/Interact:**
   - Go to the "Deploy & Run Transactions" tab.
   - Set **"Environment"** to **"Injected Provider - MetaMask"**.
   - MetaMask will prompt to connect — approve it.
   - Ensure MetaMask is on the **Dogechain** network.
   - Under **"At Address"** (below the Deploy button), paste the contract address.
   - Click **"At Address"**.

6. **The contract interface will appear** in the "Deployed Contracts" section at the bottom.

7. **Call read functions** (blue buttons) to verify the state:
   - Expand the contract → click `balanceOf` → enter your address → click "call".
   - Click `earned` → enter your address → click "call".

8. **Execute write functions** (orange buttons):
   - Click `withdraw` → enter the amount in wei → click "transact".
   - Or click `exit` → click "transact" (no parameters).
   - MetaMask will pop up — confirm the transaction.

> ⚠️ **Note:** Remix uses `Injected Provider` which connects through MetaMask. All transactions go through MetaMask's confirmation flow, giving you a safety checkpoint.

### 5.3 Method 3: MetaMask Direct Interaction (Custom RPC via Browser Console)

**Best for:** Advanced users comfortable with browser developer tools.

#### Step-by-Step

1. **Open MetaMask** and ensure you're on the Dogechain network.

2. **Open your browser's Developer Console** (F12 or Ctrl+Shift+I → Console tab).

3. **Ensure MetaMask is injected** — type:
   ```javascript
   ethereum.isMetaMask
   // Should return: true
   ```

4. **Encode the function call manually.** For example, to call `withdraw(5000 * 10^18)`:

   The function selector for `withdraw(uint256)` is `0x2e1a7d4d`.

   The amount `5000 * 10^18` in hex is `0x10F0CF064DD59200000000` — but it's easier to use a helper:

   ```javascript
   // Withdraw 5000 tokens (18 decimals)
   const amount = BigInt("5000000000000000000000").toString(16).padStart(64, '0');
   const data = "0x2e1a7d4d" + amount;

   const txParams = {
     to: "<STAKING_CONTRACT_ADDRESS>",
     from: ethereum.selectedAddress,
     data: data,
     value: "0x0"
   };

   ethereum.request({ method: "eth_sendTransaction", params: [txParams] })
     .then(txHash => console.log("TX Hash:", txHash))
     .catch(err => console.error("Error:", err));
   ```

5. **MetaMask will pop up** — review and confirm.

> ⚠️ **Warning:** This method requires manual function encoding and is error-prone. Prefer Method 1 or 2 unless you're experienced with ABI encoding.

### 5.4 Method 4: Command Line (cast from Foundry)

**Best for:** Advanced users, automation, and scripting.

#### Installation

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
source ~/.zshrc  # or ~/.bashrc
foundryup
```

#### Read-Only Queries

```bash
# Set the RPC URL
export RPC_URL="https://rpc.dogechain.dog"

# Check DTOOLS balance
cast call 0xB9fcAa7590916578087842e017078D7797Fa18D0 \
  "balanceOf(address)(uint256)" <YOUR_WALLET_ADDRESS> \
  --rpc-url $RPC_URL

# Check staked balance
cast call <STAKING_CONTRACT> \
  "balanceOf(address)(uint256)" <YOUR_WALLET_ADDRESS> \
  --rpc-url $RPC_URL

# Check earned rewards
cast call <STAKING_CONTRACT> \
  "earned(address)(uint256)" <YOUR_WALLET_ADDRESS> \
  --rpc-url $RPC_URL
```

#### State-Changing Transactions

```bash
# Withdraw tokens (interactive private key input)
cast send <STAKING_CONTRACT> \
  "withdraw(uint256)" 5000000000000000000000 \
  --rpc-url $RPC_URL \
  --interactive

# Emergency withdraw from MasterChef pool 0
cast send <MASTERCHEF_CONTRACT> \
  "emergencyWithdraw(uint256)" 0 \
  --rpc-url $RPC_URL \
  --interactive

# Exit (Synthetix-style)
cast send <STAKING_CONTRACT> \
  "exit()" \
  --rpc-url $RPC_URL \
  --interactive
```

> ⚠️ **Security:** The `--interactive` flag prompts for your private key securely. Alternatively, use `--ledger` or `--trezor` for hardware wallet signing. **Never hardcode your private key in scripts.**

### 5.5 Method 5: Custom ethers.js Script

**Best for:** Programmatic interaction, batch operations, or when you need more control.

#### Prerequisites

```bash
mkdir dtools-recovery && cd dtools-recovery
npm init -y
npm install ethers@5.7.2
```

#### Recovery Script Template

Create `recover.js`:

```javascript
const { ethers } = require("ethers");

// ============================================
// CONFIGURATION — UPDATE THESE VALUES
// ============================================
const RPC_URL = "https://rpc.dogechain.dog";
const DTOOLS_TOKEN = "0xB9fcAa7590916578087842e017078D7797Fa18D0";
const STAKING_CONTRACT = "0x________________________________"; // From investigation
const YOUR_WALLET_ADDRESS = "0x________________________________";

// Private key — NEVER commit this to git or share it
// Read from environment variable for safety
const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
  console.error("Error: Set PRIVATE_KEY environment variable");
  console.error("Usage: PRIVATE_KEY=0x... node recover.js");
  process.exit(1);
}

// ============================================
// ABI DEFINITIONS
// ============================================
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

const STAKING_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function earned(address) view returns (uint256)",
  "function withdraw(uint256 amount)",
  "function exit()",
  "function getReward()",
  "function owner() view returns (address)",
  "function paused() view returns (bool)",
  "function stakingToken() view returns (address)",
  "function rewardsToken() view returns (address)"
];

const MASTERCHEF_ABI = [
  "function poolLength() view returns (uint256)",
  "function userInfo(uint256 pid, address user) view returns (uint256 amount, uint256 rewardDebt)",
  "function pendingRewards(uint256 pid, address user) view returns (uint256)",
  "function withdraw(uint256 pid, uint256 amount)",
  "function emergencyWithdraw(uint256 pid)"
];

// ============================================
// MAIN SCRIPT
// ============================================
async function main() {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log("=== DTOOLS Recovery Script ===");
  console.log(`Wallet: ${wallet.address}`);
  console.log(`Network: ${(await provider.getNetwork()).name} (Chain ID: ${(await provider.getNetwork()).chainId})`);
  console.log("");

  // Step 1: Check wallet DOGE balance (for gas)
  const dogeBalance = await provider.getBalance(wallet.address);
  console.log(`DOGE Balance (for gas): ${ethers.utils.formatEther(dogeBalance)} DOGE`);

  if (dogeBalance.eq(0)) {
    console.error("⚠️  No DOGE for gas! Send DOGE to your wallet first.");
    process.exit(1);
  }

  // Step 2: Check DTOOLS token balance in wallet
  const dtoolsToken = new ethers.Contract(DTOOLS_TOKEN, ERC20_ABI, provider);
  const walletDtoolsBalance = await dtoolsToken.balanceOf(wallet.address);
  const decimals = await dtoolsToken.decimals();
  console.log(`DTOOLS in wallet: ${ethers.utils.formatUnits(walletDtoolsBalance, decimals)}`);

  // Step 3: Check staking contract
  const staking = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, provider);

  // Check if contract is paused
  let isPaused = false;
  try {
    isPaused = await staking.paused();
    console.log(`Contract paused: ${isPaused}`);
  } catch (e) {
    console.log("Contract paused: Function not found (likely not pausable)");
  }

  // Check owner
  try {
    const owner = await staking.owner();
    const isRenounced = owner === "0x0000000000000000000000000000000000000000";
    console.log(`Contract owner: ${isRenounced ? "RENOUNCED ✅" : owner + " ⚠️"}`);
  } catch (e) {
    console.log("Contract owner: Function not found");
  }

  // Check staked balance
  const stakedBalance = await staking.balanceOf(wallet.address);
  console.log(`Staked balance: ${ethers.utils.formatUnits(stakedBalance, decimals)}`);

  // Check earned rewards
  try {
    const rewards = await staking.earned(wallet.address);
    console.log(`Pending rewards: ${ethers.utils.formatUnits(rewards, decimals)}`);
  } catch (e) {
    console.log("Pending rewards: Function not found");
  }

  // Step 4: Execute withdrawal
  if (stakedBalance.eq(0)) {
    console.log("\n⚠️  No staked balance found. Nothing to withdraw.");
    return;
  }

  if (isPaused) {
    console.error("\n🔴 Contract is PAUSED. Cannot withdraw.");
    return;
  }

  console.log("\n--- Executing exit() to withdraw all + claim rewards ---");

  const stakingWithSigner = staking.connect(wallet);
  const tx = await stakingWithSigner.exit();
  console.log(`Transaction sent! Hash: ${tx.hash}`);
  console.log("Waiting for confirmation...");

  const receipt = await tx.wait();
  console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
  console.log(`   Status: ${receipt.status === 1 ? "SUCCESS ✅" : "FAILED ❌"}`);
  console.log(`   Gas used: ${receipt.gasUsed.toString()}`);

  // Step 5: Verify new balance
  const newBalance = await dtoolsToken.balanceOf(wallet.address);
  console.log(`\nNew DTOOLS wallet balance: ${ethers.utils.formatUnits(newBalance, decimals)}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error.message || error);
    process.exit(1);
  });
```

#### Running the Script

```bash
# Set your private key as an environment variable (safer than hardcoding)
export PRIVATE_KEY=0x________________________________

# Run the script
node recover.js
```

> ⚠️ **Security:** Never commit your private key to version control. Add `.env` to `.gitignore`. Consider using [dotenv](https://www.npmjs.com/package/dotenv) for environment variable management.

---

## Section 6: Post-Recovery Actions

### 6.1 Verify Tokens Received

After executing a withdrawal transaction:

1. **Check the transaction on the block explorer:**
   - Find your transaction hash (from MetaMask activity or the tool output).
   - Navigate to: `https://explorer.dogechain.dog/tx/<TX_HASH>`
   - Verify the status is **"Success"** (green).
   - Check the **"Token Transfers"** section in the transaction details — it should show a transfer of DTOOLS from the staking contract to your wallet.

2. **Check your wallet balance:**
   - Open MetaMask.
   - If DTOOLS doesn't appear automatically, see Section 6.2.
   - Use the block explorer to verify: `https://explorer.dogechain.dog/address/<YOUR_WALLET_ADDRESS>`

3. **Verify the received amount matches expectations:**
   - Compare the received amount with the `balanceOf()` result from Section 3.
   - Account for any withdrawal fees (some contracts charge a fee on withdrawal).

### 6.2 Add DTOOLS as a Custom Token in MetaMask

If DTOOLS doesn't show up in MetaMask after recovery:

1. Open MetaMask.
2. Go to the **"Tokens"** tab.
3. Click **"Import tokens"** at the bottom.
4. Click **"Custom token"**.
5. Enter:
   - **Token Contract Address:** `0xB9fcAa7590916578087842e017078D7797Fa18D0`
   - **Token Symbol:** `DTOOLS` (should auto-fill)
   - **Token Decimal:** `18` (should auto-fill)
6. Click **"Add custom token"**.
7. Confirm by clicking **"Import tokens"**.

Your DTOOLS balance should now be visible in MetaMask.

### 6.3 Swap DTOOLS for Other Tokens (Optional)

If you want to convert DTOOLS to DOGE or another token:

1. **Identify the DEX router** (from the investigation plan — typically a DogeSwap or Uniswap V2 fork router).

2. **Approve the router** to spend your DTOOLS:
   - Go to the DTOOLS token contract on the explorer → "Write Contract" tab.
   - Call `approve(spender, amount)`:
     - `spender`: The DEX router address
     - `amount`: Your DTOOLS balance (or `uint256.max`)

3. **Execute the swap** via the router's `swapExactTokensForTokens` or `swapExactTokensForETH`:
   - On the explorer's "Write Contract" tab for the router.
   - Or use the DEX front-end if available.

> ⚠️ **Warning:** Check the LP pool reserves before swapping. If reserves are very low, you'll get extreme slippage (very few tokens in return). Call `getReserves()` on the LP pair contract to check.

### 6.4 Verify Transaction Success on the Block Explorer

For any transaction:

1. Navigate to: `https://explorer.dogechain.dog/tx/<TX_HASH>`
2. Check:
   - **Status:** Should be "Success" ✅
   - **Block:** The block number where it was included
   - **From:** Your wallet address
   - **To:** The contract you interacted with
   - **Value:** 0 DOGE (for contract calls)
   - **Gas Used:** The actual gas consumed
   - **Events/Logs:** Should contain transfer events showing tokens moving to your wallet

3. If status is **"Fail"** — see Section 7 for troubleshooting.

---

## Section 7: Troubleshooting Common Issues

### 7.1 Transaction Reverted

**Symptom:** MetaMask shows "Transaction reverted" or the block explorer shows "Fail" status.

**Common causes and solutions:**

| Cause | How to Identify | Solution |
|-------|----------------|----------|
| **Contract is paused** | Call `paused()` — returns `true` | Cannot withdraw until owner calls `unpause()`. Try `emergencyWithdraw()` if available. |
| **Insufficient staked balance** | You're trying to withdraw more than you have | Call `balanceOf()` or `userInfo()` to check actual balance. Withdraw exact amount. |
| **Wrong pool ID** | `userInfo(pid, addr)` shows 0 for that pid | Try different pool IDs (0, 1, 2, ...) to find your position. |
| **Time lock not expired** | `unlockTime()` > current time | Wait until the lock expires. No workaround. |
| **Withdrawal fee exceeds balance** | Contract has a fee that makes net withdrawal 0 | Check for `withdrawalFee()` or `feeRate()`. |
| **Blacklisted address** | Contract has `blacklist()` functionality | Check if your address is blacklisted. If so, no workaround on-chain. |
| **Reward token depleted** | Normal `withdraw()` tries to claim rewards but pool is empty | Use `emergencyWithdraw()` instead (forfeits rewards, returns principal). |

### 7.2 "Execution Reverted" / "Gas Estimation Failed"

**Symptom:** MetaMask cannot estimate gas and shows an error before you can confirm.

**What it means:** The transaction would fail if submitted. MetaMask simulates the transaction first and detects it would revert.

**Solutions:**

1. **Double-check your parameters** — ensure the amount is correct and in the right format (raw wei units, not human-readable).
2. **Try a different function** — if `withdraw()` fails, try `emergencyWithdraw()`.
3. **Check if the contract is paused** — call `paused()`.
4. **Verify the contract has tokens** — call `balanceOf(<CONTRACT>)` on the DTOOLS token contract.
5. **Try with a smaller amount** — some contracts have maximum withdrawal limits.

### 7.3 Insufficient Gas / Out of Gas

**Symptom:** Transaction shows "Out of gas" on the block explorer.

**Solutions:**

1. **Ensure you have enough DOGE** — check your native DOGE balance in MetaMask.
2. **Increase the gas limit manually** — in MetaMask, click "Edit" → "Gas limit" and set it higher (e.g., 300,000).
3. **Dogechain gas is very cheap** — this error is rare on Dogechain but can happen with complex contracts.

### 7.4 Contract Appears to Have No Withdraw Function

**Symptom:** The verified contract source (or bytecode analysis) shows no `withdraw`, `exit`, `emergencyWithdraw`, or `unstake` function.

**Possible explanations:**

| Scenario | What It Means | Action |
|----------|--------------|--------|
| **Rug pull** | The contract was designed to only accept deposits | Funds are likely unrecoverable. Document for legal action. |
| **Proxy contract** | The actual logic is in an implementation contract | Find the implementation address and check there. |
| **Migration** | Withdrawals moved to a new contract | Look for a `migrate()` or `newStaking()` function/address. |
| **Hidden function** | Function name is non-standard | Analyze all write functions in the ABI. Look for `claim()`, `retrieve()`, `sweep()`, etc. |

### 7.5 Withdrawal Function Exists but Reverts

**Symptom:** The function exists and you have a balance, but every call reverts.

**Diagnostic steps:**

1. **Call `paused()`** — if `true`, the owner has paused withdrawals.
2. **Call `owner()`** — if not renounced, the owner controls the contract.
3. **Check the contract's token balance** — if 0, the contract has been drained.
4. **Look for `blacklist(address)`** — call it with your address to check.
5. **Check for `withdrawalEnabled()`** — some contracts have an explicit withdrawal toggle.
6. **Try `emergencyWithdraw()`** — this function often bypasses normal checks.

### 7.6 Tokens Show 0 Balance in Contract

**Symptom:** You had tokens staked, but `balanceOf(<CONTRACT>)` on the token contract shows 0.

**Possible explanations:**

| Scenario | Evidence | Action |
|----------|----------|--------|
| **Contract was drained by owner** | `owner()` is active, and a `sweepFunds()` or `withdrawTo()` tx exists | Funds stolen — document for legal action. |
| **Tokens were migrated** | A `migrate()` function was called, tokens moved to new contract | Find the new contract and check your balance there. |
| **Tokens were stolen via exploit** | Large unauthorized withdrawal in transaction history | Funds likely unrecoverable. |
| **You're checking the wrong contract** | Your tokens are in a different contract | Re-check your transfer history to find the correct contract. |

---

## Section 8: Emergency Scenarios

### 8.1 Scenario: Contract Has `emergencyWithdraw`

**When to use:** The normal `withdraw()` function reverts, the contract is behaving unexpectedly, or you want the fastest possible recovery.

**What it does:**
- Withdraws your entire staked principal.
- **Forfeits all pending rewards** (you don't get rewards).
- Bypasses many internal checks that `withdraw()` performs.
- Usually always works as long as the contract holds your tokens.

**How to execute:**

**MasterChef-style:**
```
emergencyWithdraw(uint256 pid)
```
- Parameter: The pool ID where your tokens are staked.
- Example: `emergencyWithdraw(0)` — emergency withdraw from pool 0.

**Direct staking style:**
```
emergencyWithdraw()
```
- No parameters needed.

**Steps:**
1. Confirm your staked balance one more time (read-only call).
2. Confirm the contract holds enough tokens to cover your balance.
3. Execute `emergencyWithdraw()`.
4. Verify tokens arrive in your wallet.

> ⚠️ **Note:** `emergencyWithdraw` is the **safest fallback** for recovery. If it exists and the contract holds tokens, it should work regardless of reward pool status.

### 8.2 Scenario: Ownership Not Renounced — Owner Can Pause

**Risk:** If the contract's `owner()` returns a non-zero address, the owner can:
- Call `pause()` to block all withdrawals.
- Call `sweepFunds()` or `rescueTokens()` to drain the contract.
- Call `setWithdrawalFee(10000)` to set a 100% withdrawal fee.

**What to do:**

1. **Act quickly** — if the owner is still active, they could drain the contract at any time.
2. **Check the owner's recent activity** — look at the owner address on the block explorer. If they haven't transacted in months, the risk is lower.
3. **Prioritize withdrawal** — withdraw your funds as soon as possible.
4. **Consider using a private transaction** — if Dogechain supports private mempools (like Flashbots), use them to prevent the owner from front-running your withdrawal.
5. **Document everything** — if the owner drains the contract before you withdraw, record all addresses and transactions for potential legal action.

### 8.3 Scenario: Contract Has Been Drained or Migrated

**How to verify:**

1. Call `balanceOf(<STAKING_CONTRACT>)` on the DTOOLS token contract.
2. If the balance is 0 or near-0, the contract has been drained.
3. Check the contract's transaction history for large outgoing transfers.

**If drained:**
- Your tokens have been moved out of the contract by someone (likely the owner or an exploit).
- **On-chain recovery is impossible** — the tokens are no longer in the contract.
- Document all evidence for potential legal/regulatory action:
  - Contract address
  - Draining transaction hash
  - Destination address
  - Timestamp and block number
  - Owner address (if relevant)

**If migrated:**
1. Look for a `newContract()` or `migrationTarget()` function on the old contract.
2. Check if there's a `migrate()` or `claimFromOld()` function on the new contract.
3. If a migration exists, follow the migration instructions to claim your tokens from the new contract.

### 8.4 Scenario: When to Give Up

**Unfortunately, not all funds are recoverable.** You should stop attempting recovery if:

| Condition | Reason |
|-----------|--------|
| Contract has 0 token balance | No tokens to recover |
| Contract is paused with active owner who is unresponsive | Owner controls access |
| Contract self-destructed (`selfdestruct` was called) | Contract no longer exists on-chain |
| Your address is permanently blacklisted | No bypass exists |
| All withdrawal functions revert with no workaround | Contract logic prevents withdrawal |
| The cost of gas exceeds the value of recoverable tokens | Economically unviable |

**What to do instead:**

1. **Document everything** — create a comprehensive record:
   - All contract addresses
   - Your wallet address
   - Amount staked
   - Transaction hashes of deposits
   - Evidence of the contract being drained/paused/abandoned
   - Owner/deployer addresses

2. **Report to the community** — post in Dogechain community channels (Discord, Telegram, Twitter) to warn others and find if other users are affected.

3. **Consider legal action** — if the amount is significant, consult with a crypto-focused attorney. The on-chain evidence (public blockchain records) can support legal claims.

4. **Tax implications** — in many jurisdictions, unrecoverable/stolen crypto may be claimable as a capital loss for tax purposes. Consult a tax professional.

---

## Appendix: Quick Reference Card

### Key Addresses

| Label | Address |
|-------|---------|
| DTOOLS Token | `0xB9fcAa7590916578087842e017078D7797Fa18D0` |
| Block Explorer | `https://explorer.dogechain.dog/` |
| Dogechain RPC | `https://rpc.dogechain.dog` |
| Chain ID | `2000` |
| Native Token | `DOGE` |

### Common Function Selectors

```
# Withdrawal functions (state-changing)
withdraw(uint256)              → 0x2e1a7d4d
withdraw()                     → 0x3ccfd60b
withdraw(uint256,uint256)      → 0x2195995c
unstake(uint256)               → 0x2e1a7d4d
emergencyWithdraw(uint256)     → 0xd9caed12
emergencyWithdraw()            → 0x5ae62c0b
exit()                         → 0xe9fad8ee
getReward()                    → 0xdf82c287

# Read-only query functions
balanceOf(address)             → 0x70a08231
earned(address)                → 0x008cc262
pendingRewards(address)        → 0x6cf6d7b8
userInfo(uint256,address)      → 0x93f1a40b
poolInfo(uint256)              → 0x1526fe27
poolLength()                   → 0x081e3eda
totalSupply()                  → 0x18160ddd
owner()                        → 0x8da5cb5b
paused()                       → 0x5c975abb

# Token functions
approve(address,uint256)       → 0x095ea7b3
transfer(address,uint256)      → 0xa9059cbb
allowance(address,address)     → 0xdd62ed3e

# DEX functions
removeLiquidity(...)           → 0x2195995c
removeLiquidityETH(...)        → 0x02751cec
swapExactTokensForTokens(...)  → 0x38ed1739
```

### Recovery Priority Order

1. 🟢 **Read-only queries first** — confirm balances and contract status (Section 3)
2. 🟡 **Try `emergencyWithdraw()`** — safest withdrawal if available (Section 8.1)
3. 🟡 **Try `exit()`** — full withdrawal + rewards for Synthetix-style (Section 4.3)
4. 🟡 **Try `withdraw(amount)`** — standard withdrawal (Section 4.1)
5. 🟡 **Try `withdraw(pid, amount)`** — MasterChef withdrawal (Section 4.2)
6. 🔴 **LP token recovery** — more complex, multiple steps (Section 4.5)

### Emergency Checklist

```
Before any withdrawal:
  [ ] Dogechain connected in MetaMask (Chain ID: 2000)
  [ ] Sufficient DOGE for gas (> 0.1 DOGE recommended)
  [ ] Contract address verified through investigation
  [ ] Contract not paused (paused() = false)
  [ ] Contract holds tokens (balanceOf(contract) > 0)
  [ ] Your staked balance confirmed (balanceOf(yourAddress) > 0)
  [ ] Read through all safety checks in Section 2

After withdrawal:
  [ ] Transaction confirmed on block explorer (Status: Success)
  [ ] Tokens received in wallet (check balanceOf)
  [ ] DTOOLS visible in MetaMask (import if needed)
```

---

*This guide is for informational purposes only. Interacting with smart contracts carries inherent risks. Always verify contract behavior before executing transactions. The authors are not responsible for any loss of funds resulting from the use of this guide.*
