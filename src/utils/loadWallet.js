import fs from 'fs';
import { Keypair } from '@solana/web3.js';

export function loadWalletFromFile(path) {
    const raw = fs.readFileSync(path, 'utf8');
    const secret = JSON.parse(raw);
    return Keypair.fromSecretKey(Uint8Array.from(secret));
}
