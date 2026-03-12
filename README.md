# solana_tool

Batch wallet workflow tools for Solana (Node.js).

## What this project does

This repository contains a small CLI-style workflow script that can run the following steps (each step is enabled/disabled via environment variables):

- **Create wallets**: generate \(N\) new Solana keypairs and store each wallet as a JSON file under `WALLET_DIR`.
- **Airdrop / distribute assets**:
  - send **SOL** from a payer wallet to each generated wallet
  - send one or more **SPL tokens** (by mint) from the payer’s token accounts to each generated wallet
- **Buy on Raydium**: for each wallet, swap SOL into a target SPL token using Raydium’s transaction API (the wallet signs and sends the swap transaction).
- **Sweep / collect funds**: for each wallet, transfer specified SPL tokens and remaining SOL to a collector address.

Entry point: `src/index.js`.

## Requirements

- Node.js 18+ (recommended)
- A Solana RPC endpoint (devnet by default)
- A payer keypair JSON file (for SOL/token distribution)

## Install

```bash
npm install
```

## Configuration

Create a `.env` file in the project root (or export env vars in your shell).

### Core settings

- **SOLANA_RPC**: RPC endpoint URL. Defaults to `https://api.devnet.solana.com`
- **PAYER_JSON**: path to payer keypair JSON. Defaults to `./payer.json`
- **WALLET_DIR**: directory to store/load generated wallets. Defaults to `./src/wallet`

### Workflow switches

Set to `true`/`false`:

- **RUN_CREATE**
- **RUN_AIRDROP**
- **RUN_BUY**
- **RUN_SWEEP**

### Wallet creation

- **WALLET_COUNT**: number of wallets to create (default: `5`)

### Distribution (airdrop)

- **AIRDROP_SOL_PER_WALLET**: SOL amount to send to each wallet (default: `0`)
- **AIRDROP_TOKEN_MINTS**: comma-separated mint addresses
- **AIRDROP_TOKEN_AMOUNTS**: comma-separated human amounts (must match `AIRDROP_TOKEN_MINTS` length)

### Raydium buy

- **BUY_TOKEN_MINT**: output token mint
- **BUY_MIN_SOL** / **BUY_MAX_SOL**: per-wallet SOL spend range
- **BUY_DELAY_MS**: delay between wallets (milliseconds)

### Sweep (collect)

- **COLLECTOR**: collector wallet address (base58 public key)
- **SWEEP_TOKEN_MINTS**: comma-separated mint addresses to sweep first, then SOL is swept

## Run

```bash
npm start
```

The script will:

1. (Optional) create wallets
2. load wallets from `WALLET_DIR`
3. (Optional) distribute SOL/SPL tokens from the payer wallet
4. (Optional) swap SOL to the target token on Raydium for each wallet
5. (Optional) sweep assets to `COLLECTOR`

## Notes / caveats

- **Associated Token Accounts (ATA)**: SPL token transfers assume the source/destination ATAs already exist. If the recipient (or collector) does not have an ATA for a mint, token transfers may fail.
- **Network**: default RPC is **devnet**. Make sure your RPC, payer funds, token mints, and Raydium liquidity all match the same network.
- **Security**: wallet JSON files contain secret keys. Do not commit them. Keep `payer.json` and `WALLET_DIR` private.
