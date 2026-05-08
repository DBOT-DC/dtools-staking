# 🔧 DTOOLS Staking — Dogechain

> **Community-built fallback staking interface for DTOOLS tokens on Dogechain.**

The official DogeTools website went offline, leaving holders unable to unstake or withdraw their tokens through the usual UI. **Your tokens are safe on-chain** — the smart contract is still fully functional. This dApp was built to give the community a way to access their staked DTOOLS while the official site is being restored.

**Live on Vercel →** [dtools-staking.vercel.app](https://dtools-staking.vercel.app)
**Block Explorer →** [explorer.dogechain.dog](https://explorer.dogechain.dog/)
**Contract →** [`0x7cc5...2416`](https://explorer.dogechain.dog/address/0x7cc5fb5a99e51b2748a3ee2313e18f4f65b62416)

### Why this exists

- The DogeTools front end went down unexpectedly
- Community members had no way to unstake, claim rewards, or emergency withdraw
- All funds remain on-chain — only the website was affected
- This interface connects to the **same verified smart contract** using the ABIs from Dogechain Blockscout
- Built by [DBOT](https://www.dbot.dog/) as a community service — no affiliation with DogeTools

### Is this safe?

Yes. This is a **read-only frontend** — it never holds your tokens, never asks for your seed phrase, and never routes transactions through any intermediary. All actions are signed by your own wallet and sent directly to the Dogechain staking contract. The source code is fully open for audit.

---

## Features

- **Wallet Connect** — MetaMask / injected EVM wallets with auto network detection (Chain ID 2000)
- **Stake / Unstake** — Lock DTOOLS tokens with configurable lock period and APY
- **Rewards Dashboard** — Real-time pending rewards, total staked (TVL), rewards remaining
- **Exit Penalty Display** — Transparent fee info before you withdraw
- **Emergency Withdraw** — Break the lock with penalty if needed
- **Responsive** — Mobile-first dark UI with Tailwind v4

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | React 18 |
| Build | Vite 6 |
| Styling | Tailwind CSS v4 |
| Blockchain | ethers.js v6 |
| Chain | Dogechain (ID 2000) |

## Getting Started

```bash
git clone https://github.com/DBOT-DC/dtools-staking.git
cd dtools-staking
npm install
npm run dev
```

Open `http://localhost:5173` and connect your wallet (MetaMask) on Dogechain.

## Contract Addresses

| Contract | Address |
|----------|---------|
| DTOOLS Token | `0xB9fc...18D0` |
| Staking | [`0x7cc5fb5a99e51b2748a3ee2313e18f4f65b62416`](https://explorer.dogechain.dog/address/0x7cc5fb5a99e51b2748a3ee2313e18f4f65b62416) |
| LP Pair | `0xd552a0d629a5188058e67239bd0e5afead755cd5` |
| DEX Router | `0xa4ee06ce40cb7e8c04e127c1f7d3dfb7f7039c81` |

## Project Structure

```
src/
├── config/
│   ├── constants.js      # Chain ID, RPC, explorer URLs
│   └── contracts.js      # Addresses + verified ABIs
├── hooks/
│   ├── useWallet.js       # Wallet connect / network switch
│   ├── useToken.js        # ERC-20 balance, allowance, approve
│   └── useStaking.js      # Stake, withdraw, rewards, APY
├── components/
│   ├── Header.jsx         # Nav + wallet button
│   ├── Dashboard.jsx      # Stats grid (balance, TVL, APY, rewards)
│   ├── StakePanel.jsx     # Stake/unstake form
│   ├── RewardsPanel.jsx   # Claim rewards card
│   ├── InfoSection.jsx    # How staking works
│   ├── StatsCard.jsx      # Reusable stat tile
│   └── TransactionToast.jsx  # TX confirmation toast
├── utils/
│   ├── format.js          # Token amount + number formatters
│   └── web3.js            # Provider / signer helpers
├── App.jsx
├── main.jsx
└── index.css              # Tailwind imports
```

## Deploy

### Vercel (recommended)

1. Import repo at [vercel.com/new](https://vercel.com/new)
2. Framework preset: **Vite**
3. Build command: `npm run build`
4. Output directory: `dist`
5. No environment variables needed (client-side only)
6. Deploy

### Manual

```bash
npm run build
# Serve dist/ with any static host
```

## Brought to you by [DBOT](https://www.dbot.dog/) on Dogechain 🐕

---

*No server-side secrets required — all blockchain interaction happens in-browser via your wallet.*
