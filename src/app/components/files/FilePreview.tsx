import { fetchAndDecryptMultipartBytes } from '@/app/components/client_lib/lit_encryption';
import { FileEntryResponse } from '@/types';
import { useWallet } from '@solana/wallet-adapter-react';
import { Loader2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

function isFileType(
  file: FileEntryResponse
): file is FileEntryResponse & { type: 'file'; url: string } {
  return file.type === 'file' && 'url' in file;
}

function PrivateImagePreview({ file }: { file: FileEntryResponse }) {
  const [processedImageUrl, setProcessedImageUrl] = useState<string>('');
  const { publicKey } = useWallet();
  const [loading, setLoading] = useState(true);
  const processed = useRef(false);

  useEffect(() => {
    const processImage = async () => {
      if (!isFileType(file)) return;
      if (!publicKey) return;
      if (processed.current) return;
      processed.current = true;
      try {
        const fileData = await fetchAndDecryptMultipartBytes(file.url, publicKey);

        const blob = new Blob([fileData], { type: file.mimeType });
        const newProcessedUrl = URL.createObjectURL(blob);

        setProcessedImageUrl(newProcessedUrl);
        setLoading(false);
      } catch (error) {
        console.error('Error processing image:', error);
      }
    };

    processImage();

    // Cleanup function to revoke the blob URL
    return () => {
      if (processedImageUrl) {
        URL.revokeObjectURL(processedImageUrl);
      }
    };
  }, [file, publicKey, processedImageUrl]);

  if (!isFileType(file)) return null;
  if (!publicKey) return null;
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <p className="text-[#142A1D] text-lg font-semibold">Decrypting via Lit Protocol</p>
        <Loader2 className="w-12 h-12 animate-spin text-[#142A1D]" />
      </div>
    );
  }
  if (!processedImageUrl) return null;
  return (
    <div className="flex items-center justify-center">
      <img src={processedImageUrl} alt={file.name} loading="lazy" className="w-full h-full" />
    </div>
  );
}

function ImagePreview({ file }: { file: FileEntryResponse }) {
  if (!isFileType(file)) return null;
  return (
    <div className="flex items-center justify-center">
      <img src={file.url} alt={file.name} className="w-full h-full" />
    </div>
  );
}

function VideoPreview({ file }: { file: FileEntryResponse }): React.ReactElement | null {
  if (!isFileType(file)) return null;
  return (
    <div className="flex items-center justify-center">
      <video controls className="w-full h-full">
        <source src={file.url} type="video/mp4" />
        <track kind="captions" src="" label="English captions" />
      </video>
    </div>
  );
}

function AudioPreview({ file }: { file: FileEntryResponse }): React.ReactElement | null {
  if (!isFileType(file)) return null;
  return (
    <div className="flex items-center justify-center">
      <audio controls>
        <source src={file.url} type="audio/mpeg" />
        <track kind="captions" src="" label="English captions" />
      </audio>
    </div>
  );
}

function PDFPreview({ file }: { file: FileEntryResponse }): React.ReactElement | null {
  if (!isFileType(file)) return null;
  return <iframe src={file.url} title={file.name} className="w-full h-full p-4" />;
}

function TextPreview({ file }: { file: FileEntryResponse }): React.ReactElement | null {
  if (!isFileType(file)) return null;
  return <iframe src={file.url} title={file.name} className="w-full h-full p-4" />;
}

export default function FilePreview({ file }: { file: FileEntryResponse }): React.ReactElement {
  if (!isFileType(file)) {
    return <div>Preview not available for folders</div>;
  }

  const extension = file.name.split('.').pop()?.toLowerCase();

  const unavailablePreview = (
    <div className="flex items-center justify-center w-full h-full text-[#142A1D] text-lg font-semibold">
      Preview unavailable for this file. Download to view.
    </div>
  );

  if (file.isPrivate) {
    if (
      extension === 'jpg' ||
      extension === 'jpeg' ||
      extension === 'png' ||
      extension === 'gif' ||
      extension === 'svg' ||
      extension === 'webp'
    ) {
      return <PrivateImagePreview file={file} />;
    }
    return unavailablePreview;
  }

  if (
    extension === 'jpg' ||
    extension === 'jpeg' ||
    extension === 'png' ||
    extension === 'gif' ||
    extension === 'svg' ||
    extension === 'webp'
  ) {
    return <ImagePreview file={file} />;
  }

  if (extension === 'mp4') {
    return <VideoPreview file={file} />;
  }

  if (extension === 'mp3' || extension === 'wav') {
    return <AudioPreview file={file} />;
  }

  if (extension === 'pdf') {
    return <PDFPreview file={file} />;
  }

  if (extension === 'txt') {
    return <TextPreview file={file} />;
  }

  return unavailablePreview;
}
