# DTOOLS Staking Recovery — Personalized Action Plan

> **Purpose:** Step-by-step, copy-paste-ready guide to recover your staked DTOOLS tokens from the staking contract on Dogechain.
>
> **Status:** Front-end is down. All interactions must be done directly with the smart contracts.
>
> **Last Updated:** 2026-05-08

---

## 1. Your Contract Map

| Contract | Address | Explorer Link |
|----------|---------|---------------|
| **Staking Contract** | `0x7cc5fb5a99e51b2748a3ee2313e18f4f65b62416` | [View on Explorer](https://explorer.dogechain.dog/address/0x7cc5fb5a99e51b2748a3ee2313e18f4f65b62416) |
| **DTOOLS Token** | `0xB9fcAa7590916578087842e017078D7797Fa18D0` | [View on Explorer](https://explorer.dogechain.dog/address/0xB9fcAa7590916578087842e017078D7797Fa18D0) |
| **LP Pair (DTOOLS/WWDOGE)** | `0xd552a0d629a5188058e67239bd0e5afead755cd5` | [View on Explorer](https://explorer.dogechain.dog/address/0xd552a0d629a5188058e67239bd0e5afead755cd5) |
| **UniswapV2 Router** | `0xa4ee06ce40cb7e8c04e127c1f7d3dfb7f7039c81` | [View on Explorer](https://explorer.dogechain.dog/address/0xa4ee06ce40cb7e8c04e127c1f7d3dfb7f7039c81) |
| **Contract Owner** | `0x1d89c0bdab6778ecceba84222620189bcd76eaa4` | [View on Explorer](https://explorer.dogechain.dog/address/0x1d89c0bdab6778ecceba84222620189bcd76eaa4) |
| **Deployer** | `0x42257a44e6c9963576190bffd8d8065d5e28176a` | [View on Explorer](https://explorer.dogechain.dog/address/0x42257a44e6c9963576190bffd8d8065d5e28176a) |
| **Marketing Wallet** | `0xf257d3376f442a6eef3f482782855d07eeeda8a8` | [View on Explorer](https://explorer.dogechain.dog/address/0xf257d3376f442a6eef3f482782855d07eeeda8a8) |
| **WWDOGE (Wrapped DOGE)** | `0xb7ddc6414bf4f5515b52d8bdd69973ae205ff101` | [View on Explorer](https://explorer.dogechain.dog/address/0xb7ddc6414bf4f5515b52d8bdd69973ae205ff101) |

### Staking Contract Parameters (as of investigation date)

| Parameter | Value |
|-----------|-------|
| Total Staked | ~10,743,317 DTOOLS |
| Rewards Remaining | ~4,588,510 DTOOLS |
| APY | 5% |
| Lock Period | 1 second (effectively no lock) |
| Exit Penalty | 10% |
| Staking Type | Single-sided (DTOOLS → DTOOLS) |

---

## 2. Step 1: Check Your Staked Balance

### Option A: Using `curl` (Terminal)

Replace `YOUR_WALLET_ADDRESS` with your actual wallet address. The address must be padded to 32 bytes (64 hex characters) with leading zeros.

```bash
# Example: if your address is 0xABC123..., the padded version is:
# 0x000000000000000000000000abc123... (64 hex chars after 0x)

# Step 1: Build the padded address
# Remove "0x" from your address, then left-pad with zeros to 64 characters

# Step 2: Query the contract
# Replace YOUR_PADDED_ADDRESS below with your 66-character hex string (0x + 64 chars)
curl -s -X POST "https://rpc.dogechain.dog/" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"0x7cc5fb5a99e51b2748a3ee2313e18f4f65b62416","data":"0x1959a002YOUR_PADDED_ADDRESS"},"latest"],"id":1}'
```

**Concrete example** (replace the address with yours):

```bash
# For wallet 0x1d89c0bdab6778ecceba84222620189bcd76eaa4:
curl -s -X POST "https://rpc.dogechain.dog/" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"0x7cc5fb5a99e51b2748a3ee2313e18f4f65b62416","data":"0x1959a0020000000000000000000000001d89c0bdab6778ecceba84222620189bcd76eaa4"},"latest"],"id":1}'
```

### Decode the Response

The response will look like:
```json
{"jsonrpc":"2.0","id":1,"result":"0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"}
```

**Decode with Python:**

```python
# Paste the "result" value from the JSON response:
result = "0xPASTE_RESULT_HERE"

# userInfo returns 3 values: amount, rewardDebt, lastDepositTime (each 32 bytes = 64 hex chars)
data = bytes.fromhex(result[2:])  # strip 0x
amount = int.from_bytes(data[0:32], 'big')
reward_debt = int.from_bytes(data[32:64], 'big')
last_deposit_time = int.from_bytes(data[64:96], 'big')

print(f"Staked Amount: {amount / 1e18:.6f} DTOOLS")
print(f"Reward Debt: {reward_debt / 1e18:.6f}")
print(f"Last Deposit Time: {last_deposit_time} (Unix timestamp)")
```

### Option B: Using Block Explorer (Easier)

1. Go to: [Read Contract](https://explorer.dogechain.dog/address/0x7cc5fb5a99e51b2748a3ee2313e18f4f65b62416/read-contract)
2. Find the **`userInfo`** function
3. Enter your wallet address in the `_user` field
4. Click **"Query"**
5. Read the `amount` field — that's your staked balance in wei (divide by 10¹⁸ for DTOOLS)

---

## 3. Step 2: Check Pending Rewards

### Option A: Using `curl`

```bash
# pendingReward(address) — function selector: 0x9a21d922
curl -s -X POST "https://rpc.dogechain.dog/" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"0x7cc5fb5a99e51b2748a3ee2313e18f4f65b62416","data":"0x9a21d922YOUR_PADDED_ADDRESS"},"latest"],"id":1}'
```

**Decode with Python:**

```python
result = "0xPASTE_RESULT_HERE"
rewards = int(result, 16)
print(f"Pending Rewards: {rewards / 1e18:.6f} DTOOLS")
```

### Option B: Using Block Explorer

1. Go to: [Read Contract](https://explorer.dogechain.dog/address/0x7cc5fb5a99e51b2748a3ee2313e18f4f65b62416/read-contract)
2. Find the **`pendingReward`** function
3. Enter your wallet address in the `_user` field
4. Click **"Query"**
5. The result is your unclaimed rewards in wei (divide by 10¹⁸ for DTOOLS)

### Also Check: Global Contract State

```bash
# totalStaked() — function selector: 0x817b1cd2
curl -s -X POST "https://rpc.dogechain.dog/" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"0x7cc5fb5a99e51b2748a3ee2313e18f4f65b62416","data":"0x817b1cd2"},"latest"],"id":1}'

# rewardsRemaining() — function selector: 0x38fff2d0
curl -s -X POST "https://rpc.dogechain.dog/" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"0x7cc5fb5a99e51b2748a3ee2313e18f4f65b62416","data":"0x38fff2d0"},"latest"],"id":1}'
```

---

## 4. Step 3: Configure MetaMask for Dogechain

### 4.1 Add Dogechain Network

1. Open MetaMask → click the **network selector** (top-left)
2. Click **"Add network"** → **"Add a network manually"**
3. Enter these exact values:

| Field | Value |
|-------|-------|
| **Network Name** | `Dogechain` |
| **New RPC URL** | `https://rpc.dogechain.dog/` |
| **Chain ID** | `2000` |
| **Currency Symbol** | `DOGE` |
| **Block Explorer URL** | `https://explorer.dogechain.dog/` |

4. Click **"Save"**
5. MetaMask should auto-switch to Dogechain

**Alternative RPC URLs** (if primary is down):

| RPC URL | Provider |
|---------|----------|
| `https://rpc01.dogechain.dog` | Backup 1 |
| `https://rpc02.dogechain.dog` | Backup 2 |
| `https://rpc03-sgp.dogechain.dog` | Singapore Node |
| `https://dogechain.ankr.com` | Ankr Public |

### 4.2 Add DTOOLS as a Custom Token

1. In MetaMask on Dogechain network, click **"Import tokens"**
2. Click **"Custom token"**
3. Enter:

| Field | Value |
|-------|-------|
| **Token Contract Address** | `0xB9fcAa7590916578087842e017078D7797Fa18D0` |
| **Token Symbol** | `DTOOLS` (should auto-fill) |
| **Token Decimal** | `18` (should auto-fill) |

4. Click **"Add custom token"** → **"Import token"**
5. Your DTOOLS balance (if any in your wallet, not staked) will now appear

### 4.3 Ensure You Have Gas

> ⚠️ **You need native DOGE in your wallet to pay gas for the withdrawal transaction.**

- Check your DOGE balance in MetaMask
- If balance is 0, send DOGE from an exchange or another wallet to your address
- Typical withdrawal gas cost: **~0.01–0.1 DOGE** (very cheap)
- Keep a buffer of at least **1 DOGE** to be safe

---

## 5. Step 4: Withdraw via Block Explorer "Write Contract"

> ✅ **Recommended method — easiest and safest. No private key needed.**

### 5.1 Navigate to the Write Contract Page

Go to: **[https://explorer.dogechain.dog/address/0x7cc5fb5a99e51b2748a3ee2313e18f4f65b62416/write-contract](https://explorer.dogechain.dog/address/0x7cc5fb5a99e51b2748a3ee2313e18f4f65b62416/write-contract)**

### 5.2 Connect MetaMask

1. Click **"Connect to Web3"** (top-right of the Write Contract section)
2. Select **MetaMask**
3. Confirm the connection in the MetaMask popup
4. Ensure MetaMask is on the **Dogechain** network

### 5.3 Execute `withdraw()`

1. Scroll down to find the **`withdraw`** function
2. `withdraw()` takes **no parameters** — it withdraws your entire staked position
3. Click **"Write"**
4. MetaMask will pop up — review the transaction:
   - **To:** `0x7cc5fb5a99e51b2748a3ee2313e18f4f65b62416`
   - **Value:** 0 DOGE
   - **Data:** function selector for `withdraw()`
5. Click **"Confirm"** in MetaMask
6. Wait for the transaction to be confirmed on-chain
7. Check the transaction hash in the explorer to verify success

### 5.4 What `withdraw()` Does

- Withdraws your **entire staked amount** (minus 10% penalty)
- Claims any **pending rewards**
- You receive: **90% of your staked amount + pending rewards** (both in DTOOLS)

### 5.5 Alternative: `emergencyWithdraw()`

Use this **only if** the regular `withdraw()` function fails or reverts.

1. On the same Write Contract page, find **`emergencyWithdraw`**
2. Click **"Write"** and confirm in MetaMask
3. This withdraws your staked tokens **without claiming rewards**

> ⚠️ **`emergencyWithdraw()` forfeits your pending rewards.** Only use it if `withdraw()` fails.

---

## 6. Step 5: Withdraw via Remix IDE (Alternative Method)

> ✅ **Good alternative if the Block Explorer write-contract page is down. No private key needed.**

### 6.1 Open Remix IDE

Go to: **[https://remix.ethereum.org](https://remix.ethereum.org)**

### 6.2 Create the Interface File

1. In the **File Explorer** (left sidebar), click the **"Create New File"** icon
2. Name it `DtoolsStaking.sol`
3. Paste the following code:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IDtoolsStaking {
    function userInfo(address _user) external view returns (uint256 amount, uint256 rewardDebt, uint256 lastDepositTime);
    function pendingReward(address _user) external view returns (uint256);
    function withdraw() external;
    function emergencyWithdraw() external;
    function totalStaked() external view returns (uint256);
    function rewardsRemaining() external view returns (uint256);
    function exitPenalty() external view returns (uint256);
    function apy() external view returns (uint256);
    function lockPeriod() external view returns (uint256);
    function owner() external view returns (address);
}

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
}
```

### 6.3 Compile

1. Go to the **"Solidity Compiler"** tab (left sidebar, S icon)
2. Compiler version: `0.8.0` or higher
3. Click **"Compile DtoolsStaking.sol"**
4. Wait for compilation to succeed (should show green checkmark)

### 6.4 Deploy (Connect to Existing Contract)

1. Go to the **"Deploy & Run Transactions"** tab (left sidebar, Ethereum logo)
2. Set **Environment** to **"Injected Provider — MetaMask"**
   - MetaMask will pop up — confirm the connection
   - Ensure MetaMask is on **Dogechain** network (Chain ID: 2000)
3. In the **"Contract"** dropdown, select **`IDtoolsStaking`**
4. Paste the staking contract address in the **"At Address"** field:
   ```
   0x7cc5fb5a99e51b2748a3ee2313e18f4f65b62416
   ```
5. Click the **"At Address"** button
6. The contract will appear under **"Deployed Contracts"** in the left sidebar

### 6.5 Interact

Expand the deployed contract to see all functions:

**Read operations (free, no gas):**
- Click `userInfo` → enter your wallet address → see your staked amount
- Click `pendingReward` → enter your wallet address → see pending rewards
- Click `totalStaked` → see total tokens staked by all users
- Click `rewardsRemaining` → see remaining reward pool

**Write operations (cost gas):**
- Click `withdraw` → confirm in MetaMask → **withdraws staked tokens + rewards (minus 10% penalty)**
- Click `emergencyWithdraw` → confirm in MetaMask → **withdraws staked tokens only (minus 10% penalty, rewards forfeited)**

### 6.6 Verify Success

After the transaction confirms:
1. Check your DTOOLS token balance in MetaMask
2. Call `userInfo(yourAddress)` again — the `amount` should be `0`

---

## 7. Step 6: Withdraw via Foundry `cast` (Advanced Method)

> ⚠️ **This method requires your private key. Only use this if you are comfortable with CLI tools and understand the risks.**

### 7.1 Install Foundry (if not installed)

```bash
curl -L https://foundry.paradigm.xyz | bash
# Restart your terminal, then:
foundryup
```

### 7.2 Check Your Staked Balance

```bash
# Check userInfo — returns (amount, rewardDebt, lastDepositTime)
cast call 0x7cc5fb5a99e51b2748a3ee2313e18f4f65b62416 \
  "userInfo(address)(uint256,uint256,uint256)" \
  YOUR_WALLET_ADDRESS \
  --rpc-url https://rpc.dogechain.dog/
```

### 7.3 Check Pending Rewards

```bash
cast call 0x7cc5fb5a99e51b2748a3ee2313e18f4f65b62416 \
  "pendingReward(address)(uint256)" \
  YOUR_WALLET_ADDRESS \
  --rpc-url https://rpc.dogechain.dog/
```

### 7.4 Withdraw

```bash
# Regular withdraw (claims staked amount + rewards, minus 10% penalty)
cast send 0x7cc5fb5a99e51b2748a3ee2313e18f4f65b62416 \
  "withdraw()" \
  --rpc-url https://rpc.dogechain.dog/ \
  --private-key YOUR_PRIVATE_KEY
```

### 7.5 Emergency Withdraw (if regular withdraw fails)

```bash
# Emergency withdraw (claims staked amount only, minus 10% penalty, forfeits rewards)
cast send 0x7cc5fb5a99e51b2748a3ee2313e18f4f65b62416 \
  "emergencyWithdraw()" \
  --rpc-url https://rpc.dogechain.dog/ \
  --private-key YOUR_PRIVATE_KEY
```

> ⚠️ **NEVER share your private key with anyone. Never paste it into a website. If you use this method, ensure your terminal history is cleared afterward.**

---

## 8. Important Warnings

> ⚠️ **Read ALL of these before proceeding with any withdrawal.**

| # | Warning | Impact |
|---|---------|--------|
| 1 | **10% exit penalty** applies on ALL withdrawals — you will receive only **90%** of your staked amount | You lose 10% of staked tokens |
| 2 | **3% transfer tax** on DTOOLS (1% liquidity + 2% marketing) applies when tokens leave the contract | Additional 3% deducted on transfer |
| 3 | **Owner has NOT renounced ownership** — the owner (`0x1d89c0bdab6778ecceba84222620189bcd76eaa4`) can modify APY, penalty rate, lock period, or add new restrictions | Contract parameters could change |
| 4 | **Only ~4.6M DTOOLS rewards remain** — if many users claim simultaneously, the reward pool may deplete before your transaction processes | You may get fewer rewards than expected |
| 5 | **Never share your private key** — prefer MetaMask/Remix or explorer methods over CLI methods | Private key = full wallet access |
| 6 | **Ensure you have DOGE for gas** — withdrawal transactions require native DOGE for gas fees | Transaction will fail without gas |
| 7 | **The front-end is down** — there is no GUI; all interactions must be direct with the contract | Must use explorer/Remix/cast |
| 8 | **Double-check all addresses** before confirming any transaction — a wrong address means lost funds | Irreversible if sent to wrong address |

### Combined Fee Impact Example

If you have **100,000 DTOOLS** staked:
1. **Exit penalty (10%):** You lose 10,000 DTOOLS → receive 90,000
2. **Transfer tax (3%):** You lose 2,700 DTOOLS → receive 87,300
3. **Total effective loss:** ~12.7%
4. Plus any pending rewards you claim (these also get the 3% tax)

---

## 9. Post-Recovery: Swapping DTOOLS to DOGE

After withdrawing, if you want to convert DTOOLS to DOGE:

### 9.1 Prerequisites

1. You need DTOOLS in your wallet (from the withdrawal)
2. You need DOGE for gas
3. The LP pair must still have liquidity

**Current LP State:** ~36,830 WWDOGE / ~16.5M DTOOLS

### 9.2 Approve the Router

Before swapping, you must approve the router to spend your DTOOLS:

**Via Block Explorer:**
1. Go to: [Write Contract on DTOOLS Token](https://explorer.dogechain.dog/address/0xB9fcAa7590916578087842e017078D7797Fa18D0/write-contract)
2. Connect MetaMask
3. Find `approve(address spender, uint256 amount)`
4. Enter:
   - `spender`: `0xa4ee06ce40cb7e8c04e127c1f7d3dfb7f7039c81` (Router address)
   - `amount`: Your DTOOLS amount in wei (e.g., for 100000 tokens: `100000000000000000000000`)
   - Or use a large approval: `0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff`
5. Click **"Write"** and confirm in MetaMask

### 9.3 Execute the Swap

**Via Block Explorer:**
1. Go to: [Write Contract on Router](https://explorer.dogechain.dog/address/0xa4ee06ce40cb7e8c04e127c1f7d3dfb7f7039c81/write-contract)
2. Connect MetaMask
3. Find `swapExactTokensForTokensSupportingFeeOnTransferTokens`
4. Enter parameters:
   - `amountIn`: DTOOLS amount in wei (e.g., `100000000000000000000000` for 100,000 DTOOLS)
   - `amountOutMin`: Minimum DOGE you'll accept (use `0` for no slippage protection, or calculate a reasonable minimum)
   - `path`: `["0xB9fcAa7590916578087842e017078D7797Fa18D0","0xb7ddc6414bf4f5515b52d8bdd69973ae205ff101"]`
   - `to`: Your wallet address
   - `deadline`: A future Unix timestamp (e.g., `9999999999`)

> ⚠️ **Note:** The 3% transfer tax applies on the swap. Use `swapExactTokensForTokensSupportingFeeOnTransferTokens` (NOT `swapExactTokensForTokens`) because the token has fee-on-transfer mechanics.

### 9.4 Check Liquidity Before Swapping

```bash
# Check LP reserves
cast call 0xd552a0d629a5188058e67239bd0e5afead755cd5 \
  "getReserves()(uint256,uint256,uint256)" \
  --rpc-url https://rpc.dogechain.dog/
```

If reserves are near zero, the LP has been drained and swapping is not possible.

---

## 10. Quick Reference Card

### Addresses

```
Staking Contract:  0x7cc5fb5a99e51b2748a3ee2313e18f4f65b62416
DTOOLS Token:      0xB9fcAa7590916578087842e017078D7797Fa18D0
LP Pair:           0xd552a0d629a5188058e67239bd0e5afead755cd5
Router:            0xa4ee06ce40cb7e8c04e127c1f7d3dfb7f7039c81
WWDOGE:            0xb7ddc6414bf4f5515b52d8bdd69973ae205ff101
Owner:             0x1d89c0bdab6778ecceba84222620189bcd76eaa4
```

### Function Selectors

```
userInfo(address)                              → 0x1959a002
pendingReward(address)                         → 0x9a21d922
withdraw()                                     → 0x2e1a7d4d
emergencyWithdraw()                            → 0xd0e30db0
totalStaked()                                  → 0x817b1cd2
rewardsRemaining()                             → 0x38fff2d0
exitPenalty()                                  → 0x237e9e46
apy()                                          → 0x95d89b41
balanceOf(address)                             → 0x70a08231
approve(address,uint256)                       → 0x095ea7b3
```

### Explorer Direct Links

| Page | URL |
|------|-----|
| **Staking — Read Contract** | [https://explorer.dogechain.dog/address/0x7cc5fb5a99e51b2748a3ee2313e18f4f65b62416/read-contract](https://explorer.dogechain.dog/address/0x7cc5fb5a99e51b2748a3ee2313e18f4f65b62416/read-contract) |
| **Staking — Write Contract** | [https://explorer.dogechain.dog/address/0x7cc5fb5a99e51b2748a3ee2313e18f4f65b62416/write-contract](https://explorer.dogechain.dog/address/0x7cc5fb5a99e51b2748a3ee2313e18f4f65b62416/write-contract) |
| **Token — Read Contract** | [https://explorer.dogechain.dog/address/0xB9fcAa7590916578087842e017078D7797Fa18D0/read-contract](https://explorer.dogechain.dog/address/0xB9fcAa7590916578087842e017078D7797Fa18D0/read-contract) |
| **Token — Write Contract** | [https://explorer.dogechain.dog/address/0xB9fcAa7590916578087842e017078D7797Fa18D0/write-contract](https://explorer.dogechain.dog/address/0xB9fcAa7590916578087842e017078D7797Fa18D0/write-contract) |
| **Router — Write Contract** | [https://explorer.dogechain.dog/address/0xa4ee06ce40cb7e8c04e127c1f7d3dfb7f7039c81/write-contract](https://explorer.dogechain.dog/address/0xa4ee06ce40cb7e8c04e127c1f7d3dfb7f7039c81/write-contract) |
| **LP Pair — Read Contract** | [https://explorer.dogechain.dog/address/0xd552a0d629a5188058e67239bd0e5afead755cd5/read-contract](https://explorer.dogechain.dog/address/0xd552a0d629a5188058e67239bd0e5afead755cd5/read-contract) |
| **Owner Wallet** | [https://explorer.dogechain.dog/address/0x1d89c0bdab6778ecceba84222620189bcd76eaa4](https://explorer.dogechain.dog/address/0x1d89c0bdab6778ecceba84222620189bcd76eaa4) |

### Network Config

```
RPC:       https://rpc.dogechain.dog/
Chain ID:  2000
Symbol:    DOGE
Explorer:  https://explorer.dogechain.dog/
```

### Recommended Action Order

1. ✅ **Check balance** (read-only, free) → Section 2
2. ✅ **Check rewards** (read-only, free) → Section 3
3. ✅ **Configure MetaMask** → Section 4
4. ✅ **Withdraw via explorer** (recommended) → Section 5
5. ❌ **If explorer fails** → Try Remix (Section 6) or cast (Section 7)
6. ✅ **Swap to DOGE** (optional) → Section 9

---

> **This action plan is based on on-chain data as of 2026-05-08. Contract parameters (APY, penalty, rewards) may have changed since then. Always verify current state before transacting.**
