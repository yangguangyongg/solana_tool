import fs from 'fs';
import {
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
    PublicKey,
    Keypair,
} from '@solana/web3.js';
import {
    getAssociatedTokenAddress,
    getMint,
    createTransferInstruction,
} from '@solana/spl-token';
import { getConnection } from '../utils/connection.js';
import {
    PAYER_JSON,
    AIRDROP_SOL_PER_WALLET,
    AIRDROP_TOKEN_MINTS,
    AIRDROP_TOKEN_AMOUNTS,
} from '../config.js';

function loadPayer() {
    const raw = fs.readFileSync(PAYER_JSON, 'utf8');
    const secret = JSON.parse(raw);
    return Keypair.fromSecretKey(Uint8Array.from(secret));
}

/**
 * Airdrop to wallets:
 * - optional SOL
 * - multiple SPL tokens from .env, comma separated
 *
 * @param {Array<{name: string, keypair: import('@solana/web3.js').Keypair}>} wallets
 */
export async function airdropToWallets(wallets) {
    const connection = getConnection();
    const payer = loadPayer();

    // sanity check: mints and amounts must match
    if (AIRDROP_TOKEN_MINTS.length !== AIRDROP_TOKEN_AMOUNTS.length) {
        throw new Error(
            `AIRDROP_TOKEN_MINTS length (${AIRDROP_TOKEN_MINTS.length}) != AIRDROP_TOKEN_AMOUNTS length (${AIRDROP_TOKEN_AMOUNTS.length})`
        );
    }

    for (const { name, keypair } of wallets) {
        const toPubkey = keypair.publicKey;
        console.log(`\n--- airdrop to ${name} (${toPubkey.toBase58()}) ---`);

        // 1) optional SOL
        if (AIRDROP_SOL_PER_WALLET > 0) {
            const lamports = Math.round(AIRDROP_SOL_PER_WALLET * 1_000_000_000);
            const tx = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: payer.publicKey,
                    toPubkey,
                    lamports,
                })
            );
            const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
            console.log(`sent SOL ${AIRDROP_SOL_PER_WALLET} -> ${toPubkey.toBase58()} | ${sig}`);
        }

        // 2) multiple SPL tokens
        for (let i = 0; i < AIRDROP_TOKEN_MINTS.length; i++) {
            const mintStr = AIRDROP_TOKEN_MINTS[i];
            const humanAmount = AIRDROP_TOKEN_AMOUNTS[i];

            const mintPk = new PublicKey(mintStr);
            const mintInfo = await getMint(connection, mintPk);
            const decimals = mintInfo.decimals;

            // convert human -> raw
            const amountRaw = BigInt(Math.round(humanAmount * 10 ** decimals));

            const srcAta = await getAssociatedTokenAddress(mintPk, payer.publicKey);
            const destAta = await getAssociatedTokenAddress(mintPk, toPubkey);

            const tx = new Transaction().add(
                createTransferInstruction(srcAta, destAta, payer.publicKey, amountRaw)
            );

            const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
            console.log(
                `sent ${humanAmount} of ${mintStr} -> ${toPubkey.toBase58()} | ${sig}`
            );
        }
    }
}
