import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import {
  LitAccessControlConditionResource,
  LitAbility,
  createSiweMessage,
  generateAuthSig,
  LitActionResource,
} from '@lit-protocol/auth-helpers';
import { LitResourceAbilityRequest, SessionSigsMap } from '@lit-protocol/types';
import { LitNodeClientNodeJs } from '@lit-protocol/lit-node-client-nodejs';
import { LIT_RPC } from '@lit-protocol/constants';
import { env } from '@/app/utils/env';
import { LIT_NETWORK } from '@/lib/consts';

async function generateSessionSignatures(publicKey: string): Promise<SessionSigsMap> {
  const provider = new ethers.providers.StaticJsonRpcProvider({
    url: LIT_RPC.CHRONICLE_YELLOWSTONE,
    skipFetchSetup: true,
  });

  const walletWithCapacityCredit = new ethers.Wallet(env.LIT_PRIVATE_KEY || '', provider);

  if (!publicKey) {
    throw new Error('Public key is required');
  }

  const litNodeClient = new LitNodeClientNodeJs({
    litNetwork: LIT_NETWORK,
    debug: process.env.NODE_ENV === 'development',
  });
  await litNodeClient.connect();

  const { capacityDelegationAuthSig } = await litNodeClient.createCapacityDelegationAuthSig({
    uses: '1',
    dAppOwnerWallet: walletWithCapacityCredit,
    capacityTokenId: env.LIT_CAPACITY_CREDIT_TOKEN_ID,
    delegateeAddresses: [walletWithCapacityCredit.address],
  });

  // Get the session signatures
  const sessionSigs = await litNodeClient.getSessionSigs({
    chain: 'ethereum',
    expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes
    capacityDelegationAuthSig,
    resourceAbilityRequests: [
      {
        resource: new LitAccessControlConditionResource('*'),
        ability: LitAbility.AccessControlConditionDecryption,
      },
      {
        resource: new LitActionResource('*'),
        ability: LitAbility.LitActionExecution,
      },
    ],
    authNeededCallback: async ({
      uri,
      expiration,
      resourceAbilityRequests,
    }: {
      uri?: string;
      expiration?: string;
      resourceAbilityRequests?: LitResourceAbilityRequest[];
    }) => {
      const toSign = await createSiweMessage({
        uri,
        expiration,
        resources: resourceAbilityRequests,
        walletAddress: await walletWithCapacityCredit.getAddress(),
        nonce: await litNodeClient.getLatestBlockhash(),
        litNodeClient,
      });

      return generateAuthSig({
        signer: walletWithCapacityCredit,
        toSign,
      });
    },
  });

  return sessionSigs;
}

export async function POST(req: NextRequest) {
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 5_000; // 5 seconds

  async function attemptSessionSigGeneration(publicKey: string): Promise<NextResponse> {
    return new Promise(resolve => {
      let attempt = 0;

      const tryGenerateSessionSigs = () => {
        generateSessionSignatures(publicKey)
          .then(sessionSigs => {
            resolve(
              NextResponse.json(
                { message: 'Session signatures generated successfully', sessionSigs },
                { status: 200 }
              )
            );
          })
          .catch(error => {
            console.error(`Error generating session signatures (attempt ${attempt + 1}):`, error);

            if (attempt < MAX_RETRIES - 1) {
              console.log(`Retrying in ${RETRY_DELAY}ms...`);
              attempt++;
              setTimeout(tryGenerateSessionSigs, RETRY_DELAY);
            } else {
              console.error('Max retries reached. Failing...');
              resolve(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
            }
          });
      };

      tryGenerateSessionSigs();
    });
  }

  try {
    const body = await req.json();
    const { publicKey } = body as { publicKey: string };
    return await attemptSessionSigGeneration(publicKey);
  } catch (error) {
    console.error('Error parsing request:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
