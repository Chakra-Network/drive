import { env } from '@/app/utils/env';
import { UploadResponse } from '@irys/sdk/common/types';
import { WebUSDCSolana } from '@irys/web-upload-solana';
import { WalletContextState } from '@solana/wallet-adapter-react';
import BigNumber from 'bignumber.js';
import { WebUploader } from '@irys/web-upload';
import { Irys } from '@irys/upload-core';
import { BaseWebIrys } from '@irys/sdk/web/base';

class CustomUSDCSolana extends WebUSDCSolana {
  // eslint-disable-next-line class-methods-use-this
  getFee = async () => {
    return {
      computeBudget: new BigNumber(5000),
      computeUnitPrice: new BigNumber(1000),
    };
  };
}

export type WebIrysUploader = Irys & Pick<BaseWebIrys, 'uploadFile'>;

export async function getSignerWebIrys(
  wallet: WalletContextState
): Promise<WebIrysUploader | null> {
  if (!wallet.connected || !wallet.publicKey) {
    console.log('Wallet is not connected or public key is not available');
    return null;
  }

  try {
    const irysUploader = await WebUploader(CustomUSDCSolana)
      .withProvider(wallet)
      .withRpc(env.NEXT_PUBLIC_RPC_URL)
      .build();
    await irysUploader.ready();
    return irysUploader;
  } catch (error: unknown) {
    console.error('Error connecting to Irys:', error);
    return null;
  }
}

export async function webIrysUploadData(
  wallet: WalletContextState,
  data: Uint8Array,
  tags: { name: string; value: string }[]
): Promise<UploadResponse | null> {
  const irys = await getSignerWebIrys(wallet);
  if (!irys) {
    console.error('Failed to initialize WebIrys');
    return null;
  }
  return irys.upload(Buffer.from(data), {
    tags: [
      ...tags,
      {
        name: 'application-name',
        value: 'chakra-drive',
      },
    ],
  });
}

export function getIrysGatewayUrl(fileId: string): string {
  return `https://gateway.irys.xyz/${fileId}`;
}
