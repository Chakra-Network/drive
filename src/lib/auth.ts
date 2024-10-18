import { NextRequest } from 'next/server';
import { sign, verify } from 'jsonwebtoken';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { randomBytes } from 'crypto';
import { env } from '@/app/utils/env';
import { StoredSIWSObject } from '@/types';

interface TokenPayload {
  id: string;
  wallet: string;
}

const SIWS_STORAGE_KEY = 'chakra_most_recent_siws_message';

/**
 * Generates a JWT token for a user
 * @param userId - The ID of the user
 * @param walletAddress - The wallet address of the user
 * @returns A JWT token
 */
export function generateToken(publicKey: string): string {
  return sign({ wallet: publicKey }, env.JWT_SECRET, { expiresIn: '24h' });
}

/**
 * Verifies a JWT token from a request
 * @param request - The NextRequest object
 * @returns The token payload if the token is valid, null otherwise
 */
export async function verifyToken(request: NextRequest): Promise<TokenPayload | null> {
  const token = request.headers.get('Authorization')?.split(' ')[1];
  if (!token) return null;

  try {
    const decoded = verify(token, env.JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

/**
 * Verifies a Solana wallet signature
 * @param publicKey - The public key of the wallet
 * @param signature - The signature to verify
 * @param message - The message that was signed
 * @returns True if the signature is valid, false otherwise
 */
export async function verifySignature(
  publicKey: string,
  signature: string,
  message: string
): Promise<boolean> {
  try {
    const publicKeyObj = new PublicKey(publicKey);
    const signatureUint8 = bs58.decode(signature);
    const messageUint8 = new TextEncoder().encode(message);

    return nacl.sign.detached.verify(messageUint8, signatureUint8, publicKeyObj.toBytes());
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

/**
 * Generates an authentication message to be signed by the wallet
 * @param nonce - A unique nonce to prevent replay attacks
 * @returns The message to be signed
 */
export function generateAuthMessage(nonce: string): string {
  return `Sign this message for authentication with Chakra Drive. Nonce: ${nonce}`;
}

/**
 * Generates a random nonce
 * @returns A random nonce as a base64 string
 */
export function generateNonce(): string {
  return randomBytes(32).toString('base64');
}

/**
 * Extracts the bearer token from the Authorization header
 * @param authHeader - The Authorization header value
 * @returns The bearer token if present, null otherwise
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7); // Remove 'Bearer ' prefix
}

/**
 * Checks if a value is a valid Solana public key
 * @param value - The value to check
 * @returns True if the value is a valid Solana public key, false otherwise
 */
export function isValidSolanaPublicKey(value: string): boolean {
  try {
    return PublicKey.isOnCurve(new PublicKey(value).toBytes());
  } catch {
    return false;
  }
}

export function storeSIWSMessageWithNonce(siwsObject: StoredSIWSObject) {
  localStorage.setItem(SIWS_STORAGE_KEY, JSON.stringify(siwsObject));
}

export function retrieveStoredSIWSMessageWithNonce(): StoredSIWSObject | null {
  const siwsMessage = localStorage.getItem(SIWS_STORAGE_KEY);
  if (!siwsMessage) return null;
  return JSON.parse(siwsMessage);
}
