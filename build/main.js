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
commander_1.program
    .version('0.0.1')
    .option('-t, --token-address-log <string>', 'token accounts')
    .option('-e, --rpc-host <string>', 'rpc host', 'https://api.mainnet-beta.solana.com')
    .option('-c, --chill <number>', 'sleep per token (please be nice to free rpc servers) ', '100')
    .parse();
const { tokenAddressLog, rpcHost, chill } = commander_1.program.opts();
const connection = new web3_js_1.Connection(rpcHost, 'singleGossip');
async function sleep(millis) {
    return new Promise(resolve => setTimeout(resolve, millis));
}
async function mineCurrentHolder(tokenAccount) {
    const largestAccounts = await connection.getTokenLargestAccounts(new web3_js_1.PublicKey(tokenAccount));
    const largestPDA = largestAccounts.value.shift();
    const largestWallet = await connection.getParsedAccountInfo(largestPDA?.address);
    const data = largestWallet.value?.data.valueOf();
    //@ts-ignore
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
