import FileIcon from '@/app/components/common/FileIcon';
import Popup from '@/app/components/common/Popup';
import ShareFile from '@/app/components/common/ShareFile';
import FilePreview from '@/app/components/files/FilePreview';
import { useDevice } from '@/context/device';
import { LOCATION_ICONS } from '@/lib/consts';
import { formatAddress, formatDate, formatFileName } from '@/lib/utils';
import { FileEntryResponse } from '@/types';
import bytes from 'bytes';
import { X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useCallback, useState } from 'react';
import TipButton from '../TipButton';
import FileActionsMenu from './FileActions';

function isFileType(
  file: FileEntryResponse
): file is FileEntryResponse & { type: 'file'; size: number } {
  return file.type === 'file' && 'size' in file;
}

function FileMetric({ label, metric, href }: { label: string; metric: string; href?: string }) {
  const { isMobile } = useDevice();
  let content;

  const irysContent = (
    <>
      <Image src={LOCATION_ICONS.Irys} alt="location" width={24} height={24} />
      Irys
    </>
  );

  if (label === 'Stored in') {
    content = href ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-row gap-3 items-center hover:underline"
      >
        {irysContent}
      </a>
    ) : (
      <div className="flex flex-row gap-3 items-center">{irysContent}</div>
    );
  } else {
    content = href ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-row gap-3 items-center hover:underline"
      >
        {metric}
      </a>
    ) : (
      metric
    );
  }

  if (isMobile) {
    return (
      <div className="py-[6px] flex flex-row justify-between">
        <p className="text-secondary opacity-60 text-xs">{label}</p>
        <div className="text-primary text-sm font-semibold">{content}</div>
      </div>
    );
  }

  return (
    <div className="py-[20px]">
      <p className="text-secondary opacity-60 text-xs">{label}</p>
      <div className="text-primary text-sm font-semibold">{content}</div>
    </div>
  );
}

interface FileDialogProps {
  file: FileEntryResponse | undefined;
  setVisibleFiles: React.Dispatch<React.SetStateAction<FileEntryResponse[]>>;
  onClose: () => void;
  isNotOwner?: boolean;
  currentPath: string[];
}

function FileDialog({ file, setVisibleFiles, onClose, isNotOwner, currentPath }: FileDialogProps) {
  const [shared, setShared] = useState(false);
  const router = useRouter();
  const { isMobile } = useDevice();

  const handleShare = () => {
    setShared(true);
  };

  const handleFolderClick = useCallback(() => {
    if (file && file.type === 'folder') {
      router.push(`/${[...currentPath, file.id].join('/')}`);
      onClose();
    }
  }, [file, currentPath, router, onClose]);

  if (!file) return null;

  const getFileSize = () => {
    if (isFileType(file)) {
      return bytes(file.size);
    }
    return file.type === 'folder' ? 'Folder' : 'N/A';
  };

  if (isMobile) {
    return (
      <>
        {shared && <ShareFile file={file} zIndex={52} onClose={() => setShared(false)} />}
        <Popup zIndex={50} alignItems="end" onClose={onClose}>
          <div
            className="bg-white rounded-t-md h-[93vh] flex flex-col min-w-[100vw] overflow-y-scroll"
            style={{ zIndex: 51 }}
          >
            <div className="flex flex-col p-4 bg-gray-50">
              <div className="flex flex-row justify-between gap-2 items-center pb-4">
                <div className="flex flex-row gap-2">
                  <FileIcon file={file} className="h-[32px] w-[32px] -mt-1" />
                  <h1 className="text-primary font-semibold text-lg overflow-x-scroll text-nowrap">
                    {formatFileName(file.name, 22)}
                  </h1>
                </div>
                <div className="flex flex-row gap-4">
                  <FileActionsMenu file={file} setVisibleFiles={setVisibleFiles} />
                  <button type="button" onClick={onClose} className="border-l border-gray-200 pl-4">
                    <X size={24} color="gray" />
                  </button>
                </div>
              </div>
              <div className="flex flex-grow justify-center items-center">
                <FilePreview file={file} />
              </div>
            </div>
            <div className="p-4">
              <div className="mt-2">
                <h1 className="text-primary font-semibold text-xl break-words break-all">
                  {file.name}
                </h1>
                <FileMetric label="Size" metric={getFileSize()} />
                <FileMetric label="Uploaded last" metric={formatDate(file.createdAt)} />
                <FileMetric
                  label="Stored in"
                  metric="Irys"
                  href={isFileType(file) && file.url && !file.isPrivate ? file.url : undefined}
                />
                <FileMetric
                  label="Uploaded by"
                  metric={formatAddress(file.ownerPK)}
                  href={`https://explorer.solana.com/address/${file.ownerPK}`}
                />
                {file.isPubliclyShared && (
                  <FileMetric
                    label="Public Share Link"
                    metric={`${window.location.origin}/share/${file.publicShareId}`}
                    href={`${window.location.origin}/share/${file.publicShareId}`}
                  />
                )}
              </div>
              <div className="flex flex-row justify-between gap-2 items-cente pt-8">
                <div />
                <div className="flex flex-row items-center">
                  {!isNotOwner && !file.isPrivate && (
                    <button
                      type="button"
                      className="btn-tertiary font-semibold !py-1"
                      onClick={handleShare}
                    >
                      Share
                    </button>
                  )}
                </div>
              </div>
              {isNotOwner && file.type === 'file' && (
                <TipButton
                  fileId={file.id}
                  fileName={file.name}
                  recipientPublicKey={file.ownerPK}
                />
              )}
              {file.type === 'folder' && (
                <button
                  type="button"
                  onClick={handleFolderClick}
                  className="mt-4 btn-primary w-full"
                >
                  Open Folder
                </button>
              )}
            </div>
          </div>
        </Popup>
      </>
    );
  }

  return (
    <>
      {shared && <ShareFile file={file} zIndex={52} onClose={() => setShared(false)} />}
      <Popup zIndex={50} alignItems="end" onClose={onClose}>
        <div
          className="bg-white rounded-t-lg h-[93vh] grid grid-cols-[70%_30%] min-w-[100vw]"
          style={{ zIndex: 51 }}
        >
          <div className="flex flex-col p-4 bg-gray-50 border-r border-r-gray-200 rounded-lg">
            <div className="flex flex-row items-start gap-2">
              <button type="button" onClick={onClose} className="border-r border-gray-200 pr-4">
                <X size={24} color="gray" />
              </button>
              <FileIcon file={file} className="h-[32px] w-[32px] ml-4 -mt-1" />
              <h1 className="text-primary font-semibold text-lg overflow-x-scroll">{file.name}</h1>
            </div>
            <div className="flex flex-grow justify-center items-center">
              <FilePreview file={file} />
            </div>
          </div>
          <div className="p-4">
            <div className="flex flex-row justify-between gap-2 items-center">
              <div />
              <div className="flex flex-row items-center">
                {!isNotOwner && !file.isPrivate && (
                  <button
                    type="button"
                    className="btn-tertiary font-semibold !py-1"
                    onClick={handleShare}
                  >
                    Share
                  </button>
                )}
                <FileActionsMenu file={file} setVisibleFiles={setVisibleFiles} />
              </div>
            </div>
            <div className="mt-8">
              <h1 className="text-primary font-semibold text-xl break-words break-all">
                {file.name}
              </h1>
              <FileMetric label="Size" metric={getFileSize()} />
              <FileMetric label="Uploaded last" metric={formatDate(file.createdAt)} />
              <FileMetric
                label="Stored in"
                metric="Irys"
                href={isFileType(file) && file.url && !file.isPrivate ? file.url : undefined}
              />
              <FileMetric
                label="Uploaded by"
                metric={formatAddress(file.ownerPK)}
                href={`https://explorer.solana.com/address/${file.ownerPK}`}
              />
              {file.isPubliclyShared && (
                <FileMetric
                  label="Public Share Link"
                  metric={`${window.location.origin}/share/${file.publicShareId}`}
                  href={`${window.location.origin}/share/${file.publicShareId}`}
                />
              )}
            </div>
            {isNotOwner && file.type === 'file' && (
              <TipButton fileId={file.id} fileName={file.name} recipientPublicKey={file.ownerPK} />
            )}
            {file.type === 'folder' && (
              <button type="button" onClick={handleFolderClick} className="mt-4 btn-primary w-full">
                Open Folder
              </button>
            )}
          </div>
        </div>
      </Popup>
    </>
  );
}

export default FileDialog;
