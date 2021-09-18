"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const readline_1 = require("readline");
const fs_1 = require("fs");
const commander_1 = require("commander");
const p_retry_1 = __importDefault(require("p-retry"));
const tokenProgramId = new web3_js_1.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
commander_1.program
    .version('0.0.1')
    .option('-t, --token-address-log <string>', 'token accounts', 'exiled-token-addresses.log')
    .option('-e, --rpc-host <string>', 'rpc host', 'https://api.mainnet-beta.solana.com')
    .option('-c, --chill <number>', 'sleep per token (please be nice to free rpc servers) ', '100')
    .parse();
const { tokenAddressLog, rpcHost, chill } = commander_1.program.opts();
const connection = new web3_js_1.Connection(rpcHost, 'singleGossip');
async function sleep(millis) {
    return new Promise(resolve => setTimeout(resolve, millis));
}
async function mineCurrentHolder(tokenAccount) {
    const programAccounts = await connection.getParsedProgramAccounts(tokenProgramId, {
        filters: [
            { dataSize: 165 },
            { memcmp: { offset: 0, bytes: tokenAccount } }
        ]
    });
    const programAccount = programAccounts.pop();
    const holderAccount = await connection.getParsedAccountInfo(programAccount.pubkey);
    const data = holderAccount.value?.data.valueOf();
    return data?.parsed?.info?.owner;
}
async function main() {
    const lineReader = (0, readline_1.createInterface)({
        input: (0, fs_1.createReadStream)(tokenAddressLog),
        crlfDelay: Infinity
    });
    for await (const line of lineReader) {
        const tokenAccount = line.split(' ').pop();
        const currentHolder = await (0, p_retry_1.default)(async () => await mineCurrentHolder(tokenAccount), {
            onFailedAttempt: (err) => console.error(`mining ${tokenAccount} failed.`, err),
            retries: 4,
        });
        console.log(currentHolder);
        await sleep(parseInt(chill, 10));
    }
}
(async () => await main())();
