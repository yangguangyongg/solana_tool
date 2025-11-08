import fs from 'fs';
import path from 'path';
import { Keypair } from '@solana/web3.js';

export function loadWalletsFromDir(dir) {
    if (!fs.existsSync(dir)) {
        return [];
    }
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    const wallets = [];
    for (const entry of entries) {
        if (!entry.isFile()) continue;
        if (!entry.name.endsWith('.json')) continue;

        const full = path.join(dir, entry.name);
        const raw = fs.readFileSync(full, 'utf8');
        const secret = JSON.parse(raw);
        const kp = Keypair.fromSecretKey(Uint8Array.from(secret));

        wallets.push({
            name: entry.name,
            keypair: kp,
        });
    }
    return wallets;
}
