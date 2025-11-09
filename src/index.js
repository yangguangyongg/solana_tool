import path from 'path';
import { fileURLToPath } from 'url';
import { getConnection } from './utils/connection.js';
import {
    RUN_CREATE,
    RUN_AIRDROP,
    RUN_BUY,
    RUN_SWEEP,
    WALLET_DIR,
    WALLET_COUNT,
    BUY_TOKEN_MINT,
    BUY_SOL_AMOUNT,
    SWEEP_TOKEN_MINTS,
    BUY_DELAY_MS
} from './config.js';
import { createWalletFiles } from './services/createWallets.js';
import { loadWalletsFromDir } from './utils/loadWalletDir.js';
import { airdropToWallets } from './services/airdrop.js';
import { raydiumSwapSolToToken } from './services/raydiumBuy.js';
import { sweepWallet } from './services/sweep.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    // step 1: create wallets
    if (RUN_CREATE) {
        console.log('=== step 1: create wallets ===');
        createWalletFiles(WALLET_DIR, WALLET_COUNT);
    }

    // load wallets (whether newly created or existing)
    const wallets = loadWalletsFromDir(WALLET_DIR);
    console.log(`loaded ${wallets.length} wallets from ${WALLET_DIR}`);

    // step 2: airdrop
    if (RUN_AIRDROP) {
        console.log('=== step 2: airdrop ===');
        await airdropToWallets(wallets);
    }

    // step 3: buy token (raydium)
    if (RUN_BUY && BUY_TOKEN_MINT && BUY_SOL_AMOUNT > 0) {
        console.log('=== step 3: buy token ===');
        for (const { name, keypair } of wallets) {
            try {
                await raydiumSwapSolToToken(keypair, BUY_TOKEN_MINT, BUY_SOL_AMOUNT);
            } catch (e) {
                console.error(`buy failed for ${name}:`, e.message);
            }

            if (BUY_DELAY_MS > 0) {
                console.log(`waiting ${BUY_DELAY_MS} ms before next wallet.`);
                await new Promise((r) => setTimeout(r, BUY_DELAY_MS));
            }
        }
    }

    // step 4: sweep
    if (RUN_SWEEP) {
        console.log('=== step 4: sweep ===');
        const connection = getConnection();
        for (const { name, keypair } of wallets) {
            try {
                await sweepWallet(connection, keypair, SWEEP_TOKEN_MINTS);
            } catch (e) {
                console.error(`sweep failed for ${name}:`, e.message);
            }
        }
    }

    console.log('workflow finished.');
}

main().catch(console.error);
