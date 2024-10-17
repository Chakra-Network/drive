// src/app/lib/utils.ts

import { SOLANA_MAINNET_CHAIN } from '@solana/wallet-standard-chains';
import { SolanaSignInInputWithRequiredFields } from '@solana/wallet-standard-util';
import { clsx, type ClassValue } from 'clsx';
import dayjs from 'dayjs';
import 'dayjs/locale/en';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { twMerge } from 'tailwind-merge';
import { v4 as uuidv4 } from 'uuid';

dayjs.extend(advancedFormat);
dayjs.locale('en');

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string, format: string = 'DD MMM YYYY'): string {
  return dayjs(date).format(format);
}

export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

export function uint8ArrayToBase64DataUrl(uint8Array: Uint8Array, mimeType: string): string {
  // Convert Uint8Array to regular array
  const numberArray = Array.from(uint8Array);

  // Convert number array to base64 string
  const base64String = btoa(String.fromCharCode.apply(null, numberArray));

  // Create and return the data URL
  return `data:${mimeType};base64,${base64String}`;
}

export function formatFileName(name: string, maxSize = 30): string {
  if (!name) return '';
  if (name.length <= maxSize) return name;

  const charsToShow = maxSize - 3; // Account for the '...'
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);

  return `${name.substring(0, frontChars)}...${name.substring(name.length - backChars)}`;
}

export function createSiwsInput(
  publicKey: string,
  statement: string
): SolanaSignInInputWithRequiredFields {
  const now = new Date();

  return {
    domain: 'drive.chakra.network',
    address: publicKey,
    statement,
    uri: 'https://drive.chakra.network',
    chainId: SOLANA_MAINNET_CHAIN,
    nonce: uuidv4(),
    issuedAt: now.toISOString(),
  };
}

export function formatSolAmount(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 9,
  });
}

export function getBaseUrl(): string {
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}
