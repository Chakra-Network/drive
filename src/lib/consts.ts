// src/app/lib/consts.ts

import { LitNetwork } from '@lit-protocol/constants';

export enum StorageLocation {
  Irys = 'Irys',
  IPFS = 'IPFS',
  Arweave = 'Arweave',
}

export const LOCATION_ICONS = {
  [StorageLocation.Irys]: '/irys.svg',
  [StorageLocation.IPFS]: '/ipfs.svg',
  [StorageLocation.Arweave]: '/arweave.svg',
} as { [key in StorageLocation]: string };

export const ONE_MB_IN_BYTES = 1024 * 1024;

export const LIT_NETWORK = LitNetwork.Datil;

export const INTEGER_BYTE_LENGTH = 4;

export const CURRENT_PRIVATE_VERSION = 1;
