import { Connection, PublicKey } from "@solana/web3.js"
import { createInterface } from 'readline';
import { createReadStream } from 'fs';
import { program } from 'commander'
import pRetry from 'p-retry';

const tokenProgramId = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")

program
    .version('0.0.1')
    .option('-t, --token-address-log <string>', 'token accounts', 'exiled-token-addresses.log')
    .option('-e, --rpc-host <string>', 'rpc host', 'https://api.mainnet-beta.solana.com')
    .option('-c, --chill <number>', 'sleep per token (please be nice to free rpc servers) ', '100')
    .parse()

const { tokenAddressLog, rpcHost, chill } = program.opts()
const connection = new Connection(rpcHost, 'singleGossip')

async function sleep(millis: number) {
    return new Promise(resolve => setTimeout(resolve, millis));
}

async function mineOwner(tokenAddress: string): Promise<string | undefined> {
    const programAccounts = await connection.getParsedProgramAccounts(
        tokenProgramId, {
        filters: [
            { dataSize: 165 },
            { memcmp: { offset: 0, bytes: tokenAddress } }
        ]
    })

    for (const programAccount of programAccounts) {
        const holderAccount = await connection.getParsedAccountInfo(programAccount.pubkey)
        const data: any = holderAccount.value?.data.valueOf();
        const owner = data?.parsed?.info?.owner
        return owner
    }
}

async function main() {
    const lineReader = createInterface({
        input: createReadStream(tokenAddressLog),
        crlfDelay: Infinity
    });

    for await (const line of lineReader) {
        const tokenAddress = line.split(' ').pop()!
        const holder = await pRetry(async () => await mineOwner(tokenAddress), {
            retries: 4,
            onFailedAttempt: (err) => {
                console.error(`mining ${tokenAddress} failed.`, err);
            },
        })
        console.log(holder)
        await sleep(parseInt(chill, 10))
    }
}

(async () => await main())();