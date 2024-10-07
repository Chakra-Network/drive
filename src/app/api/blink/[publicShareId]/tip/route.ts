import prisma from '@/lib/prisma';
import { ACTIONS_CORS_HEADERS, ActionPostRequest, ActionPostResponse } from '@solana/actions';
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import { createBlinkResponse } from '@/lib/blink-utils';
import { getBaseUrl } from '@/lib/utils';

export const POST = async (req: Request) => {
  try {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const publicShareId = pathSegments[pathSegments.length - 2];
    console.log('Received tip request for publicShareId:', publicShareId);

    const body: ActionPostRequest = await req.json();
    console.log('Request body:', body);

    if (body.type === 'external-link') {
      const file = await prisma.fileEntry.findUnique({
        where: { publicShareId },
      });

      if (!file) {
        console.error('File not found for publicShareId:', publicShareId);
        throw new Error('File not found');
      }

      const baseUrl = getBaseUrl();
      const publicShareUrl = `${baseUrl}/share/${publicShareId}`;

      const payload: ActionPostResponse = {
        type: 'external-link',
        externalLink: publicShareUrl,
      };

      return createBlinkResponse(payload, { headers: ACTIONS_CORS_HEADERS });
    }

    let account: PublicKey;
    try {
      account = new PublicKey(body.account);
    } catch (err) {
      console.error('Invalid account provided:', body.account);
      throw new Error("Invalid 'account' provided. It's not a real pubkey");
    }

    const file = await prisma.fileEntry.findUnique({
      where: { publicShareId },
      include: { owner: { select: { publicKey: true } } },
    });

    if (!file) {
      console.error('File not found for publicShareId:', publicShareId);
      throw new Error('File not found');
    }

    console.log('File found:', file);
    console.log('File owner public key:', file.owner.publicKey);

    const amount = parseFloat(url.searchParams.get('amount') || '0.1');

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: account,
        lamports: amount * LAMPORTS_PER_SOL,
        toPubkey: new PublicKey(file.owner.publicKey),
      })
    );

    const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
    if (!SOLANA_RPC_URL) throw new Error('Unable to find RPC url');
    const connection = new Connection(SOLANA_RPC_URL);

    transaction.feePayer = account;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    const payload: ActionPostResponse = {
      type: 'transaction',
      transaction: transaction.serialize({ requireAllSignatures: false }).toString('base64'),
      message: `You're about to tip ${amount} SOL for: ${file.name}`,
    };

    return createBlinkResponse(payload, { headers: ACTIONS_CORS_HEADERS });
  } catch (err) {
    console.error('Error processing tip:', err);
    let message = 'An unknown error occurred';
    if (err instanceof Error) message = err.message;

    return createBlinkResponse({ message }, { headers: ACTIONS_CORS_HEADERS, status: 400 });
  }
};

export const OPTIONS = async () => {
  return createBlinkResponse(null, { headers: ACTIONS_CORS_HEADERS });
};
