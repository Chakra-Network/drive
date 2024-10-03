import { LitContracts } from '@lit-protocol/contracts-sdk';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { LIT_NETWORK } from '../src/lib/consts';

dotenv.config();

const RPC_URL = 'https://yellowstone-rpc.litprotocol.com';

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const walletWithCapacityCredit = new ethers.Wallet(process.env.LIT_PRIVATE_KEY || '', provider);

  console.log('walletWithCapacityCredit public key', walletWithCapacityCredit.address);

  const contractClient = new LitContracts({
    signer: walletWithCapacityCredit,
    network: LIT_NETWORK,
  });

  await contractClient.connect();

  // this identifier will be used in delegation requests.
  const { capacityTokenIdStr } = await contractClient.mintCapacityCreditsNFT({
    // requestsPerKilosecond: 80,
    requestsPerDay: 1440000,
    requestsPerSecond: 1000,
    daysUntilUTCMidnightExpiration: 30,
  });

  console.log('capacityTokenIdStr', capacityTokenIdStr);
}

console.log('running');

main().catch(error => {
  console.error(error);
  process.exit(1);
});
