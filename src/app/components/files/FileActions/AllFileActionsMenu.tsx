import { fetchAndDecryptMultipartBytes } from '@/app/components/client_lib/lit_encryption';
import DeleteFile from '@/app/components/common/DeleteFile';
import ShareFile from '@/app/components/common/ShareFile';
import RenameFileDialog from '@/app/components/files/RenameFileDialog';
import { isFileType } from '@/app/components/files/UploadProgress';
import { Button } from '@/app/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { NotificationParams, useNotification } from '@/context/notification';
import apiClient from '@/lib/api-client';
import { FileEntryResponse } from '@/types';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { saveAs } from 'file-saver';
import { Copy, Download, EllipsisVertical, PenLine, Share, Trash } from 'lucide-react';
import React, { useState } from 'react';

interface AllFileActionsMenuProps {
  file: FileEntryResponse;
  setVisibleFiles: React.Dispatch<React.SetStateAction<FileEntryResponse[]>>;
}
export const handleDownloadClicked = async (
  file: FileEntryResponse,
  setNotification: (params: NotificationParams) => void,
  publicKey: PublicKey | null,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
) => {
  if (!isFileType(file) || !file.url) {
    setNotification({
      type: 'error',
      title: 'Download Error',
      message: 'Failed to download file',
    });
    throw new Error('File URL not available');
  }

  try {
    let fileData: Blob;
    if (file.isPrivate) {
      if (!publicKey) {
        throw new Error('Public key not available');
      }
      setNotification({
        type: 'success',
        title: 'Decrypting file from Lit Protocol.',
        message: 'Download will begin shortly.',
      });
      const decryptedData = await fetchAndDecryptMultipartBytes(
        file.url,
        publicKey,
        file.privateVersion,
        signMessage,
        () => {
          setNotification({
            type: 'error',
            title: 'Download Error',
            message: 'Failed to decrypt file from Lit.',
          });
        }
      );
      fileData = new Blob([decryptedData], { type: file.mimeType });
    } else {
      const response = await fetch(file.url);
      fileData = await response.blob();
    }

    saveAs(fileData, file.name || 'download');
  } catch (error) {
    setNotification({
      type: 'error',
      title: 'Download Error',
      message: file.isPrivate ? 'Failed to decrypt file from Lit.' : 'Failed to download file',
    });
    throw error;
  }
};

export default function AllFileActionsMenu({ file, setVisibleFiles }: AllFileActionsMenuProps) {
  const [shareFileOpen, setShareFileOpen] = useState(false);
  const [deleteFileOpen, setDeleteFileOpen] = useState(false);
  const [renameFileOpen, setRenameFileOpen] = useState(false);
  const { setNotification } = useNotification();

  const handleShareClicked = () => {
    setShareFileOpen(true);
  };

  const handleDuplicateClicked = async () => {
    try {
      const response = await apiClient.fileentry.duplicate({
        id: file.id,
        name: `Copy of ${file.name}`,
      });
      if (response.data.success) {
        setVisibleFiles(prevFiles => [...prevFiles, response.data.data]);
        setNotification({
          type: 'success',
          title: 'File Duplicated',
          message: `${file.name} has been successfully duplicated`,
        });
      }
    } catch (error) {
      console.error('Error duplicating file:', error);
      setNotification({
        type: 'error',
        title: 'Duplication Error',
        message: `Failed to duplicate ${file.name}`,
      });
    }
  };

  const handleRenameClicked = () => {
    setRenameFileOpen(true);
  };

  const handleDeleteClicked = () => {
    setDeleteFileOpen(true);
  };

  const handleFileDeleted = () => {
    setDeleteFileOpen(false);
    setVisibleFiles(prevFiles => prevFiles.filter(f => f.id !== file.id));
  };

  const { publicKey, signMessage } = useWallet();

  return (
    <>
      {shareFileOpen && (
        <ShareFile file={file} zIndex={52} onClose={() => setShareFileOpen(false)} />
      )}
      {deleteFileOpen && (
        <DeleteFile
          file={file}
          isSoftDelete
          onClose={() => setDeleteFileOpen(false)}
          onDelete={handleFileDeleted}
        />
      )}
      {renameFileOpen && (
        <RenameFileDialog
          file={file}
          onClose={() => setRenameFileOpen(false)}
          setVisibleFiles={setVisibleFiles}
        />
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <EllipsisVertical className="h-5 w-6 text-[#707D75]" />
            <span className="sr-only">Open {file.type} actions menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {!file.isPrivate && file.type !== 'folder' && (
            <DropdownMenuItem onClick={handleShareClicked} className="cursor-pointer">
              <Share className="mr-2 h-4 w-4" />
              <span>Share this {file.type}</span>
            </DropdownMenuItem>
          )}
          {file.type === 'file' && signMessage && (
            <DropdownMenuItem
              onClick={() => handleDownloadClicked(file, setNotification, publicKey, signMessage)}
              className="cursor-pointer"
            >
              <Download className="mr-2 h-4 w-4" />
              <span>Download</span>
            </DropdownMenuItem>
          )}
          {file.type === 'file' && (
            <DropdownMenuItem onClick={handleDuplicateClicked} className="cursor-pointer">
              <Copy className="mr-2 h-4 w-4" />
              <span>Duplicate</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleRenameClicked} className="cursor-pointer">
            <PenLine className="mr-2 h-4 w-4" />
            <span>Rename {file.type}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDeleteClicked} className="cursor-pointer">
            <Trash className="mr-2 h-4 w-4" />
            <span>Delete {file.type}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
