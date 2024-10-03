import { PublicKey, Connection, Transaction, SystemProgram } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { env } from '@/app/utils/env';

export async function verifySignature(
  publicKey: string,
  signature: string,
  message: string
): Promise<boolean> {
  try {
    console.log('Verifying signature:', { publicKey, signature, message });
    const publicKeyObj = new PublicKey(publicKey);
    const signatureUint8 = bs58.decode(signature);
    const messageUint8 = bs58.decode(message);
    const result = nacl.sign.detached.verify(messageUint8, signatureUint8, publicKeyObj.toBytes());
    console.log('Signature verification result:', result);
    return result;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

export function generateAuthMessage(nonce: string): string {
  return `Sign this message for authentication. Nonce: ${nonce}`;
}

export async function generateTipBlinkUrl(params: {
  amount: number;
  recipientPublicKey: string;
  senderPublicKey: string;
  fileId: string;
  fileName: string;
}): Promise<string> {
  const { amount, recipientPublicKey, senderPublicKey, fileId, fileName } = params;
  const actionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/tip?amount=${amount}&recipient=${recipientPublicKey}&sender=${senderPublicKey}&fileId=${fileId}&fileName=${encodeURIComponent(fileName)}`;
  return `https://blink.solana.com/?action=${encodeURIComponent(actionUrl)}`;
}

export async function createTipTransaction(
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
  amount: number
): Promise<Transaction> {
  const connection = new Connection(env.NEXT_PUBLIC_RPC_URL);

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports: amount * 1e9, // Convert SOL to lamports
    })
  );

  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPubkey;

  return transaction;
}

export async function sendTipTransaction(
  connection: Connection,
  transaction: Transaction,
  signer: { publicKey: PublicKey; signTransaction: (tx: Transaction) => Promise<Transaction> }
): Promise<string> {
  const signedTransaction = await signer.signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signedTransaction.serialize());
  await connection.confirmTransaction(signature);
  return signature;
}
