import {
    Connection,
    VersionedTransaction,
    PublicKey,
} from '@solana/web3.js';
import fetch from 'node-fetch';
import { RPC_ENDPOINT } from '../config.js';

const JUP_QUOTE_URL = 'https://lite-api.jup.ag/swap/v1/quote';
const JUP_SWAP_URL = 'https://lite-api.jup.ag/swap/v1/swap';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const TARGET_MINT = 'V8tLkyqHdtzzYCGdsVf5CZ55BsLuvu7F4TchiDhJgem';

/**
 * Swape token
 * @param {Keypair} wallet payee
 * @param {number} amountSol spend SOL
 */
export async function buyTokenWithWallet(wallet, amountSol) {
    const connection = new Connection(RPC_ENDPOINT, 'confirmed');

    const amountLamports = Math.round(amountSol * 1_000_000_000);
    const quoteUrl = `${JUP_QUOTE_URL}?inputMint=${SOL_MINT}&outputMint=${TARGET_MINT}&amount=${amountLamports}&slippageBps=100`;
    const quoteRes = await fetch(quoteUrl);
    const quote = await quoteRes.json();

    if (!quote || !quote.outAmount) {
        throw new Error(`Jupiter 没找到路线，可能是流动性不足或者 mint 不在他们列表里`);
    }

    const swapRes = await fetch(JUP_SWAP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            quoteResponse: quote,
            userPublicKey: wallet.publicKey.toBase58(),
            wrapAndUnwrapSol: true,
        }),
    });
    const swapJson = await swapRes.json();

    if (!swapJson.swapTransaction) {
        throw new Error(`Jupiter 没返回 swapTransaction: ${JSON.stringify(swapJson)}`);
    }

    const swapTxBuf = Buffer.from(swapJson.swapTransaction, 'base64');
    const tx = VersionedTransaction.deserialize(swapTxBuf);

    tx.sign([wallet]);

    const sig = await connection.sendRawTransaction(tx.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
    });

    await connection.confirmTransaction(sig, 'confirmed');

    console.log(
        `✅ ${wallet.publicKey.toBase58()} 用 ${amountSol} SOL 买了 ${TARGET_MINT} | tx: ${sig}`
    );
}
