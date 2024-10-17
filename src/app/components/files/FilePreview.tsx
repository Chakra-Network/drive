import React, { useState, useEffect, useMemo } from 'react';
import { FileEntryResponse } from '@/types';
import { useWallet } from '@solana/wallet-adapter-react';
import { fetchAndDecryptMultipartBytes } from '@/app/components/client_lib/lit_encryption';
import { Download, Loader2, FileIcon, FileVideo } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useDevice } from '@/context/device';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { useNotification } from '@/context/notification';
import { handleDownloadClicked } from '@/app/components/files/FileActions/AllFileActionsMenu';

type FilePreviewContentProps = {
  url: string;
  mimeType: string;
  fileName: string;
};

const mimeTypeMap: Record<string, string> = {
  avi: 'video/x-msvideo',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  wmv: 'video/x-ms-wmv',
  flv: 'video/x-flv',
  webm: 'video/webm',
  mkv: 'video/x-matroska',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  flac: 'audio/flac',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  webp: 'image/webp',
  tiff: 'image/tiff',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  csv: 'text/csv',
  html: 'text/html',
  css: 'text/css',
  js: 'application/javascript',
  jsx: 'application/javascript',
  ts: 'application/typescript',
  tsx: 'application/typescript',
  json: 'application/json',
  xml: 'application/xml',
  md: 'text/markdown',
  py: 'text/x-python',
  rb: 'text/x-ruby',
  php: 'text/x-php',
  java: 'text/x-java-source',
  c: 'text/x-c',
  cpp: 'text/x-c++src',
  cs: 'text/x-csharp',
  go: 'text/x-go',
  rs: 'text/x-rust',
  swift: 'text/x-swift',
  kt: 'text/x-kotlin',
  scala: 'text/x-scala',
  sql: 'text/x-sql',
};

const isFileType = (
  file: FileEntryResponse
): file is FileEntryResponse & { type: 'file'; url: string } => {
  return file.type === 'file' && 'url' in file;
};

const getMimeType = (fileName: string, defaultMimeType: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();

  // Special handling for AVI and MOV files
  if (['avi', 'mov'].includes(extension || '')) {
    return 'video/mp4'; // This is a more widely supported format
  }

  return extension && mimeTypeMap[extension] ? mimeTypeMap[extension] : defaultMimeType;
};

const ImagePreview: React.FC<{ url: string; fileName: string }> = ({ url, fileName }) => {
  const { isMobile } = useDevice();
  return (
    <div
      className={`flex items-center justify-center w-full ${isMobile ? 'h-[50vh]' : 'h-[70vh]'}`}
    >
      <img src={url} alt={fileName} className="w-full h-full object-contain" />
    </div>
  );
};

const VideoPreview: React.FC<{ url: string; mimeType: string; fileName: string }> = ({
  url,
  mimeType,
  fileName,
}) => {
  const [error, setError] = useState(false);
  const { isMobile } = useDevice();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-4 bg-gray-100 rounded">
        <FileVideo className="w-12 h-12 text-gray-400" />
        <p className="text-base font-semibold text-black text-center">
          Video playback is not supported
        </p>
        <p className="text-sm text-black text-center">
          Your browser doesn&apos;t support playing this video format directly.
        </p>
        <Button
          onClick={() => window.open(url, '_blank')}
          className="flex items-center bg-green-600 text-white text-sm"
        >
          <Download className="mr-2" size={14} />
          Download {fileName}
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center w-full ${isMobile ? 'h-[50vh]' : 'h-[70vh]'}`}
    >
      <video controls className="w-full h-full object-contain" onError={() => setError(true)}>
        <source src={url} type={mimeType} />
        <track kind="captions" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

const AudioPreview: React.FC<{ url: string; mimeType: string }> = ({ url, mimeType }) => (
  <div className="flex items-center justify-center w-full p-4">
    <audio controls className="w-full max-w-md">
      <source src={url} type={mimeType} />
      <track kind="captions" />
      Your browser does not support the audio tag.
    </audio>
  </div>
);

const PDFPreview: React.FC<{ url: string; fileName: string }> = ({ url, fileName }) => {
  const { isMobile } = useDevice();
  return (
    <iframe
      src={url}
      title={fileName}
      className={`w-full ${isMobile ? 'h-[50vh]' : 'h-[70vh]'} border-none`}
    />
  );
};

const CodePreview: React.FC<{ content: string; language: string }> = ({ content, language }) => {
  const { isMobile } = useDevice();

  return (
    <div
      className={`w-full ${isMobile ? 'h-[50vh]' : 'h-[70vh]'} overflow-auto bg-gray-100 rounded p-4`}
    >
      <SyntaxHighlighter
        language={language}
        style={docco}
        customStyle={{ fontSize: isMobile ? '12px' : '14px' }}
        wrapLines
        wrapLongLines
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
};

const TextPreview: React.FC<{ content: string }> = ({ content }) => {
  const { isMobile } = useDevice();

  return (
    <div
      className={`w-full ${isMobile ? 'h-[50vh]' : 'h-[70vh]'} overflow-auto bg-gray-100 rounded p-4`}
    >
      <pre className="whitespace-pre-wrap break-words text-black font-mono text-xs sm:text-sm">
        {content}
      </pre>
    </div>
  );
};

const OfficePreview: React.FC<{ url: string; fileName: string }> = ({ url, fileName }) => {
  const { isMobile } = useDevice();
  return (
    <iframe
      src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
      title={fileName}
      className={`w-full ${isMobile ? 'h-[50vh]' : 'h-[70vh]'} border-none`}
    />
  );
};

const GenericPreview: React.FC<{ fileName: string; mimeType: string; url: string }> = ({
  fileName,
  mimeType,
  url,
}) => {
  const { isMobile } = useDevice();

  return (
    <div
      className={`flex flex-col items-center justify-center space-y-4 p-4 bg-gray-100 rounded ${isMobile ? 'h-[50vh]' : 'h-[70vh]'}`}
    >
      <FileIcon className="w-12 h-12 text-gray-400" />
      <p className="text-base font-semibold text-black text-center">
        Preview not available for this file type
      </p>
      <p className="text-sm text-black text-center">File name: {fileName}</p>
      <p className="text-sm text-black text-center">File type: {mimeType}</p>
      <Button
        onClick={() => window.open(url, '_blank')}
        className="flex items-center bg-green-600 text-white text-sm"
      >
        <Download className="mr-2" size={14} />
        Download File
      </Button>
    </div>
  );
};

const FilePreviewContent: React.FC<FilePreviewContentProps> = ({ url, mimeType, fileName }) => {
  const [content, setContent] = useState<string>('');
  // const { isMobile } = useDevice();

  useEffect(() => {
    const fetchContent = async () => {
      if (
        mimeType.startsWith('text/') ||
        mimeType === 'application/json' ||
        mimeType === 'application/xml' ||
        mimeType === 'application/javascript' ||
        mimeType === 'application/typescript'
      ) {
        try {
          const response = await fetch(url);
          const text = await response.text();
          setContent(text);
        } catch (error) {
          console.error('Error fetching text content:', error);
          setContent('Error loading content');
        }
      }
    };

    fetchContent();
  }, [url, mimeType]);

  if (mimeType.startsWith('image/')) {
    return <ImagePreview url={url} fileName={fileName} />;
  }

  if (mimeType.startsWith('video/')) {
    return <VideoPreview url={url} mimeType={mimeType} fileName={fileName} />;
  }

  if (mimeType.startsWith('audio/')) {
    return <AudioPreview url={url} mimeType={mimeType} />;
  }

  if (mimeType === 'application/pdf') {
    return <PDFPreview url={url} fileName={fileName} />;
  }

  const programmingLanguages = {
    'text/x-python': 'python',
    'text/x-ruby': 'ruby',
    'text/x-php': 'php',
    'text/x-java-source': 'java',
    'text/x-c': 'c',
    'text/x-c++src': 'cpp',
    'text/x-csharp': 'csharp',
    'text/x-go': 'go',
    'text/x-rust': 'rust',
    'text/x-swift': 'swift',
    'text/x-kotlin': 'kotlin',
    'text/x-scala': 'scala',
    'application/javascript': 'javascript',
    'application/typescript': 'typescript',
    'text/x-sql': 'sql',
  };

  if (mimeType in programmingLanguages) {
    return (
      <CodePreview
        content={content}
        language={programmingLanguages[mimeType as keyof typeof programmingLanguages]}
      />
    );
  }

  if (
    mimeType.startsWith('text/') ||
    mimeType === 'application/json' ||
    mimeType === 'application/xml'
  ) {
    return <TextPreview content={content} />;
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.ms-excel' ||
    mimeType === 'application/vnd.ms-powerpoint'
  ) {
    return <OfficePreview url={url} fileName={fileName} />;
  }

  return <GenericPreview fileName={fileName} mimeType={mimeType} url={url} />;
};

const PrivateFilePreview: React.FC<{ file: FileEntryResponse; mimeType: string }> = ({
  file,
  mimeType,
}) => {
  const [processedUrl, setProcessedUrl] = useState<string>('');
  const { publicKey, signMessage } = useWallet();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isMobile } = useDevice();

  useEffect(() => {
    let newProcessedUrl = '';
    const processFile = async () => {
      if (!isFileType(file) || !publicKey || !signMessage) return;
      try {
        const fileData = await fetchAndDecryptMultipartBytes(
          file.url,
          publicKey,
          file.privateVersion,
          signMessage,
          () => {
            setError('Failed to decrypt file. Please try again.');
          }
        );
        const blob = new Blob([fileData], { type: mimeType });
        newProcessedUrl = URL.createObjectURL(blob);
        setProcessedUrl(newProcessedUrl);
      } catch (err) {
        console.error('Error processing file:', err);
        setError('Failed to decrypt file. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    processFile();

    return () => {
      if (newProcessedUrl) URL.revokeObjectURL(newProcessedUrl);
    };
  }, [file, publicKey, mimeType, signMessage]);

  if (loading) {
    return (
      <div
        className={`flex flex-col items-center justify-center space-y-4 ${isMobile ? 'h-[50vh]' : 'h-[70vh]'}`}
      >
        <p className="text-black text-lg font-semibold">Decrypting via Lit Protocol</p>
        <Loader2 className="w-12 h-12 animate-spin text-black" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex flex-col items-center justify-center space-y-4 ${isMobile ? 'h-[50vh]' : 'h-[70vh]'} bg-gray-100`}
      >
        <p className="text-red-500 text-lg font-semibold">{error}</p>
        <Button onClick={() => window.location.reload()} className="bg-green-600 text-white">
          Try Again
        </Button>
      </div>
    );
  }

  return <FilePreviewContent url={processedUrl} mimeType={mimeType} fileName={file.name} />;
};

const FilePreview: React.FC<{ file: FileEntryResponse }> = ({ file }) => {
  const { publicKey, signMessage } = useWallet();
  const { setNotification } = useNotification();
  const { isMobile } = useDevice();

  const mimeType = useMemo(() => {
    if (!isFileType(file)) return 'application/octet-stream';
    return getMimeType(file.name, file.mimeType || 'application/octet-stream');
  }, [file]);

  const handleDownload = () => {
    if (!signMessage) {
      setNotification({
        type: 'error',
        title: 'Download Error',
        message: 'Failed to download file. Please try again.',
      });
      return;
    }
    handleDownloadClicked(file, setNotification, publicKey, signMessage);
  };

  if (!isFileType(file)) {
    return <div className="text-black">Preview not available for folders</div>;
  }

  const isPdfOrOffice = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.ms-excel',
    'application/vnd.ms-powerpoint',
  ].includes(mimeType);

  if (file.isPrivate) {
    if (isPdfOrOffice) {
      return (
        <div
          className={`flex flex-col items-center justify-center space-y-4 p-4 bg-gray-50 rounded ${isMobile ? 'h-[50vh]' : 'h-[70vh]'}`}
        >
          <FileIcon className="w-12 h-12 text-gray-400" />
          <p className="text-base font-semibold text-black text-center">
            Preview not supported for encrypted {mimeType.split('/')[1].toUpperCase()} files
          </p>
          <Button
            onClick={handleDownload}
            className="flex items-center bg-black hover:bg-gray-800 text-white text-sm px-4 py-2"
          >
            <Download className="mr-2" size={14} />
            Download {file.name}
          </Button>
        </div>
      );
    }
    return <PrivateFilePreview file={file} mimeType={mimeType} />;
  }

  return <FilePreviewContent url={file.url} mimeType={mimeType} fileName={file.name} />;
};

export default FilePreview;
