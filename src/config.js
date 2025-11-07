import 'dotenv/config';

export const RPC_ENDPOINT = process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
export const PAYER_JSON = process.env.PAYER_JSON || './payer.json';
export const AIRDROP_AMOUNT = Number(process.env.AIRDROP_AMOUNT || '0.01');
