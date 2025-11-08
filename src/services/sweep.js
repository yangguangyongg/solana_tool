// src/services/sweep.js
import {
    Connection,
    PublicKey,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
    getAssociatedTokenAddress,
    getAccount,
    getMint,
    createTransferInstruction,
} from '@solana/spl-token';
import { RPC_ENDPOINT } from '../config.js';

// where to collect everything
const COLLECTOR = new PublicKey('F7LgZn7KGQgYGX2eXGAu7E1WbNTJH4sKfLeS9iMpj4RT');

// PMUG mint
const PMUG_MINT = new PublicKey('V8tLkyqHdtzzYCGdsVf5CZ55BsLuvu7F4TchiDhJgem');

// keep some lamports so the PMUG transfer can pay fee
const LAMPORTS_RESERVE = 5000; // you can increase to e.g. 15000 if needed

export async function sweepWallet(connection, wallet) {
    // 1) sweep PMUG first
    await sweepPmug(connection, wallet);
    // 2) then sweep SOL
    await sweepSol(connection, wallet);
}

export async function sweepSol(connection, wallet) {
    const balance = await connection.getBalance(wallet.publicKey);
    if (balance <= LAMPORTS_RESERVE) {
        console.log(`SOL balance too low for ${wallet.publicKey.toBase58()}`);
        return;
    }

    const lamportsToSend = balance - LAMPORTS_RESERVE;

    const tx = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: COLLECTOR,
            lamports: lamportsToSend,
        })
    );

    const sig = await sendAndConfirmTransaction(connection, tx, [wallet], {
        skipPreflight: false,
    });
    console.log(
        `SOL swept from ${wallet.publicKey.toBase58()} -> ${COLLECTOR.toBase58()} | ${lamportsToSend} lamports | tx: ${sig}`
    );
}

export async function sweepPmug(connection, wallet) {
    const mintInfo = await getMint(connection, PMUG_MINT);

    const sourceAta = await getAssociatedTokenAddress(PMUG_MINT, wallet.publicKey);

    let srcAccount;
    try {
        srcAccount = await getAccount(connection, sourceAta);
    } catch {
        console.log(`No PMUG ATA for ${wallet.publicKey.toBase58()}, skip PMUG`);
        return;
    }

    const rawBalance = srcAccount.amount; // bigint
    if (rawBalance === 0n) {
        console.log(`PMUG balance is 0 for ${wallet.publicKey.toBase58()}`);
        return;
    }

    const decimals = mintInfo.decimals;
    if (decimals < 2) {
        // token has 0 or 1 decimal, just send full
        await transferPmug(connection, wallet, sourceAta, rawBalance);
        return;
    }

    // keep 2 decimal places
    const modBase = 10n ** BigInt(decimals - 2);
    const truncated = rawBalance - (rawBalance % modBase);

    if (truncated === 0n) {
        console.log(
            `PMUG balance < 0.01 (after truncate) for ${wallet.publicKey.toBase58()}, skip PMUG`
        );
        return;
    }

    await transferPmug(connection, wallet, sourceAta, truncated);
}

async function transferPmug(connection, wallet, sourceAta, amountRaw) {
    const destAta = await getAssociatedTokenAddress(PMUG_MINT, COLLECTOR);
    const tx = new Transaction().add(
        createTransferInstruction(sourceAta, destAta, wallet.publicKey, amountRaw)
    );

    const sig = await sendAndConfirmTransaction(connection, tx, [wallet]);
    console.log(
        `PMUG swept from ${wallet.publicKey.toBase58()} -> ${COLLECTOR.toBase58()} | ${amountRaw.toString()} raw | tx: ${sig}`
    );
}
