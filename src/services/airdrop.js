import { PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { AIRDROP_AMOUNT } from '../config.js';
import { getConnection } from '../utils/connection.js';
import { loadPayer } from '../utils/payer.js';
import { sleep } from '../utils/sleep.js';

export async function batchAirdrop(recipients, amountSol = AIRDROP_AMOUNT) {
    const connection = getConnection();
    const payer = loadPayer();
    const lamports = Math.round(amountSol * 1_000_000_000);

    console.log('Payer:', payer.publicKey.toBase58());
    console.log('Recipients:', recipients.length);

    for (let i = 0; i < recipients.length; i++) {
        const to = new PublicKey(recipients[i]);
        const tx = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: payer.publicKey,
                toPubkey: to,
                lamports,
            })
        );

        try {
            const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
            console.log(`[${i + 1}/${recipients.length}] OK -> ${to.toBase58()} | ${sig}`);
        } catch (err) {
            console.error(`[${i + 1}/${recipients.length}] FAIL -> ${to.toBase58()} | ${err.message}`);
        }

        await sleep(400);
    }
}
