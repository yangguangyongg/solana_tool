import { Connection } from '@solana/web3.js';
import { RPC_ENDPOINT } from '../config.js';

export function getConnection() {
    return new Connection(RPC_ENDPOINT, 'confirmed');
}
