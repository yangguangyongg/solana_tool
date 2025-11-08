import 'dotenv/config';

export const RPC_ENDPOINT = process.env.SOLANA_RPC || 'https://api.devnet.solana.com';
export const PAYER_JSON = process.env.PAYER_JSON || './payer.json';
export const WALLET_DIR = process.env.WALLET_DIR || './src/wallet';

export const RUN_CREATE = process.env.RUN_CREATE === 'true';
export const RUN_AIRDROP = process.env.RUN_AIRDROP === 'true';
export const RUN_BUY = process.env.RUN_BUY === 'true';
export const RUN_SWEEP = process.env.RUN_SWEEP === 'true';

export const WALLET_COUNT = Number(process.env.WALLET_COUNT || '5');

export const AIRDROP_SOL_PER_WALLET = Number(process.env.AIRDROP_SOL_PER_WALLET || '0');

export const AIRDROP_TOKEN_MINTS = (process.env.AIRDROP_TOKEN_MINTS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

export const AIRDROP_TOKEN_AMOUNTS = (process.env.AIRDROP_TOKEN_AMOUNTS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s));

export const BUY_TOKEN_MINT = process.env.BUY_TOKEN_MINT || '';
export const BUY_SOL_AMOUNT = Number(process.env.BUY_SOL_AMOUNT || '0');

export const COLLECTOR = process.env.COLLECTOR || '';
export const SWEEP_TOKEN_MINTS = (process.env.SWEEP_TOKEN_MINTS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
