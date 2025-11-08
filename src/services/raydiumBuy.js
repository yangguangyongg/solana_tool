import {
    Connection,
    VersionedTransaction,
    PublicKey,
} from '@solana/web3.js';
import fetch from 'node-fetch'; // remove this line if you're on Node 18+ and have global fetch
import { RPC_ENDPOINT } from '../config.js';

/**
 * Raydium public endpoints
 * DOC: https://docs.raydium.io/raydium/traders/trade-api
 */
const RAYDIUM_SWAP_HOST = 'https://transaction-v1.raydium.io';
const RAYDIUM_BASE_HOST = 'https://api-v3.raydium.io';

const SOL_MINT = 'So11111111111111111111111111111111111111112';

const TARGET_MINT = 'V8tLkyqHdtzzYCGdsVf5CZ55BsLuvu7F4TchiDhJgem';

async function fetchPriorityFee() {
    try {
        const res = await fetch(`${RAYDIUM_BASE_HOST}/fees/priority`);
        const json = await res.json();
        // json.data.default.h is "high" priority in their doc
        return String(json.data.default.h);
    } catch (e) {
        // fall back to 10000 microLamports
        return '10000';
    }
}

/**
 * Swap SOL -> target token for one wallet
 * @param {import('@solana/web3.js').Keypair} wallet
 * @param {number} amountSol amount of SOL to swap
 */
export async function swapSolToTargetOnRaydium(wallet, amountSol) {
    const connection = new Connection(RPC_ENDPOINT, 'confirmed');

    const amountLamports = Math.round(amountSol * 1_000_000_000);

    const quoteUrl = `${RAYDIUM_SWAP_HOST}/compute/swap-base-in` +
        `?inputMint=${SOL_MINT}` +
        `&outputMint=${TARGET_MINT}` +
        `&amount=${amountLamports}` +
        `&slippageBps=100` + // 1% slippage, adjust if pool is thin
        `&txVersion=V0`;

    const quoteRes = await fetch(quoteUrl);
    const quoteJson = await quoteRes.json();

    if (!quoteJson?.data) {
        throw new Error(`Raydium quote failed: ${JSON.stringify(quoteJson)}`);
    }

    const priorityFee = await fetchPriorityFee();

    const swapRes = await fetch(`${RAYDIUM_SWAP_HOST}/transaction/swap-base-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            swapResponse: quoteJson,
            txVersion: 'V0',
            wallet: wallet.publicKey.toBase58(),
            wrapSol: true,     // because we are swapping from SOL
            unwrapSol: false,  // we are receiving an SPL token
            computeUnitPriceMicroLamports: priorityFee,
            // inputAccount: undefined because input is SOL
            // outputAccount: we can let Raydium create ATA automatically
        }),
    });

    const swapJson = await swapRes.json();

    if (!swapJson?.success) {
        throw new Error(`Raydium swap build failed: ${JSON.stringify(swapJson)}`);
    }

    const txBase64 = swapJson.data?.[0]?.transaction;
    if (!txBase64) {
        throw new Error('No transaction returned from Raydium');
    }

    const txBuffer = Buffer.from(txBase64, 'base64');
    const tx = VersionedTransaction.deserialize(txBuffer);

    tx.sign([wallet]);

    const sig = await connection.sendTransaction(tx, {
        skipPreflight: false,
        maxRetries: 3,
    });

    const latest = await connection.getLatestBlockhash();
    await connection.confirmTransaction(
        {
            signature: sig,
            blockhash: latest.blockhash,
            lastValidBlockHeight: latest.lastValidBlockHeight,
        },
        'confirmed'
    );

    console.log(
        `swapped ${amountSol} SOL for ${TARGET_MINT} from ${wallet.publicKey.toBase58()} | tx: ${sig}`
    );
}
