import DelayedComponent from '@/app/components/common/DelayedComponent';
import Popup from '@/app/components/common/Popup';
import { env } from '@/app/utils/env';
import { FolderPlus } from 'lucide-react';
import React, { KeyboardEvent, useCallback, useRef, useState } from 'react';

interface FileUploadProps {
  onFileUpload: (files: File[], isPrivate: boolean) => void;
  disableUploadOptionModal?: boolean;
}

export default function FileUpload({ onFileUpload, disableUploadOptionModal }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showPublicPrivatePopup, setShowPublicPrivatePopup] = useState(false);
  const resolver = useRef<(isPrivate: boolean) => void>();
  const rejecter = useRef<() => void>();

  const handleFileUpload = useCallback(
    async (files: FileList | null, isPrivateUpload: boolean) => {
      if (!files || files.length === 0) return;
      setIsUploading(true);

      const filesToUpload = Array.from(files);
      onFileUpload(filesToUpload, isPrivateUpload);

      setIsUploading(false);
    },
    [onFileUpload]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleUploadWithConfirmation = async (files: FileList) => {
    if (env.NEXT_PUBLIC_ENABLE_PRIVATE_FILE_UPLOAD && !disableUploadOptionModal) {
      const confirmPromise = new Promise<boolean>((resolve, reject) => {
        resolver.current = resolve;
        rejecter.current = reject;
      });
      setShowPublicPrivatePopup(true);
      try {
        const result = await confirmPromise;
        setShowPublicPrivatePopup(false);

        handleFileUpload(files, result);
      } catch {
        // User cancelled the upload
      }
    } else {
      handleFileUpload(files, false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const { files } = e.dataTransfer;
    await handleUploadWithConfirmation(files);
  };

  const handleClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = e => {
      const { files } = e.target as HTMLInputElement;
      handleUploadWithConfirmation(files!);
    };
    input.click();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  };

  return (
    <DelayedComponent delay={400}>
      <div
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center w-full h-full bg-[#142A1D0A] mt-4 rounded-2xl border hover:cursor-pointer ${
          isDragging ? 'border-green-500' : 'border-[#B9B9B94D]'
        }`}
        role="button"
        tabIndex={0}
        aria-label="Upload files"
      >
        <div className="text-center justify-center">
          <FolderPlus className="text-green-500 w-20 h-20 self-center mx-auto" />
          <p className="text-primary text-2xl font-semibold">
            {isUploading ? 'Uploading...' : 'Drop Files to upload'}
          </p>
          <p className="text-secondary">or click to select files</p>
        </div>
      </div>
      {showPublicPrivatePopup && (
        <Popup
          zIndex={1000}
          alignItems="center"
          onClose={() => {
            rejecter.current?.();
            setShowPublicPrivatePopup(false);
          }}
        >
          <div className="flex flex-col items-center gap-6 p-8 rounded-lg min-w-[400px] bg-white shadow-md">
            <h2 className="text-xl font-semibold text-[#142A1D]">Select Upload Option:</h2>
            <div className="flex justify-center gap-4">
              <button
                className="px-6 py-2 text-white bg-[#28a745] hover:bg-[#218838] rounded-lg transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#28a745] focus:ring-opacity-50 shadow-sm"
                type="button"
                onClick={() => {
                  resolver.current?.(false);
                  setShowPublicPrivatePopup(false);
                }}
              >
                Public
              </button>
              <button
                className="px-6 py-2 text-[#28a745] bg-white border border-[#28a745] hover:bg-[#f8f9fa] rounded-lg transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#28a745] focus:ring-opacity-50"
                type="button"
                onClick={() => {
                  resolver.current?.(true);
                  setShowPublicPrivatePopup(false);
                }}
              >
                Private
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">Public uploads are visible to everyone</p>
          </div>
        </Popup>
      )}
    </DelayedComponent>
  );
}
