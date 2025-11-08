import fs from 'fs';
import path from 'path';
import { Keypair } from '@solana/web3.js';
import { ensureDir } from '../utils/ensureDir.js';

/**
 * create N wallets and store them as <pubkey>.json in wallet dir
 */
export function createWalletFiles(dir, count) {
    ensureDir(dir);

    for (let i = 0; i < count; i++) {
        const kp = Keypair.generate();
        const pubkey = kp.publicKey.toBase58();
        const filePath = path.join(dir, `${pubkey}.json`);
        fs.writeFileSync(filePath, JSON.stringify(Array.from(kp.secretKey)));
        console.log(`created wallet: ${filePath}`);
    }
}
