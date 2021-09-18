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

async function mineCurrentHolder(tokenAccount: string): Promise<string | undefined> {
    const programAccounts = await connection.getParsedProgramAccounts(
        tokenProgramId, {
        filters: [
            { dataSize: 165 },
            { memcmp: { offset: 0, bytes: tokenAccount } }
        ]
    })

    const programAccount = programAccounts.pop()!
    const holderAccount = await connection.getParsedAccountInfo(programAccount.pubkey)
    const data: any = holderAccount.value?.data.valueOf();
    return data?.parsed?.info?.owner
}

async function main() {
    const lineReader = createInterface({
        input: createReadStream(tokenAddressLog),
        crlfDelay: Infinity
    });

    for await (const line of lineReader) {
        const tokenAccount = line.split(' ').pop()!
        const currentHolder = await pRetry(async () => await mineCurrentHolder(tokenAccount), {
            onFailedAttempt: (err) => console.error(`mining ${tokenAccount} failed.`, err),
            retries: 4,
        })
        console.log(currentHolder)
        await sleep(parseInt(chill, 10))
    }
}

(async () => await main())();