# DTOOLS ($DTOOLS) On-Chain Investigation Plan

## Dogechain Network — Smart Contract Recovery & Mapping Playbook

---

**Document Purpose:** Step-by-step investigative guide to locate all smart contracts associated with the DTOOLS project on Dogechain, identify staking contracts, liquidity pools, and any contracts where user tokens may be locked or staked.

**Token Contract Address:** `0xB9fcAa7590916578087842e017078D7797Fa18D0`

**Network:** Dogechain (EVM-compatible, Chain ID: 2000)

**Block Explorer:** `https://explorer.dogechain.dog/`

**Status:** Front-end inaccessible — on-chain recovery required

---

> ⚠️ **SECURITY NOTICE:** This document is for investigative and planning purposes only. Do NOT connect wallets, sign transactions, or approve any contract interactions during this investigation. All analysis is read-only via block explorer and API queries.

---

## Table of Contents

1. [Phase 1: Token Contract Analysis](#phase-1-token-contract-analysis)
2. [Phase 2: Deployer Wallet Forensics](#phase-2-deployer-wallet-forensics)
3. [Phase 3: Token Transfer Tracing](#phase-3-token-transfer-tracing)
4. [Phase 4: Staking Contract Identification](#phase-4-staking-contract-identification)
5. [Phase 5: Liquidity Pool Discovery](#phase-5-liquidity-pool-discovery)
6. [Phase 6: Contract Relationship Mapping](#phase-6-contract-relationship-mapping)
7. [Appendix: Quick Reference](#appendix-quick-reference)

---

## Phase 1: Token Contract Analysis

### Objective
Examine the DTOOLS token contract at the known address to understand its type, capabilities, ownership, and relationship to other contracts.

### 1.1 Access the Token Contract Page

Navigate to the token contract in the block explorer:

```
https://explorer.dogechain.dog/address/0xB9fcAa7590916578087842e017078D7797Fa18D0
```

If the explorer has a dedicated token view:

```
https://explorer.dogechain.dog/token/0xB9fcAa7590916578087842e017078D7797Fa18D0
```

### 1.2 Identify Contract Creator / Deployer

1. On the contract address page, locate the **"Contract Creator"** field or the first transaction involving this address.
2. Alternatively, navigate to the **"Transactions"** tab for this address.
3. The **first transaction** (lowest block number) is typically the contract creation transaction.
4. The `from` address of that transaction is the **deployer wallet**.
5. Record:
   - Deployer wallet address: `_______________________________`
   - Creation transaction hash: `_______________________________`
   - Creation block number: `_______________________________`
   - Creation timestamp: `_______________________________`

**API Method (if available):**

```bash
# Get contract creation transaction
curl -s "https://explorer.dogechain.dog/api?module=contract&action=getcontractcreation&contractaddresses=0xB9fcAa7590916578087842e017078D7797Fa18D0" | jq
```

### 1.3 Examine Contract Code & Verification Status

1. On the contract address page, click the **"Contract"** tab.
2. Check if the contract is **verified** (source code visible) or **unverified** (only bytecode shown).
3. If **verified**: Review the Solidity source code directly — this is the ideal scenario.
4. If **unverified**: Proceed with bytecode analysis (see Phase 4 for bytecode pattern matching).

### 1.4 Enumerate Read Functions (If Verified)

When the contract is verified, the explorer will display all readable functions under the **"Read Contract"** or **"Read Proxy"** tab. Document every function:

| Function | Expected Return | Purpose | Value Found |
|----------|----------------|---------|-------------|
| `name()` | string | Token name | `_____________` |
| `symbol()` | string | Token ticker | `_____________` |
| `decimals()` | uint8 | Decimal precision (usually 18) | `_____________` |
| `totalSupply()` | uint256 | Total token supply | `_____________` |
| `owner()` | address | Contract owner (if Ownable) | `_____________` |
| `balanceOf(address)` | uint256 | Balance of any address | `_____________` |
| `allowance(address,address)` | uint256 | Approved spending | `_____________` |

**Additional functions to check for:**

- `mint(address, uint256)` — Indicates minting capability
- `burn(uint256)` / `burnFrom(address, uint256)` — Burn mechanisms
- `renounceOwnership()` — Whether ownership was renounced
- `transferOwnership(address)` — Ownership transfer history
- `pause()` / `unpause()` — Pausable functionality
- `blacklist(address)` / `setFeeRate(uint256)` — Tax/fee mechanisms

### 1.5 Check for Proxy Patterns

1. Look at the contract bytecode — if it begins with `0x363d3d373d3d3d363d` or similar minimal proxy patterns (EIP-1167), the contract is a **proxy**.
2. If the contract has a `implementation()` or `getImplementation()` function, call it to find the logic contract.
3. Check for `AdminUpgradeabilityProxy` or `TransparentUpgradeableProxy` patterns.
4. If a proxy is detected, **also analyze the implementation contract** — the proxy delegates all logic to it.

```
Proxy Contract: 0xB9fcAa7590916578087842e017078D7797Fa18D0
Implementation:  _______________________________ (if proxy)
Admin:          _______________________________ (if proxy)
```

### 1.6 Analyze Token Transfer Events

Navigate to the **"Token Transfers"** tab:

```
https://explorer.dogechain.dog/token/0xB9fcAa7590916578087842e017078D7797Fa18D0/token-transfers
```

- Observe the pattern of transfers — large transfers from deployer to specific addresses may indicate contract seeding.
- Note any addresses that appear repeatedly as recipients — these are candidates for staking/pool contracts.

### 1.7 Security Considerations

- 🔴 **Do NOT call any write functions** on the token contract, even if verified.
- 🔴 **Do NOT approve any spending** from your wallet to any contract during investigation.
- 🟡 If the contract has `mint()` functionality and ownership is **not renounced**, the owner can inflate supply.
- 🟡 If the contract has `pause()` functionality, tokens could be frozen.
- 🟡 Check for any tax/fee mechanisms (`_taxRate`, `_liquidityFee`) that affect transfer amounts.

---

## Phase 2: Deployer Wallet Forensics

### Objective
Trace the deployer wallet's activity to discover all contracts deployed by the same entity, revealing the full DTOOLS contract ecosystem.

### 2.1 Access the Deployer Wallet Page

Using the deployer address identified in Phase 1.2:

```
https://explorer.dogechain.dog/address/<DEPLOYER_ADDRESS>
```

### 2.2 Enumerate All Contract Deployments

**Method A: Block Explorer UI**

1. Navigate to the deployer's address page.
2. Filter transactions to show only **"Contract Creation"** transactions (some explorers have this filter).
3. If no filter is available, manually scan transactions looking for:
   - Transactions where the `to` field is empty/null (indicates contract creation).
   - Transactions that create a new contract address (shown in the transaction details).
4. Record every contract address created by this wallet.

**Method B: API Query**

```bash
# Get all transactions from the deployer wallet
curl -s "https://explorer.dogechain.dog/api?module=account&action=txlist&address=<DEPLOYER_ADDRESS>&startblock=0&endblock=99999999&sort=asc" | jq '.result[] | select(.to == "") | {hash: .hash, contractAddress: .contractAddress, blockNumber: .blockNumber, timeStamp: .timeStamp}'
```

This filters for contract creation transactions (where `to` is empty).

**Method C: Internal Transactions**

```bash
# Get internal transactions (contract-created contracts)
curl -s "https://explorer.dogechain.dog/api?module=account&action=txlistinternal&address=<DEPLOYER_ADDRESS>&startblock=0&endblock=99999999&sort=asc" | jq
```

### 2.3 Deployed Contracts Inventory

Create a comprehensive table of all discovered contracts:

| # | Contract Address | Creation TX | Block | Timestamp | Label/Type | Verified? |
|---|-----------------|-------------|-------|-----------|------------|-----------|
| 1 | `0xB9fcAa759...` (DTOOLS Token) | | | | ERC-20 Token | |
| 2 | `_________________` | | | | | |
| 3 | `_________________` | | | | | |
| 4 | `_________________` | | | | | |
| 5 | `_________________` | | | | | |

### 2.4 Identify Contract Types by Bytecode Patterns

For each deployed contract, examine the bytecode for known patterns:

| Bytecode Pattern | Contract Type |
|-----------------|---------------|
| Contains `MasterChef` or `deposit(` | Staking (MasterChef-style) |
| Contains `synthetix` or `StakingRewards` | Staking (Synthetix-style) |
| Contains `swapExact` or `addLiquidity` | DEX Router |
| Contains `createPair` | DEX Factory |
| Contains `Proxy` or `delegatecall` | Proxy Contract |
| Contains `Timelock` | Governance Timelock |
| Contains `Vault` or `Strategy` | Yield Vault |
| Contains `IERC20` + `staking` | Custom Staking |
| Very short bytecode (< 100 bytes) | Minimal Proxy (EIP-1167) |

### 2.5 Trace Deployer's Token Interactions

```bash
# Get ERC-20 token transfers involving the deployer
curl -s "https://explorer.dogechain.dog/api?module=account&action=tokentx&address=<DEPLOYER_ADDRESS>&startblock=0&endblock=99999999&sort=asc" | jq '.result[] | {from: .from, to: .to, value: .value, tokenSymbol: .tokenSymbol, tokenName: .tokenName, contractAddress: .contractAddress}'
```

This reveals:
- Which tokens the deployer interacted with
- Which contracts the deployer sent tokens to (seeding liquidity, staking rewards, etc.)
- Whether the deployer moved LP tokens

### 2.6 Cross-Reference with Related Wallets

1. Check if the deployer wallet sent tokens to other wallets before deploying contracts.
2. These "sub-deployer" wallets may have deployed additional contracts.
3. For each significant transfer from the deployer, check if the receiving address is also a contract deployer.

### 2.7 Security Considerations

- 🟡 The deployer wallet may still have **ownership privileges** over deployed contracts if ownership was not renounced or transferred.
- 🟡 If the deployer wallet is still active (recent transactions), the protocol may still be under active control.
- 🟡 Multiple deployer wallets may indicate a more complex (or deliberately obscured) architecture.

---

## Phase 3: Token Transfer Tracing

### Objective
Trace all DTOOLS token transfers involving the user's wallet to identify which contracts received tokens and where they may currently be locked or staked.

### 3.1 Query User's DTOOLS Transfer History

**Method A: Block Explorer UI**

1. Navigate to your wallet address:
   ```
   https://explorer.dogechain.dog/address/<YOUR_WALLET_ADDRESS>
   ```
2. Go to the **"ERC-20 Token Txns"** tab (or equivalent token transfers tab).
3. Filter or scan for transfers involving the DTOOLS token contract: `0xB9fcAa7590916578087842e017078D7797Fa18D0`.

**Method B: API Query**

```bash
# Get all ERC-20 transfers FROM the user's wallet
curl -s "https://explorer.dogechain.dog/api?module=account&action=tokentx&address=<YOUR_WALLET_ADDRESS>&contractaddress=0xB9fcAa7590916578087842e017078D7797Fa18D0&startblock=0&endblock=99999999&sort=asc" | jq
```

### 3.2 Categorize All Transfers

For each transfer, record and categorize:

| TX Hash | Direction | Counterparty Address | Amount | Block | Category |
|---------|-----------|---------------------|--------|-------|----------|
| `0x...` | OUT | `0x...` | 10,000 DTOOLS | 12345 | Staking Deposit? |
| `0x...` | IN | `0x...` | 500 DTOOLS | 12400 | Reward Claim? |
| `0x...` | OUT | `0x...` | 5,000 DTOOLS | 12500 | LP Provision? |

**Categories:**
- **Staking Deposit** — Transfer to a contract with no tokens returned in the same TX
- **Reward Claim** — Transfer from a contract to user (often from `deposit(0)` or `claim()` calls)
- **LP Provision** — Transfer to a DEX router contract (often paired with WDOGE or another token)
- **Initial Purchase** — Transfer from DEX pair to user after swap
- **Transfer** — Direct wallet-to-wallet transfer

### 3.3 Identify Transfer Destination Contracts

For every **outgoing** transfer of DTOOLS from your wallet:

1. Take the `to` address from the transfer event.
2. Check if the `to` address is a **contract** (has bytecode) or an EOA (externally owned account):
   ```bash
   # Check if address is a contract
   curl -s "https://explorer.dogechain.dog/api?module=contract&action=getabi&address=<DESTINATION_ADDRESS>" | jq
   ```
   If the response contains an ABI, it's a verified contract. If it returns "Contract source code not verified", it's an unverified contract. If it returns an error, it may be an EOA.

3. For each contract destination, navigate to its page and check:
   - Is it in the deployed contracts list from Phase 2?
   - Is it a known DEX router or pair contract?
   - Does it have staking-related functions?

### 3.4 Analyze Transaction Input Data

For each outgoing DTOOLS transfer, examine the **input data** of the transaction:

1. Click on the transaction hash in the explorer.
2. Look at the **"Input Data"** field.
3. If decoded, it will show the function being called (e.g., `deposit(uint256)`, `stake(uint256)`, `addLiquidity(...)`).
4. If not decoded, the 4-byte function selector can be looked up:

| 4-byte Selector | Likely Function |
|----------------|-----------------|
| `0xd0e30db0` | `deposit()` |
| `0xa694fc3a` | `stake(uint256)` |
| `0x2e1a7d4d` | `withdraw(uint256)` |
| `0x3ccfd60b` | `withdraw()` |
| `0x5ae62c0b` | `emergencyWithdraw()` |
| `0xe9fad8ee` | `exit()` |
| `0x6e4c6834` | `claimRewards()` |
| `0x6cf6d7b8` | `pendingRewards(address)` |
| `0x38ed1739` | `swapExactTokensForTokens(...)` |
| `0xe8e33700` | `addLiquidity(...)` |
| `0xf305d719` | `addLiquidityETH(...)` |
| `0x2195995c` | `withdraw(uint256)` (MasterChef) |
| `0x441a3e70` | `deposit(uint256,uint256)` (MasterChef) |

**4-byte lookup tool:** `https://www.4byte.directory/` or `https://openchain.xyz/signatures`

### 3.5 Check Current Token Balances

```bash
# Check user's DTOOLS balance (wallet)
# Call balanceOf(<YOUR_WALLET_ADDRESS>) via the explorer's "Read Contract" tab
# Or via API:
curl -s "https://explorer.dogechain.dog/api?module=account&action=tokenbalance&contractaddress=0xB9fcAa7590916578087842e017078D7797Fa18D0&address=<YOUR_WALLET_ADDRESS>" | jq
```

Also check the DTOOLS balance of each destination contract:
```bash
curl -s "https://explorer.dogechain.dog/api?module=account&action=tokenbalance&contractaddress=0xB9fcAa7590916578087842e017078D7797Fa18D0&address=<DESTINATION_CONTRACT>" | jq
```

If a destination contract still holds a significant DTOOLS balance, your tokens may be recoverable.

### 3.6 Security Considerations

- 🟢 This phase is entirely read-only — no risk of fund loss.
- 🟡 Be aware that some transfers may have been **taxed** (fee-on-transfer) — the amount sent may differ from the amount received.
- 🟡 If you find transfers to unknown/unverified contracts, do NOT interact with them until fully analyzed in Phase 4.

---

## Phase 4: Staking Contract Identification

### Objective
Identify and analyze any staking contracts where DTOOLS tokens may be locked, determine their type, and assess whether funds can be withdrawn.

### 4.1 Common Staking Contract Patterns on EVM Chains

| Pattern | Origin | Key Functions | Identification |
|---------|--------|---------------|----------------|
| **MasterChef** | PancakeSwap/SushiSwap | `deposit(pid, amount)`, `withdraw(pid, amount)`, `emergencyWithdraw(pid)`, `pendingSushi(pid, user)` | Pool-based, supports multiple staking pools via `pid` |
| **Synthetix-style** | Synthetix StakingRewards | `stake(amount)`, `withdraw(amount)`, `getReward()`, `exit()`, `earned(address)` | Single-asset staking with reward rate |
| **Single Staking Vault** | Various | `deposit(amount)`, `withdraw(amount)`, `claim()`, `pendingRewards(address)` | Simple deposit/withdraw with fixed reward |
| **Locking/Staking** | TeamFinance/PinkLock | `deposit(amount, lockDuration)`, `withdraw(positionId)` | Time-locked staking |
| **Custom** | Project-specific | Varies | Must analyze bytecode |

### 4.2 Analyze Each Candidate Contract

For every contract identified in Phases 2 and 3 as a potential staking contract:

#### Step 1: Check Contract Verification

```
https://explorer.dogechain.dog/address/<CANDIDATE_CONTRACT>/contracts
```

- If **verified**: Source code is available — proceed to read functions analysis.
- If **unverified**: Use bytecode analysis techniques (Step 4).

#### Step 2: Enumerate Read Functions (Verified Contract)

Call each of these functions via the explorer's **"Read Contract"** tab:

**MasterChef Pattern:**
| Function | What It Reveals |
|----------|----------------|
| `poolLength()` | Number of staking pools |
| `poolInfo(pid)` | Token address, allocPoint, lastRewardBlock, accRewardPerShare for each pool |
| `userInfo(pid, user)` | User's staked amount, reward debt for a specific pool |
| `pendingRewards(pid, user)` | Unclaimed rewards for user in pool |
| `owner()` | Contract owner address |
| `rewardToken()` or `sushi()` / `cake()` | Reward token address |

**Synthetix-style Pattern:**
| Function | What It Reveals |
|----------|----------------|
| `stakingToken()` | Token being staked (should be DTOOLS or DTOOLS LP) |
| `rewardsToken()` | Token distributed as rewards |
| `balanceOf(address)` | User's staked balance |
| `earned(address)` | User's pending rewards |
| `totalSupply()` | Total tokens staked in contract |
| `rewardRate()` | Current reward distribution rate |

**Critical Query — Check Your Staked Balance:**

For each candidate contract, call the appropriate balance function with your wallet address:
- MasterChef: `userInfo(pid, <YOUR_WALLET_ADDRESS>)` — check `amount` field
- Synthetix: `balanceOf(<YOUR_WALLET_ADDRESS>)`
- Generic: `deposits(<YOUR_WALLET_ADDRESS>)` or `stakes(<YOUR_WALLET_ADDRESS>)`

Record results:

| Contract | Pattern | Your Staked Balance | Pending Rewards | Withdrawable? |
|----------|---------|--------------------| --------------- |---------------|
| `0x...` | MasterChef | 10,000 DTOOLS | 500 DTOOLS | Yes/Unknown |
| `0x...` | Synthetix | 5,000 LP tokens | 0 | Yes/Unknown |

#### Step 3: Check Write Functions for Withdrawal

On the **"Write Contract"** tab (do NOT execute — just document):

| Function | Parameters | Purpose |
|----------|-----------|---------|
| `withdraw(uint256)` or `withdraw(pid, amount)` | Amount to withdraw | Normal withdrawal |
| `emergencyWithdraw(pid)` | Pool ID | Withdraw without claiming rewards (emergency) |
| `exit()` | None | Withdraw + claim all rewards |

#### Step 4: Bytecode Analysis (Unverified Contract)

If the contract is not verified, analyze the bytecode for function selectors:

1. Copy the contract bytecode from the explorer.
2. Search for known 4-byte selectors within the bytecode:

```
Search bytecode for these hex patterns:
- d0e30db0 → deposit()
- a694fc3a → stake(uint256)
- 2e1a7d4d → withdraw(uint256)
- 3ccfd60b → withdraw()
- 5ae62c0b → emergencyWithdraw()
- 6cf6d7b8 → pendingRewards(address)
- 70a08231 → balanceOf(address)
- 18160ddd → totalSupply()
- 8da5cb5b → owner()
```

3. Alternatively, use the transaction input data from Phase 3.4 to determine which functions were called on this contract.

### 4.3 Check for Time-Lock Constraints

1. If the contract has `lockDuration()`, `lockPeriod()`, or `releaseTime()` functions, call them.
2. Check if there's a `withdrawalTime(address)` or `unlockTime(address)` function.
3. Compare the lock end time with the current block timestamp.
4. Some contracts require a minimum staking period before withdrawal.

### 4.4 Assess Contract Functional Status

| Check | Method | Concern |
|-------|--------|---------|
| Is the contract paused? | Call `paused()` if available | If paused, withdrawals may be blocked |
| Is ownership renounced? | Call `owner()` — if `0x000...000`, renounced | Renounced = no admin can block withdrawals |
| Does owner have special powers? | Check for `sweepFunds()`, `rescueTokens()` | Owner could drain the contract |
| Is there a reward token balance? | Check reward token balance in contract | If empty, no rewards to claim (but principal may be safe) |
| Is there a DTOOLS balance? | Check DTOOLS balance of contract | If zero, funds may have been drained |

### 4.5 Security Considerations

- 🔴 **DO NOT call `approve()` on any staking contract** during this investigation phase.
- 🔴 **DO NOT call `deposit()` or `stake()` — only analyze read functions.**
- 🟡 If a contract has an `emergencyWithdraw()` function, this is the safest withdrawal path if the contract is functional but rewards are depleted.
- 🟡 Verify that the contract still holds sufficient tokens to cover your staked balance before attempting withdrawal.
- 🟡 If ownership is NOT renounced and the owner can `pause()` or `sweepFunds()`, there is custodial risk.

---

## Phase 5: Liquidity Pool Discovery

### Objective
Identify all DEX liquidity pools involving DTOOLS tokens, find LP token contracts, and trace where LP tokens may be staked or locked.

### 5.1 Identify Dogechain DEX Platforms

Dogechain's primary DEX is likely **DogeSwap** or a Uniswap V2 fork. Common DEX contracts to check:

| DEX | Factory Contract Pattern | Router Contract Pattern |
|-----|-------------------------|------------------------|
| DogeSwap | `0x...` (to be discovered) | `0x...` (to be discovered) |
| Uniswap V2 Fork | Contains `createPair()` | Contains `swapExactTokensForTokens()` |
| Any DEX | Factory has `getPair(tokenA, tokenB)` | Router has `WETH()` / `WDOGE()` |

### 5.2 Find DTOOLS Trading Pairs via Factory Contract

**Method A: Direct Pair Lookup**

If you can identify the DEX factory contract address:

1. Navigate to the factory contract in the explorer.
2. Use the **"Read Contract"** tab.
3. Call `getPair(address tokenA, address tokenB)` with:
   - `tokenA` = `0xB9fcAa7590916578087842e017078D7797Fa18D0` (DTOOLS)
   - `tokenB` = `0xB7e1e2D5884e6eF3A7372F3a7c7E1bD4D46b5c2e` (WDOGE — verify this is the correct WDOGE address on Dogechain)

   Common pair tokens to check:
   - WDOGE (wrapped native token)
   - USDC/USDT (if bridged stablecoins exist)
   - Other popular Dogechain tokens

4. If the function returns a non-zero address, that's the LP pair contract.

**Method B: Transfer Event Analysis**

1. Review the DTOOLS token transfers (Phase 1.6 and Phase 3).
2. Look for transfers involving addresses with large DTOOLS balances that are not the deployer or your wallet.
3. These large-balance addresses are likely **LP pair contracts**.

**Method C: API Query for Top Holders**

```bash
# Some explorers provide holder lists
# Check the token page for "Holders" tab
https://explorer.dogechain.dog/token/0xB9fcAa7590916578087842e017078D7797Fa18D0#holders
```

The top holders (by balance) are typically:
1. LP pair contracts
2. Staking contracts
3. Deployer/team wallets
4. Dead/burn addresses

### 5.3 Analyze LP Pair Contracts

For each discovered pair contract:

1. Navigate to the pair contract address.
2. Check the **"Read Contract"** tab for standard Uniswap V2 pair functions:

| Function | What It Reveals |
|----------|----------------|
| `token0()` | First token in the pair |
| `token1()` | Second token in the pair |
| `getReserves()` | Reserve amounts of each token |
| `totalSupply()` | Total LP tokens minted |
| `balanceOf(address)` | LP token balance of any address |

3. Verify the pair contains DTOOLS:
   - Call `token0()` and `token1()`.
   - One should return `0xB9fcAa7590916578087842e017078D7797Fa18D0`.

4. Check reserves:
   - Call `getReserves()` — this shows the current liquidity depth.
   - If reserves are near zero, the pool has been drained (rug pull or withdrawal).

### 5.4 Trace LP Token Movements

1. Check if your wallet received LP tokens at any point:
   ```bash
   # Check LP token transfers to/from your wallet
   curl -s "https://explorer.dogechain.dog/api?module=account&action=tokentx&address=<YOUR_WALLET_ADDRESS>&contractaddress=<LP_PAIR_CONTRACT>&startblock=0&endblock=99999999&sort=asc" | jq
   ```

2. If you received LP tokens, trace where they went:
   - If staked in a farm: They were transferred to a MasterChef/staking contract.
   - If still in wallet: Call `balanceOf(<YOUR_WALLET>)` on the pair contract.
   - If burned: Sent to `0x000...000` dead address (permanently locked liquidity).

3. Check if LP tokens were staked in a farming contract:
   - Look for transfers of LP tokens from your wallet to any contract.
   - That contract is the farming/staking vault for LP tokens.

### 5.5 Check for Liquidity Locking

1. If LP tokens were sent to a **locking contract** (e.g., TeamFinance, PinkLock, Unicrypt), the liquidity is time-locked.
2. Common locking contract patterns:
   - `lockLPToken(address, uint256, uint256)` — Lock LP tokens for a duration
   - `withdraw(address)` — Withdraw after lock expires
3. Check if the deployer locked LP tokens:
   - Review deployer's transactions for interactions with known locking platforms.
   - Check if LP tokens are at a known locker contract address.

### 5.6 Security Considerations

- 🔴 **DO NOT remove liquidity** during investigation — removing liquidity from a pair where you're the only LP will permanently affect the market.
- 🟡 If LP reserves are extremely low or zero, the token has no meaningful liquidity — recovery value may be negligible.
- 🟡 If LP tokens were burned (sent to dead address), the liquidity is permanently locked and cannot be recovered by anyone.
- 🟡 If LP tokens are in a time-lock contract, check the unlock date — liquidity may be withdrawable by the deployer after that date.

---

## Phase 6: Contract Relationship Mapping

### Objective
Build a complete map of all DTOOLS-related contracts, their relationships, ownership status, and functional state to create a comprehensive recovery plan.

### 6.1 Build the Contract Map

Create a visual/textual map of all discovered contracts and their relationships:

```
DEPLOYER WALLET: 0x________________________________
│
├── DTOOLS Token (ERC-20): 0xB9fcAa7590916578087842e017078D7797Fa18D0
│   ├── Owner: 0x________________________________ (or renounced)
│   ├── Total Supply: _________________
│   └── Paused: Yes/No
│
├── Staking Contract #1: 0x________________________________
│   ├── Type: MasterChef / Synthetix / Custom
│   ├── Staking Token: DTOOLS / LP Token
│   ├── Reward Token: _________________
│   ├── Owner: 0x________________________________ (or renounced)
│   ├── Your Staked Balance: _________________
│   ├── Your Pending Rewards: _________________
│   ├── Contract DTOOLS Balance: _________________
│   └── Functional Status: Active / Paused / Drained
│
├── Staking Contract #2: 0x________________________________
│   ├── (same fields as above)
│
├── LP Pair: 0x________________________________
│   ├── Token0: DTOOLS
│   ├── Token1: WDOGE / other
│   ├── Reserves: DTOOLS=_______ / Other=_______
│   ├── Total LP Supply: _________________
│   └── Your LP Balance: _________________
│
├── LP Farming Contract: 0x________________________________
│   ├── Staking Token: LP Pair Token
│   ├── Reward Token: DTOOLS / other
│   ├── Your Staked LP: _________________
│   └── Your Pending Rewards: _________________
│
├── Locking Contract: 0x________________________________
│   ├── Locked LP Amount: _________________
│   ├── Lock Expiry: _________________
│   └── Beneficiary: 0x________________________________
│
└── [Other Contracts]: 0x________________________________
```

### 6.2 Ownership & Access Control Audit

For every discovered contract, document the access control state:

| Contract | Owner Address | Ownership Renounced? | Admin Functions | Risk Level |
|----------|--------------|---------------------|-----------------|------------|
| DTOOLS Token | `0x...` | Yes/No | mint, pause, blacklist | High/Med/Low |
| Staking Contract | `0x...` | Yes/No | pause, setRewardRate, sweep | High/Med/Low |
| LP Pair | N/A (factory-created) | N/A | N/A | Low |
| Farming Contract | `0x...` | Yes/No | addPool, setAllocPoint, sweep | High/Med/Low |

**Key checks per contract:**
1. Call `owner()` — if `0x0000000000000000000000000000000000000000`, ownership is renounced ✅
2. Check if `owner()` matches the deployer wallet or a different address.
3. Look for `onlyOwner` functions in verified contracts.
4. Check for `timelock()` or `transferOwnership()` patterns.

### 6.3 Assess Contract Functional Status

For each contract, determine if it is still operational:

| Status | Indicators | Recovery Implication |
|--------|-----------|---------------------|
| **Active** | Contract holds tokens, functions callable, not paused | Withdrawal likely possible |
| **Paused** | `paused()` returns `true` | Withdrawal blocked until unpaused (requires owner) |
| **Drained** | Token balance is 0 or near-0 | Funds already extracted; recovery unlikely |
| **Broken** | Functions revert, contract self-destructed | Recovery impossible via contract |
| **Migrated** | Contract redirects to new address | Check the new contract |

### 6.4 Proxy & Upgrade Pattern Analysis

If any contract uses a proxy pattern:

1. **Identify proxy type:**
   - Transparent Proxy: Admin and implementation are separate slots
   - UUPS: Implementation is in the logic contract
   - EIP-1167 Minimal Proxy: Cloned from a template

2. **Check implementation address:**
   - Call `implementation()` or `getImplementation()` on the proxy.
   - Analyze the implementation contract separately.

3. **Storage collision check:**
   - Compare storage slots between proxy and implementation.
   - Look for `PROXY_ADMIN_SLOT`, `IMPLEMENTATION_SLOT` constants.

4. **Risk assessment:**
   - If the implementation can be upgraded by the owner, the contract's behavior can change at any time.
   - If the admin/owner is a timelock, changes require a delay period.
   - If ownership is renounced, the implementation is immutable.

### 6.5 Recovery Priority Assessment

Based on all findings, rank contracts by recovery priority:

| Priority | Contract | Reason | Estimated Recoverable Value |
|----------|----------|--------|---------------------------|
| 1 (Highest) | Staking Contract with your tokens | Direct token recovery | _________________ |
| 2 | LP Farming Contract | LP tokens + rewards | _________________ |
| 3 | LP Pair (unstaked LP tokens) | Direct LP token recovery | _________________ |
| 4 | Reward token contracts | Unclaimed rewards | _________________ |

### 6.6 Recovery Action Plan Template

For each contract where you have a recoverable balance:

```
CONTRACT: 0x________________________________
TYPE: Staking / LP Farm / LP Pair
YOUR BALANCE: _________________ tokens
WITHDRAWAL FUNCTION: withdraw(amount) / emergencyWithdraw(pid) / removeLiquidity(...)
PREREQUISITES:
  [ ] Verify contract is not paused
  [ ] Verify contract holds sufficient tokens
  [ ] Verify no time-lock is active
  [ ] Verify ownership status (renounced = safer)
  [ ] Estimate gas cost of withdrawal
RISK LEVEL: Low / Medium / High
NOTES: _________________________________________________
```

### 6.7 Security Considerations

- 🔴 **Before any withdrawal attempt**, verify the contract is legitimate and not a honeypot (a contract that appears to allow withdrawals but reverts).
- 🔴 **Test with a small amount first** if possible — some contracts have minimum withdrawal amounts or unexpected behavior.
- 🟡 **Check for reentrancy risks** — if the contract is unverified and you must interact, be aware that withdrawal functions could have malicious callbacks.
- 🟡 **Use a fresh/throwaway wallet** for initial interaction tests if the contract is unverified and suspicious.
- 🟡 **Monitor the contract state** — if the owner can drain the contract, they may do so before you withdraw. Act promptly.
- 🟢 If all contracts are verified, ownership is renounced, and funds are present, recovery is generally safe.

---

## Appendix: Quick Reference

### A. Key Addresses

| Label | Address |
|-------|---------|
| DTOOLS Token | `0xB9fcAa7590916578087842e017078D7797Fa18D0` |
| Deployer Wallet | `_______________________________` (fill from Phase 1) |
| Your Wallet | `_______________________________` |
| Staking Contract 1 | `_______________________________` (fill from Phase 4) |
| Staking Contract 2 | `_______________________________` (fill from Phase 4) |
| LP Pair | `_______________________________` (fill from Phase 5) |
| LP Farm | `_______________________________` (fill from Phase 5) |

### B. Block Explorer API Endpoints

```
Base URL: https://explorer.dogechain.dog/api

Account Transactions:
  ?module=account&action=txlist&address={address}&startblock=0&endblock=99999999&sort=asc

Internal Transactions:
  ?module=account&action=txlistinternal&address={address}&startblock=0&endblock=99999999&sort=asc

ERC-20 Token Transfers:
  ?module=account&action=tokentx&address={address}&startblock=0&endblock=99999999&sort=asc

Token Transfers (Specific Token):
  ?module=account&action=tokentx&address={address}&contractaddress={tokenAddress}&startblock=0&endblock=99999999&sort=asc

Token Balance:
  ?module=account&action=tokenbalance&contractaddress={tokenAddress}&address={address}

Contract ABI:
  ?module=contract&action=getabi&address={address}

Contract Creation:
  ?module=contract&action=getcontractcreation&contractaddresses={address}

Transaction Details:
  ?module=transaction&action=gettxinfo&txhash={txHash}
```

### C. Function Selector Reference

```
# Staking Functions
deposit()             → 0xd0e30db0
deposit(uint256)      → 0x3408e470
deposit(uint256,uint256) → 0x441a3e70
stake(uint256)        → 0xa694fc3a
withdraw(uint256)     → 0x2e1a7d4d
withdraw(uint256,uint256) → 0x2195995c
emergencyWithdraw()   → 0x5ae62c0b
emergencyWithdraw(uint256) → 0xd9caed12
exit()                → 0xe9fad8ee
getReward()           → 0xdf82c287
claimRewards()        → 0x6e4c6834

# Query Functions
balanceOf(address)    → 0x70a08231
earned(address)       → 0x008cc262
pendingRewards(address) → 0x6cf6d7b8
userInfo(uint256,address) → 0x93f1a40b (often custom)
poolInfo(uint256)     → 0x1526fe27
totalSupply()         → 0x18160ddd
owner()               → 0x8da5cb5b
paused()              → 0x5c975abb

# DEX Functions
swapExactTokensForTokens → 0x38ed1739
addLiquidity         → 0xe8e33700
addLiquidityETH      → 0xf305d719
removeLiquidity      → 0x2195995c
removeLiquidityETH   → 0x02751cec
createPair           → 0xc9c65396
getPair              → 0xe6a43905

# Token Functions
transfer(address,uint256) → 0xa9059cbb
approve(address,uint256) → 0x095ea7b3
transferFrom(address,address,uint256) → 0x23b872dd
```

### D. Investigation Checklist

```
Phase 1 — Token Contract Analysis
  [ ] Token contract page accessed and reviewed
  [ ] Deployer wallet address identified
  [ ] Contract verification status confirmed
  [ ] Read functions enumerated and called
  [ ] Proxy pattern checked
  [ ] Ownership status verified

Phase 2 — Deployer Wallet Forensics
  [ ] All contract deployments enumerated
  [ ] Contract types identified (by bytecode or source)
  [ ] Token interactions traced
  [ ] Related wallets cross-referenced

Phase 3 — Token Transfer Tracing
  [ ] All DTOOLS transfers from user wallet listed
  [ ] Transfers categorized (staking, LP, purchase, transfer)
  [ ] Destination addresses identified as contracts or EOAs
  [ ] Transaction input data analyzed for function selectors
  [ ] Current token balances checked

Phase 4 — Staking Contract Identification
  [ ] Each candidate contract analyzed
  [ ] Staking pattern identified (MasterChef, Synthetix, custom)
  [ ] User's staked balance confirmed
  [ ] Pending rewards checked
  [ ] Withdrawal functions identified
  [ ] Time-lock constraints checked
  [ ] Contract functional status assessed

Phase 5 — Liquidity Pool Discovery
  [ ] DEX factory contract identified
  [ ] DTOOLS pairs found via getPair()
  [ ] LP pair reserves checked
  [ ] LP token movements traced
  [ ] Liquidity locking status checked

Phase 6 — Contract Relationship Mapping
  [ ] Complete contract map created
  [ ] Ownership/access control documented for each contract
  [ ] Functional status assessed for each contract
  [ ] Proxy patterns analyzed
  [ ] Recovery priority ranked
  [ ] Recovery action plan created for each recoverable balance
```

### E. Tools & Resources

| Tool | URL | Purpose |
|------|-----|---------|
| Dogechain Explorer | `https://explorer.dogechain.dog/` | Primary block explorer |
| 4byte.directory | `https://www.4byte.directory/` | Function selector lookup |
| OpenChain Signatures | `https://openchain.xyz/signatures` | Function/event signature lookup |
| Dedaub (if supported) | `https://library.dedaub.com/` | Contract decompilation |
| Remix IDE | `https://remix.ethereum.org/` | Read contract via injected provider (read-only) |

### F. Recommended Next Steps After Investigation

1. **If contracts are verified and functional:** Proceed with withdrawal using the identified functions.
2. **If contracts are unverified:** Consider using a decompiler (Dedaub, Panoramix) to understand the bytecode before interacting.
3. **If contracts are paused or drained:** Document the situation for potential legal/regulatory recourse.
4. **If ownership is active and malicious:** The owner could front-run your withdrawal — consider using a flashbots-style private transaction if available on Dogechain.
5. **For complex recovery:** Delegate to the Web3 Contract Developer mode with the completed investigation plan for safe execution of withdrawal transactions.

---

*Document generated for on-chain investigation purposes. All analysis is read-only. No wallet connections or transactions are required or recommended during the investigation phase.*
