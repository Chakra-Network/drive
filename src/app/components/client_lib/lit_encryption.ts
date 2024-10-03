import * as LitJsSdk from '@lit-protocol/lit-node-client';
import { SessionSigsMap } from '@lit-protocol/types';
import { PublicKey } from '@solana/web3.js';
import { LIT_RPC } from '@lit-protocol/constants';
import { INTEGER_BYTE_LENGTH, LIT_NETWORK } from '@/lib/consts';
import { parseSignInMessage } from '@solana/wallet-standard-util';
import ipfsOnlyHash from 'typestub-ipfs-only-hash';
import nacl from 'tweetnacl';
import axios from 'axios';
import bs58 from 'bs58';
import apiClient from '@/lib/api-client';
import { SiwsObject } from '@/types';
import { retrieveStoredSIWSMessage } from '@/lib/auth';
// @ts-expect-error need to override for importing js as string
// eslint-disable-next-line import/extensions
import litActionCodeContent from '../../../dist/litActionSiws.js?raw';

const litActionCode = litActionCodeContent;

async function calculateLitActionCodeCID(input: string): Promise<string> {
  try {
    const cid = await ipfsOnlyHash.of(input);
    return cid;
  } catch (error) {
    console.error('Error calculating CID for litActionCode:', error);
    throw error;
  }
}

async function conditionsToDecrypt(publicKey: PublicKey) {
  return [
    {
      method: '',
      params: [':userAddress'],
      pdaParams: [],
      pdaInterface: { offset: 0, fields: {} },
      pdaKey: '',
      chain: 'solana',
      returnValueTest: {
        key: '',
        comparator: '=',
        value: publicKey.toBase58(),
      },
    },
    { operator: 'and' },
    {
      method: '',
      params: [':currentActionIpfsId'],
      pdaParams: [],
      pdaInterface: { offset: 0, fields: {} },
      pdaKey: '',
      chain: 'solana',
      returnValueTest: {
        key: '',
        comparator: '=',
        value: await calculateLitActionCodeCID(litActionCode),
      },
    },
  ];
}

class Lit {
  readonly litNodeClient: LitJsSdk.LitNodeClient;

  constructor() {
    this.litNodeClient = new LitJsSdk.LitNodeClient({
      litNetwork: LIT_NETWORK,
      rpcUrl: LIT_RPC.CHRONICLE_YELLOWSTONE,
    });
  }

  async connect() {
    await this.litNodeClient.connect();
  }

  async encryptEncryptionKey({
    publicKey,
    encryptionKey,
  }: {
    publicKey: PublicKey;
    encryptionKey: nacl.BoxKeyPair;
  }): Promise<{ dataToEncryptHash: string; ciphertext: string }> {
    const solRpcConditions = await conditionsToDecrypt(publicKey);
    const { ciphertext, dataToEncryptHash } = await this.litNodeClient.encrypt({
      dataToEncrypt: Buffer.from(Buffer.from(encryptionKey.secretKey).toString('base64')),
      solRpcConditions,
    });
    return { dataToEncryptHash, ciphertext };
  }

  async decryptEncryptionKey({
    publicKey,
    ciphertext,
    dataToEncryptHash,
    sessionSigs,
    siwsObject,
  }: {
    publicKey: PublicKey;
    ciphertext: string;
    dataToEncryptHash: string;
    sessionSigs: SessionSigsMap;
    siwsObject: SiwsObject;
  }): Promise<nacl.BoxKeyPair> {
    const solRpcConditions = await conditionsToDecrypt(publicKey);
    const response = await this.litNodeClient.executeJs({
      code: litActionCode,
      sessionSigs,
      jsParams: {
        siwsObject: JSON.stringify(siwsObject),
        solRpcConditions,
        ciphertext,
        dataToEncryptHash,
      },
    });
    const decryptedKey = nacl.box.keyPair.fromSecretKey(
      Buffer.from(response.response as string, 'base64')
    );
    return decryptedKey;
  }
}

const lit = new Lit();
let connected = false;

async function getLit(): Promise<Lit> {
  if (!connected) {
    await lit.connect();
    connected = true;
  }
  return lit;
}

function integerToBytes(numInput: number): Uint8Array {
  // Ensure the number is an integer
  let num = Math.floor(numInput);

  const bytes = new Uint8Array(INTEGER_BYTE_LENGTH);

  for (let i = 0; i < INTEGER_BYTE_LENGTH; i++) {
    bytes[INTEGER_BYTE_LENGTH - 1 - i] = num & 0xff;
    num >>= 8;
  }

  return bytes;
}

function encrypt(message: Uint8Array, publicKey: Uint8Array, secretKey: Uint8Array): Uint8Array {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);

  const encrypted = nacl.box(message, nonce, publicKey, secretKey);

  const fullMessage = new Uint8Array(nonce.length + encrypted.length);
  fullMessage.set(nonce);
  fullMessage.set(encrypted, nonce.length);

  return fullMessage;
}

function concatenateUint8Arrays(
  array1: Uint8Array,
  array2: Uint8Array,
  array3: Uint8Array
): Uint8Array {
  const totalLength = array1.byteLength + array2.byteLength + array3.byteLength;
  const result = new Uint8Array(totalLength);

  let offset = 0;
  result.set(array1, offset);
  offset += array1.byteLength;

  result.set(array2, offset);
  offset += array2.byteLength;

  result.set(array3, offset);

  return result;
}

function bytesToInteger(bytes: Uint8Array): number {
  return bytes.reduce((acc, byte) => acc * 256 + byte, 0);
}

async function constructMultipartEncryptedBytes(
  publicKey: PublicKey,
  file: File
): Promise<Uint8Array> {
  const encryptionKey = nacl.box.keyPair();
  const { dataToEncryptHash, ciphertext } = await (
    await getLit()
  ).encryptEncryptionKey({
    publicKey,
    encryptionKey,
  });
  const encyptedEncryptionKey = Buffer.from(
    JSON.stringify({
      dataToEncryptHash,
      ciphertext,
    })
  );
  console.log('encrypted encryption key length', encyptedEncryptionKey.length);
  const encryptedMessage = encrypt(
    new Uint8Array(await file.arrayBuffer()),
    encryptionKey.publicKey,
    encryptionKey.secretKey
  );
  const buffer = concatenateUint8Arrays(
    integerToBytes(encyptedEncryptionKey.length),
    encyptedEncryptionKey,
    encryptedMessage
  );
  return buffer;
}

async function fetchSessionSigs(publicKey: PublicKey): Promise<SessionSigsMap> {
  const {
    data: { sessionSigs },
  } = await apiClient.decrypt.sessionSigs({
    publicKey,
  });
  return sessionSigs;
}

async function fetchEncryptedEncryptionKey(keyAndFileUrl: string): Promise<{
  ciphertext: string;
  dataToEncryptHash: string;
  encryptedMessage: Uint8Array;
}> {
  const response = await axios.get(keyAndFileUrl, {
    responseType: 'arraybuffer',
  });
  const body = new Uint8Array(response.data);
  const frontBufferLength = bytesToInteger(body.slice(0, INTEGER_BYTE_LENGTH));
  const frontBuffer = body.slice(INTEGER_BYTE_LENGTH, frontBufferLength + INTEGER_BYTE_LENGTH);
  const encryptedMessage = body.slice(frontBufferLength + INTEGER_BYTE_LENGTH);

  const { ciphertext, dataToEncryptHash } = JSON.parse(Buffer.from(frontBuffer).toString());
  return { ciphertext, dataToEncryptHash, encryptedMessage };
}

function decrypt(
  encryptedMessage: Uint8Array,
  publicKey: Uint8Array,
  secretKey: Uint8Array
): Uint8Array {
  // Extract the nonce
  const nonce = encryptedMessage.subarray(0, nacl.box.nonceLength);

  // Extract the message
  const message = encryptedMessage.subarray(nacl.box.nonceLength, encryptedMessage.length);

  const decrypted = nacl.box.open(message, nonce, publicKey, secretKey);

  if (!decrypted) {
    throw new Error('Failed to decrypt message');
  }

  return decrypted;
}

// use this function when fetching a url that contains a file constructed from the `constructMultipartEncryptedBytes` function above
async function fetchAndDecryptMultipartBytes(
  keyAndFileUrl: string,
  publicKey: PublicKey
): Promise<Uint8Array> {
  const [{ ciphertext, dataToEncryptHash, encryptedMessage }, sessionSigs] = await Promise.all([
    fetchEncryptedEncryptionKey(keyAndFileUrl),
    fetchSessionSigs(publicKey),
  ]);

  const storedSIWSObject = retrieveStoredSIWSMessage();

  if (!storedSIWSObject) {
    // TODO: if there's no object here, ask for the user to sign a new SIWS message again
    throw new Error('Failed to retrieve sign in message or signature');
  }

  const { b58SignInMessage, b58Signature } = storedSIWSObject;

  const signInMessageBytes = bs58.decode(b58SignInMessage);
  const solanaSignInObject = parseSignInMessage(signInMessageBytes);

  if (!solanaSignInObject) {
    throw new Error('Failed to parse sign in message');
  }

  // TODO: if the solana sign in object is expired, we need to ask the user to sign a new SIWS message

  const decryptedKey = await (
    await getLit()
  ).decryptEncryptionKey({
    publicKey,
    ciphertext,
    dataToEncryptHash,
    sessionSigs,
    siwsObject: {
      siwsInput: solanaSignInObject,
      signature: b58Signature,
    },
  });

  const decryptedMessage = decrypt(
    encryptedMessage,
    decryptedKey.publicKey,
    decryptedKey.secretKey
  );

  return decryptedMessage;
}

export { constructMultipartEncryptedBytes, fetchAndDecryptMultipartBytes };
