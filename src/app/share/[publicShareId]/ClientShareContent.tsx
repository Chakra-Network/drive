'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  WalletProvider,
  ConnectionProvider,
  useWallet,
  useConnection,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@tiplink/wallet-adapter-react-ui';
import { TipLinkWalletAdapter } from '@tiplink/wallet-adapter';
import { env } from '@/app/utils/env';
import { NotificationProvider, useNotification } from '@/context/notification';
import apiClient from '@/lib/api-client';
import {
  ActionGetResponse,
  ActionPostResponse,
  FileEntryResponse,
  PublicFileViewResponse,
} from '@/types';
import { Loader2, Download } from 'lucide-react';
import { WalletMultiButton } from '@/app/components/wallet_connect_button/WalletMultiButton';
import FilePreview from '@/app/components/files/FilePreview';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Transaction } from '@solana/web3.js';

function ShareContent({ publicShareId }: { publicShareId: string }) {
  const [file, setFile] = useState<FileEntryResponse | null>(null);
  const [actionData, setActionData] = useState<ActionGetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tipAmount, setTipAmount] = useState('');
  const { publicKey, signTransaction, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const { setNotification } = useNotification();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fileResponse = await apiClient.fileentry.getPublic(publicShareId);
        const actionResponse = await apiClient.blink.getPublic(publicShareId);

        if (fileResponse.data.success) {
          setFile((fileResponse.data.data as PublicFileViewResponse).file);
        } else {
          throw new Error(fileResponse.data.error || 'Failed to fetch file data');
        }
        if (actionResponse.data) {
          setActionData(actionResponse.data);
        } else {
          throw new Error('Failed to fetch action data');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [publicShareId]);

  const handleTip = async (amount: number) => {
    if (!connected || !publicKey || !signTransaction || !sendTransaction) {
      setNotification({
        type: 'error',
        title: 'Wallet Not Connected',
        message: 'Please connect your wallet to tip.',
      });
      return;
    }

    try {
      const response = await apiClient.blink.tip(publicShareId, {
        account: publicKey.toBase58(),
        amount,
      });

      if (response.data.success) {
        const { transaction: serializedTransaction } = response.data.data as ActionPostResponse;
        const transaction = Transaction.from(Buffer.from(serializedTransaction, 'base64'));
        const signedTransaction = await signTransaction(transaction);
        const signature = await sendTransaction(signedTransaction, connection);

        setNotification({
          type: 'success',
          title: 'Tip Sent',
          message: `You've successfully sent ${amount} SOL as a tip. Transaction: ${signature}`,
        });

        setTipAmount('');
      } else {
        throw new Error(response.data.error || 'Failed to send tip');
      }
    } catch (err) {
      console.error('Error sending tip:', err);
      setNotification({
        type: 'error',
        title: 'Tip Error',
        message: err instanceof Error ? err.message : 'Failed to send tip. Please try again.',
      });
    }
  };

  const handleDownload = () => {
    if (file && file.type === 'file' && file.url) {
      window.open(file.url, '_blank');
    } else {
      setNotification({
        type: 'error',
        title: 'Download Error',
        message: 'File URL not available',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error || !file || !actionData) {
    return <div className="text-red-500 text-center p-8">{error || 'File not found'}</div>;
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 flex justify-center items-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{file.name}</h1>
            <p className="text-sm text-gray-600">
              Shared by: {file.ownerPK.slice(0, 6)}...{file.ownerPK.slice(-4)}
            </p>
          </div>
          <WalletMultiButton />
        </div>
        <div className="p-6">
          <FilePreview file={file} />
        </div>
        <div className="p-6 bg-gray-50 flex flex-col gap-4">
          {file.type === 'file' && (
            <Button
              onClick={handleDownload}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Download size={16} />
              Download
            </Button>
          )}
          <div className="w-full">
            <h3 className="text-lg font-semibold mb-2 text-black">Tip the creator</h3>
            <div className="flex gap-2 mb-4">
              <Button onClick={() => handleTip(0.1)} disabled={!connected} className="flex-1">
                0.1 SOL
              </Button>
              <Button onClick={() => handleTip(1)} disabled={!connected} className="flex-1">
                1 SOL
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Custom SOL amount"
                value={tipAmount}
                onChange={e => setTipAmount(e.target.value)}
                className="flex-grow placeholder-black text-black"
              />
              <Button
                onClick={() => handleTip(parseFloat(tipAmount))}
                disabled={!connected || !tipAmount || Number.isNaN(parseFloat(tipAmount))}
              >
                Send Tip
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientShareContent({ publicShareId }: { publicShareId: string }) {
  const wallets = useMemo(
    () => [
      new TipLinkWalletAdapter({
        theme: 'light',
        title: 'Chakra Drive',
        clientId: '126f4290-c08a-40c1-b58b-def30f499145',
        hideWalletOnboard: true,
      }),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={env.NEXT_PUBLIC_RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <NotificationProvider>
            <ShareContent publicShareId={publicShareId} />
          </NotificationProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
