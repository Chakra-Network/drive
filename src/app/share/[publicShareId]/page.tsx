'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@tiplink/wallet-adapter-react-ui';
import { TipLinkWalletAdapter } from '@tiplink/wallet-adapter';
import { env } from '@/app/utils/env';
import { NotificationProvider } from '@/context/notification';
import apiClient from '@/lib/api-client';
import { FileEntryResponse, PublicFileViewResponse } from '@/types';
import { Loader2, Download } from 'lucide-react';
import { WalletMultiButton } from '@/app/components/wallet_connect_button/WalletMultiButton';
import TipButton from '@/app/components/TipButton';
import FilePreview from '@/app/components/files/FilePreview';
import { Button } from '@/app/components/ui/button';

export default function PublicFilePage() {
  const { publicShareId } = useParams();
  const [file, setFile] = useState<FileEntryResponse | null>(null);
  const [ownerPublicKey, setOwnerPublicKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const response = await apiClient.fileentry.getPublic(publicShareId as string);
        if (response.data.success) {
          const publicFileViewResponse = response.data.data as PublicFileViewResponse;
          setFile(publicFileViewResponse.file);
          setOwnerPublicKey(publicFileViewResponse.ownerPublicKey);
        } else {
          setError('Failed to fetch file');
        }
      } catch (err) {
        setError('An error occurred while fetching the file');
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
  }, [publicShareId]);

  const handleDownload = () => {
    if (file && file.type === 'file' && file.url) {
      window.open(file.url, '_blank');
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      );
    }

    if (error) {
      return <div className="text-red-500 text-center p-8">{error}</div>;
    }

    if (!file || !ownerPublicKey) {
      return <div className="text-center p-8">File not found</div>;
    }

    return (
      <>
        <div className="p-6 border-b flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{file.name}</h1>
            <p className="text-sm text-gray-600">
              Shared by: {ownerPublicKey.slice(0, 6)}...{ownerPublicKey.slice(-4)}
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
            <TipButton fileId={file.id} fileName={file.name} recipientPublicKey={ownerPublicKey} />
          </div>
        </div>
      </>
    );
  };

  return (
    <ConnectionProvider endpoint={env.NEXT_PUBLIC_RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <NotificationProvider>
            <div className="min-h-screen w-full bg-gray-50 flex justify-center items-center p-4">
              <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg overflow-hidden">
                {renderContent()}
              </div>
            </div>
          </NotificationProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
