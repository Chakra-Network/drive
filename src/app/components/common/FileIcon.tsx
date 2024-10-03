// src/app/components/common/OptimizedFileIcon.tsx

import ImageWithFallback from '@/app/components/common/ImageWithFallback';
import { FileEntryResponse } from '@/types';
import Image from 'next/image';
import React from 'react';

interface FileIconProps {
  file: FileEntryResponse;
  className: string;
}

const FileIcon: React.FC<FileIconProps> = ({ file, className }) => {
  const iconPath = '/file-icons/';

  if (file.mimeType === 'application/vnd.chakradrive.folder') {
    return (
      <Image
        src={`${iconPath}folder.png`}
        alt="folder"
        className={className}
        width={45}
        height={45}
      />
    );
  }

  const extension = file.name.split('.').pop()?.toLowerCase();
  const iconSrc = `${iconPath}${extension}.png`;

  return (
    <ImageWithFallback
      src={iconSrc}
      fallbackSrc={`${iconPath}file.png`}
      alt="file icon"
      className={className}
    />
  );
};

export default FileIcon;
