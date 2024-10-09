import FileIcon from '@/app/components/common/FileIcon';
import FileActionsMenu from '@/app/components/files/FileActions';
import { formatDate, formatFileName } from '@/lib/utils';
import { FileEntryResponse } from '@/types';
import bytes from 'bytes';
import { LockKeyhole } from 'lucide-react';
import React from 'react';

interface FileListItemProps {
  file: FileEntryResponse;
  setSelectedFile: React.Dispatch<React.SetStateAction<FileEntryResponse | undefined>>;
  setVisibleFiles: React.Dispatch<React.SetStateAction<FileEntryResponse[]>>;
}

export default function FileListItem({
  file,
  setSelectedFile,
  setVisibleFiles,
}: FileListItemProps) {
  const getFileSize = () => {
    if (file.type === 'file') {
      return bytes(file.size);
    }
    return 'Folder';
  };

  const getFileType = () => {
    if (file.type === 'folder') {
      return 'Folder';
    }
    if (file.mimeType) {
      const [, subtype] = file.mimeType.split('/');
      // if there's a '.' in the subtype, only return the part after the LAST '.'
      if (subtype.includes('.')) {
        return subtype.split('.').pop()?.toUpperCase();
      }
      return subtype.toUpperCase();
    }
    return 'Unknown';
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      setSelectedFile(file);
    }
  };

  return (
    <tr
      id={`${file.id}list`}
      className="border-b border-[#B9B9B999] border-opacity-[60%]"
      role="row"
    >
      <td className="py-3 text-primary font-semibold max-w-[350px] break-all" role="cell">
        <button
          type="button"
          className="flex flex-row items-center hover:cursor-pointer hover:underline w-full text-left relative"
          onClick={() => setSelectedFile(file)}
          onKeyDown={handleKeyDown}
        >
          <FileIcon file={file} className="h-[45px] w-[45px] mr-2" />
          {file.isPrivate && (
            <LockKeyhole className="absolute left-[1.7rem] bottom-[-6px] w-5 h-5 text-gray-400" />
          )}
          <span className="sr-only">{file.type === 'folder' ? 'Folder' : 'File'}: </span>
          {formatFileName(file.name)}
        </button>
      </td>
      <td className="py-3 text-secondary" role="cell">
        {getFileSize()}
      </td>
      <td className="py-3 text-secondary" role="cell">
        {formatDate(file.createdAt)}
      </td>
      <td className="py-3 text-secondary" role="cell">
        {getFileType()}
      </td>
      <td className="py-3 text-secondary" role="cell">
        <FileActionsMenu file={file} setVisibleFiles={setVisibleFiles} />
      </td>
    </tr>
  );
}
