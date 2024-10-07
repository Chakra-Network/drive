import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { env } from '@/app/utils/env';
import { useNotification } from '@/context/notification';
import { createTipTransaction, sendTipTransaction } from '@/lib/solana';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { useState } from 'react';

interface TipButtonProps {
  fileId: string;
  fileName: string;
  recipientPublicKey: string;
}

export default function TipButton({ fileId, fileName, recipientPublicKey }: TipButtonProps) {
  const [customAmount, setCustomAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { publicKey, signTransaction } = useWallet();
  const { setNotification } = useNotification();

  const handleTip = async (tipAmount: number) => {
    if (!publicKey || !signTransaction) {
      setNotification({
        type: 'error',
        title: 'Wallet Not Connected',
        message: 'Please connect your wallet to tip.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const transaction = await createTipTransaction(
        publicKey,
        new PublicKey(recipientPublicKey),
        tipAmount
      );

      const connection = new Connection(env.NEXT_PUBLIC_RPC_URL);
      const signature = await sendTipTransaction(connection, transaction, {
        publicKey,
        signTransaction,
      });

      console.log(`Tip transaction sent for file ${fileId}:`, signature);

      setNotification({
        type: 'success',
        title: 'Tip Sent',
        message: `You've successfully sent ${tipAmount} SOL as a tip for "${fileName}". Transaction: ${signature}`,
      });

      setCustomAmount('');
    } catch (error) {
      console.error(`Error sending tip for file ${fileId}:`, error);
      setNotification({
        type: 'error',
        title: 'Tip Error',
        message: `Failed to send tip for "${fileName}". Please try again.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="text-black pt-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Send a tip for &ldquo;{fileName}&rdquo;</h3>
      <p className="text-sm text-gray-600 mb-4">
        Choose an amount or enter a custom tip for the creator of this file.
      </p>
      <div className="flex gap-2 mb-4">
        <Button onClick={() => handleTip(0.1)} disabled={isLoading} className="flex-1">
          0.1 SOL
        </Button>
        <Button onClick={() => handleTip(1)} disabled={isLoading} className="flex-1">
          1 SOL
        </Button>
      </div>
      <div className="flex gap-2">
        <Input
          type="number"
          placeholder="Custom SOL amount"
          value={customAmount}
          onChange={e => setCustomAmount(e.target.value)}
          className="flex-grow"
        />
        <Button
          onClick={() => handleTip(parseFloat(customAmount))}
          disabled={isLoading || !customAmount || Number.isNaN(parseFloat(customAmount))}
        >
          Send Tip
        </Button>
      </div>
      {isLoading && <p className="text-sm text-gray-500 mt-2 text-center">Processing tip...</p>}
    </div>
  );
}
