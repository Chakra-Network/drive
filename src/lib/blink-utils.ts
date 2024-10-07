// src/lib/blink-utils.ts

import { NextResponse } from 'next/server';

export const BLINK_VERSION = '2.1.3'; // Update this version as needed
export const SOLANA_MAINNET_ID = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';

export function addBlinkHeaders(response: Response | NextResponse): Response | NextResponse {
  response.headers.set('X-Action-Version', BLINK_VERSION);
  response.headers.set('X-Blockchain-Ids', SOLANA_MAINNET_ID);
  return response;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createBlinkResponse(body: any, init?: ResponseInit): Response {
  const response = new Response(JSON.stringify(body), init);
  return addBlinkHeaders(response);
}
