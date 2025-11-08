import { batchAirdrop } from './services/airdrop.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadWalletsFromDir } from './utils/loadWalletDir.js';
import { swapSolToTargetOnRaydium } from './services/raydiumBuy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WALLET_DIR = path.join(__dirname, 'wallet');

async function main() {
    //
    const recipients = [
        'J2noiX8NYDtFD28w7vJ6guRsqoNZHnkTzLbR9hoG6DEP',
        'LxQXStNFg4Evv9HwERuT6naBioPDjxSBkroRTw8xKgC',
        'BnAHidbHVMHMeQnbQJcA74VAtaMgVdaX3qr9mZw7FXb2',
        'Gs4rfBAZktheTRcjpLVAKXavwzpXcfoxRd3cFXPYPkMb',
        '6ddi35QGfH2nqNbyWxA7eFkf94tXiJo5vqSp2t4EX2G4',
        '5wboWxvD2ENXWa3YtNi7UwnUcxyB4GSJHXhqP8sF5hqg',
        '83ZwstZv3VffcHAGercz8AnADpdSavTq3VeyHXmTZBki',
        'DsxE5nm7bDrDQQQ4TmBuvq1jwJWupK56bMWn258G1wfV',
        '6Asm8qPzCnErkgD1FSqwhqWSjMiGqv7BhyRrWJZ1dEVJ',
        'HAx6XUUnywH9ZAQmr2FpcjHHWxjG3ciyFn6WtuFuZuE3',
        'F2RY6jJbk9Wibt1AeWyLtHSFL61sdFkJn5Km7TJKxXTH',
        'Fg6A8RuSPLfbi48HwRaikYeHypoPaR9yJkY7ohyuBfCd',
        'CdKsmoEuwEyhAgsXNVnNA3RgQSF9ZNWPuHP5mt6fEZpT',
        'DB2CAfDCtD6YWYJox463o3NXY3Np7wDSoTXEKEMW5224',
        '6btb7WjgP8imazmjPvSqcaHGkp1i3JfMNVBJ6WM4dMsK',
        '9yu5RbFLfJMFBUxro4eS3ntfGyxazDyEvwaqALuPjiSH',
        'JBGVbqGU4apVnqFM9qhahoEkEdHohYh35M7Lrm5WmcLo',
        '4bb67fX6BcninBaky19chsQHpUZa7JxM8NoYF7F29RCn',
        '5CvNzEuaNpHSyCDpT1Rbss6hGA3KWZTEVKTYWzS8Mbvu',
        'DGUUc8B73VSaoDfwMZ1jNDAPxCDVgPSMWAkvvtEjqiZf',
        'D5Dux5QjBJqd6sJcuXUUmrEUE4i9etJK7yNwummjuHeK'
    ];

    // await batchAirdrop(recipients);


    const wallets = loadWalletsFromDir(WALLET_DIR);
    if (wallets.length === 0) {
        console.log('No wallet json files found in', WALLET_DIR);
        return;
    }

    console.log(`Found ${wallets.length} wallets in ${WALLET_DIR}`);

    for (const { name, keypair } of wallets) {
        try {
            // each wallet swaps 0.01 SOL -> target token
            await swapSolToTargetOnRaydium(keypair, 0.01);
            console.log(`✅ done for ${name}`);
        } catch (err) {
            console.error(`❌ failed for ${name}:`, err.message);
        }
    }


}

main().catch(console.error);
