import FileIcon from '@/app/components/common/FileIcon';
import { LOCATION_ICONS } from '@/lib/consts';
import { formatDate, formatFileName } from '@/lib/utils';
import { FileEntryResponse } from '@/types';
import bytes from 'bytes';
import { LockKeyhole } from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import AllFileActionsMenu from './FileActions/AllFileActionsMenu';

function isFileType(
  file: FileEntryResponse
): file is FileEntryResponse & { type: 'file'; size: number } {
  return file.type === 'file' && 'size' in file;
}

export default function FileGridItem({
  file,
  setSelectedFile,
  setVisibleFiles,
}: {
  file: FileEntryResponse;
  setSelectedFile: React.Dispatch<React.SetStateAction<FileEntryResponse | undefined>>;
  setVisibleFiles: React.Dispatch<React.SetStateAction<FileEntryResponse[]>>;
}) {
  const getFileSize = () => {
    if (isFileType(file)) {
      return bytes(file.size);
    }
    return file.type === 'folder' ? 'Folder' : 'N/A';
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      setSelectedFile(file);
    }
  };

  return (
    <div
      id={`${file.id}grid`}
      className="bg-white rounded-lg p-4 shadow-md border border-gray-200 flex flex-col justify-between"
    >
      <div className="flex flex-row items-center justify-between">
        <button
          type="button"
          className="flex flex-row gap-2 justify-start hover:cursor-pointer hover:underline relative"
          onClick={() => setSelectedFile(file)}
          onKeyDown={handleKeyDown}
        >
          <FileIcon file={file} className="h-[24px] w-[24px]" />
          {file.isPrivate && (
            <LockKeyhole className="absolute left-[1rem] top-[1rem]  w-3 h-3 text-gray-400" />
          )}
          <h3 className="font-semibold break-words break-all text-black">
            {formatFileName(file.name)}
          </h3>
        </button>
        <AllFileActionsMenu file={file} setVisibleFiles={setVisibleFiles} />
      </div>
      <div className="flex flex-row items-center justify-between">
        <p className="text-sm text-gray-400">
          {getFileSize()}
          {'  '}
          {formatDate(file.createdAt)}
        </p>
        <Image src={LOCATION_ICONS.Irys} alt="location" className="mr-1" width={24} height={24} />
      </div>
    </div>
  );
}
