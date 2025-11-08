import {
    Connection,
    VersionedTransaction,
    PublicKey,
} from '@solana/web3.js';
import fetch from 'node-fetch';
import { RPC_ENDPOINT } from '../config.js';

const RAYDIUM_SWAP_HOST = 'https://transaction-v1.raydium.io';
const RAYDIUM_BASE_HOST = 'https://api-v3.raydium.io';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

async function fetchPriorityFee() {
    try {
        const res = await fetch(`${RAYDIUM_BASE_HOST}/fees/priority`);
        const json = await res.json();
        return String(json.data.default.h);
    } catch {
        return '10000';
    }
}

export async function raydiumSwapSolToToken(wallet, tokenMint, amountSol) {
    const connection = new Connection(RPC_ENDPOINT, 'confirmed');
    const amountLamports = Math.round(amountSol * 1_000_000_000);

    const quoteUrl =
        `${RAYDIUM_SWAP_HOST}/compute/swap-base-in` +
        `?inputMint=${SOL_MINT}` +
        `&outputMint=${tokenMint}` +
        `&amount=${amountLamports}` +
        `&slippageBps=100` +
        `&txVersion=V0`;

    const quoteRes = await fetch(quoteUrl);
    const quoteJson = await quoteRes.json();
    if (!quoteJson?.data) {
        throw new Error(`raydium quote failed for ${wallet.publicKey.toBase58()}`);
    }

    const priority = await fetchPriorityFee();

    const swapRes = await fetch(`${RAYDIUM_SWAP_HOST}/transaction/swap-base-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            swapResponse: quoteJson,
            txVersion: 'V0',
            wallet: wallet.publicKey.toBase58(),
            wrapSol: true,
            unwrapSol: false,
            computeUnitPriceMicroLamports: priority,
        }),
    });
    const swapJson = await swapRes.json();
    if (!swapJson?.success) {
        throw new Error(`raydium build failed: ${JSON.stringify(swapJson)}`);
    }

    const txBase64 = swapJson.data?.[0]?.transaction;
    if (!txBase64) {
        throw new Error('raydium transaction missing');
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
        { signature: sig, ...latest },
        'confirmed'
    );

    console.log(
        `raydium swap done for ${wallet.publicKey.toBase58()} | ${amountSol} SOL -> ${tokenMint} | ${sig}`
    );
}
