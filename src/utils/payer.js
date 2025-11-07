import fs from 'fs';
import { Keypair } from '@solana/web3.js';
import { PAYER_JSON } from '../config.js';

export function loadPayer() {
    const raw = fs.readFileSync(PAYER_JSON, 'utf8');
    const secret = JSON.parse(raw);
    return Keypair.fromSecretKey(Uint8Array.from(secret));
}
