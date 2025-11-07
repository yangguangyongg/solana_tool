import { batchAirdrop } from './services/airdrop.js';

async function main() {
    const recipients = [
        '8U6mzZuHweKtPdAj4HP84JqMFwPVmXLSCRm1jq81XpGz',
        'LxQXStNFg4Evv9HwERuT6naBioPDjxSBkroRTw8xKgC',
    ];

    await batchAirdrop(recipients);
}

main().catch(console.error);
