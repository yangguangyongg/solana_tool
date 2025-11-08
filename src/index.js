import { batchAirdrop } from './services/airdrop.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadWalletsFromDir } from './utils/loadWalletDir.js';
import { swapSolToTargetOnRaydium } from './services/raydiumBuy.js';
import {Connection} from "@solana/web3.js";
import { RPC_ENDPOINT } from './config.js';
import { sweepSol, sweepPmug } from './services/sweep.js';
import {sleep} from "./utils/sleep.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WALLET_DIR = path.join(__dirname, 'wallet');

async function main() {
    // Step 1: airdrop
    const recipients = [

    ];
    // await batchAirdrop(recipients);

    // Step 2: swap
    const wallets = loadWalletsFromDir(WALLET_DIR);
    if (wallets.length === 0) {
        console.log('No wallet json files found in', WALLET_DIR);
        return;
    }

    console.log(`Found ${wallets.length} wallets in ${WALLET_DIR}`);

    for (const { name, keypair } of wallets) {
        try {
            await swapSolToTargetOnRaydium(keypair, 0.01);
            console.log(`All done for ${name}`);
            await sleep(2000);
        } catch (err) {
            console.error(`Failed for ${name}:`, err.message);
        }
    }

    // Step 3: Sweep
    // const connection = new Connection(RPC_ENDPOINT, 'confirmed');
    //
    // const wallets = loadWalletsFromDir(WALLET_DIR);
    // if (wallets.length === 0) {
    //     console.log('No wallets found in', WALLET_DIR);
    //     return;
    // }
    //
    // console.log(`Found ${wallets.length} wallets`);
    //
    // for (const { name, keypair } of wallets) {
    //     console.log(`\n=== sweeping ${name} (${keypair.publicKey.toBase58()}) ===`);
    //     try {
    //         await sweepPmug(connection, keypair);
    //     } catch (e) {
    //         console.error(`PMUG sweep failed for ${name}:`, e.message);
    //     }
    //
    //     try {
    //         await sweepSol(connection, keypair);
    //     } catch (e) {
    //         console.error(`SOL sweep failed for ${name}:`, e.message);
    //     }
    // }
    //
    // console.log('\nAll done.');


}

main().catch(console.error);
