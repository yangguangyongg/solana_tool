import fs from 'fs';
import path from 'path';
import { Keypair } from '@solana/web3.js';

/**
 * Load all JSON keypairs in a directory.
 * It will ignore non-.json files.
 * @param {string} dir absolute or relative path to wallet dir
 * @returns {Array<{name: string, keypair: Keypair}>}
 */
export function loadWalletsFromDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    const wallets = [];

    for (const entry of entries) {
        if (!entry.isFile()) continue;
        if (!entry.name.endsWith('.json')) continue;

        const filePath = path.join(dir, entry.name);
        const raw = fs.readFileSync(filePath, 'utf8');
        const secret = JSON.parse(raw);
        const kp = Keypair.fromSecretKey(Uint8Array.from(secret));

        wallets.push({
            name: entry.name,
            keypair: kp,
        });
    }

    return wallets;
}
