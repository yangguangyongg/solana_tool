import {
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
import { COLLECTOR } from '../config.js';

const LAMPORTS_RESERVE = 5000;

export async function sweepWallet(connection, wallet, tokenMints = []) {
    // 1) sweep tokens first
    for (const mintStr of tokenMints) {
        await sweepOneToken(connection, wallet, mintStr);
    }
    // 2) then sweep SOL
    await sweepSol(connection, wallet);
}

async function sweepOneToken(connection, wallet, mintStr) {
    const mintPk = new PublicKey(mintStr);
    const mintInfo = await getMint(connection, mintPk);

    const sourceAta = await getAssociatedTokenAddress(mintPk, wallet.publicKey);

    let srcAccount;
    try {
        srcAccount = await getAccount(connection, sourceAta);
    } catch {
        console.log(`no ATA for ${mintStr} on ${wallet.publicKey.toBase58()}`);
        return;
    }

    const rawBalance = srcAccount.amount; // bigint
    if (rawBalance === 0n) {
        console.log(`0 balance for ${mintStr} on ${wallet.publicKey.toBase58()}`);
        return;
    }

    const decimals = mintInfo.decimals;
    let amountToSend = rawBalance;

    if (decimals >= 2) {
        const modBase = 10n ** BigInt(decimals - 2);
        amountToSend = rawBalance - (rawBalance % modBase);
        if (amountToSend === 0n) {
            console.log(`balance < 0.01 for ${mintStr} on ${wallet.publicKey.toBase58()}`);
            return;
        }
    }

    const destAta = await getAssociatedTokenAddress(mintPk, new PublicKey(COLLECTOR));
    const tx = new Transaction().add(
        createTransferInstruction(
            sourceAta,
            destAta,
            wallet.publicKey,
            amountToSend
        )
    );

    const sig = await sendAndConfirmTransaction(connection, tx, [wallet]);
    console.log(
        `swept ${mintStr} from ${wallet.publicKey.toBase58()} -> ${COLLECTOR} | ${amountToSend.toString()} | ${sig}`
    );
}

async function sweepSol(connection, wallet) {
    const balance = await connection.getBalance(wallet.publicKey);
    if (balance <= LAMPORTS_RESERVE) {
        console.log(`SOL too low on ${wallet.publicKey.toBase58()}`);
        return;
    }
    const lamportsToSend = balance - LAMPORTS_RESERVE;

    const tx = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: new PublicKey(COLLECTOR),
            lamports: lamportsToSend,
        })
    );

    const sig = await sendAndConfirmTransaction(connection, tx, [wallet]);
    console.log(
        `swept SOL from ${wallet.publicKey.toBase58()} -> ${COLLECTOR} | ${lamportsToSend} | ${sig}`
    );
}
